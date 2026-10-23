<?php
/**
 * Contact form handler for standard shared hosting (PHP 7.4+ with mail()).
 *
 * Configuration (no secrets in the repo): copy contact-config.example.php to
 * contact-config.php ONE LEVEL ABOVE the web root (preferred) or next to this file,
 * and fill in the recipient. The real file is git-ignored.
 *
 * Responds with JSON when the request sends "Accept: application/json"
 * (the site's JS does), otherwise redirects to /dziekujemy/ or back with ?blad=1.
 */
declare(strict_types=1);

$configPaths = [
    dirname(__DIR__, 2) . '/contact-config.php', // outside public_html
    __DIR__ . '/contact-config.php',
];
$config = null;
foreach ($configPaths as $path) {
    if (is_file($path)) {
        $config = require $path;
        break;
    }
}

$wantsJson = stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

function respond(bool $ok, int $status, array $errors = []): void
{
    global $wantsJson;
    http_response_code($status);
    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'errors' => $errors], JSON_UNESCAPED_UNICODE);
    } else {
        header('Location: ' . ($ok ? '/dziekujemy/' : '/kontakt/?blad=1#formularz'), true, 303);
    }
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(false, 405, ['method' => 'Dozwolona jest tylko metoda POST.']);
}
if (!is_array($config) || empty($config['recipient'])) {
    error_log('[contact.php] Missing contact-config.php or recipient.');
    respond(false, 500, ['config' => 'Formularz nie jest skonfigurowany.']);
}

$field = static function (string $name, int $max): string {
    $value = trim((string)($_POST[$name] ?? ''));
    $value = str_replace("\0", '', $value);
    return mb_substr($value, 0, $max);
};
$singleLine = static fn(string $v): string => preg_replace('/[\r\n]+/', ' ', $v);

// Anti-spam: honeypot must be empty, and the form must not be submitted instantly.
if ($field('fax', 100) !== '') {
    respond(true, 200); // pretend success for bots
}
$startedAt = (int)$field('started_at', 20);
if ($startedAt > 0 && (time() * 1000 - $startedAt) < 3000) {
    respond(false, 422, ['form' => 'Formularz wysłano zbyt szybko. Spróbuj ponownie.']);
}

$data = [
    'name' => $singleLine($field('name', 120)),
    'company' => $singleLine($field('company', 160)),
    'website' => $singleLine($field('website', 200)),
    'email' => $singleLine($field('email', 160)),
    'phone' => $singleLine($field('phone', 40)),
    'budget' => $singleLine($field('budget', 40)),
    'message' => $field('message', 5000),
    'pricing_config' => $field('pricing_config', 1500),
    'source' => $singleLine($field('source', 40)),
    'consent' => $field('consent', 10),
];

$allowedBudgets = ['do-3000', '3000-5000', '5000-8000', 'powyzej-8000', 'nie-wiem'];
$errors = [];
if (mb_strlen($data['name']) < 3) $errors['name'] = 'Podaj imię i nazwisko.';
if (mb_strlen($data['company']) < 2) $errors['company'] = 'Podaj nazwę firmy.';
if (!preg_match('/^(https?:\/\/)?([\p{L}\d-]+\.)+\p{L}{2,}(\/\S*)?$/iu', $data['website'])) $errors['website'] = 'Podaj adres strony.';
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Podaj poprawny adres e-mail.';
if ($data['phone'] !== '' && !preg_match('/^[+\d][\d\s()-]{6,}$/', $data['phone'])) $errors['phone'] = 'Podaj poprawny numer telefonu.';
if (!in_array($data['budget'], $allowedBudgets, true)) $errors['budget'] = 'Wybierz budżet.';
if (mb_strlen($data['message']) < 10) $errors['message'] = 'Wiadomość jest za krótka.';
if ($data['consent'] !== 'tak') $errors['consent'] = 'Zgoda jest wymagana.';
if ($errors) respond(false, 422, $errors);

$lines = [
    'Nowe zapytanie ze strony (' . ($data['source'] ?: 'kontakt') . ')',
    '',
    'Imię i nazwisko: ' . $data['name'],
    'Firma: ' . $data['company'],
    'Strona www: ' . $data['website'],
    'E-mail: ' . $data['email'],
    'Telefon: ' . ($data['phone'] ?: '—'),
    'Budżet miesięczny: ' . $data['budget'],
    '',
    'Wiadomość:',
    $data['message'],
];
if ($data['pricing_config'] !== '') {
    array_push($lines, '', 'Konfiguracja z kalkulatora:', $data['pricing_config']);
}
array_push($lines, '', 'Zgoda RODO: tak', 'Data: ' . date('Y-m-d H:i:s'), 'IP: ' . ($_SERVER['REMOTE_ADDR'] ?? '?'));

$subject = '=?UTF-8?B?' . base64_encode('[Krasnal SEO] Zapytanie: ' . $data['company']) . '?=';
$from = $config['from'] ?? ('noreply@' . preg_replace('/^www\./', '', $_SERVER['HTTP_HOST'] ?? 'localhost'));
$headers = [
    'From: Krasnal SEO <' . $from . '>',
    'Reply-To: ' . $data['email'],
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
];

$sent = mail($config['recipient'], $subject, implode("\n", $lines), implode("\r\n", $headers), '-f' . $from);
if (!$sent) {
    error_log('[contact.php] mail() failed');
    respond(false, 500, ['form' => 'Nie udało się wysłać wiadomości.']);
}
respond(true, 200);
