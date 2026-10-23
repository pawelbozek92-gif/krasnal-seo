#!/usr/bin/env bash
# Smoke test for public/api/contact.php using PHP's built-in server.
# Requires PHP 7.4+ on PATH (Linux/macOS). Mail is captured by a fake sendmail, never sent.
#   bash tests/php/contact-smoke.sh
set -euo pipefail

PORT=8099
URL="http://127.0.0.1:${PORT}/api/contact.php"
CONFIG=public/api/contact-config.php
MAILLOG=$(mktemp)
fail=0

php -l public/api/contact.php

cat > "$CONFIG" <<'PHP'
<?php return ['recipient' => 'test@example.com', 'from' => 'noreply@example.com'];
PHP

# Fake sendmail: accepts any arguments (PHP passes -t -i and the handler's -f<sender>) and appends the message.
FAKE_SENDMAIL=$(mktemp)
printf '#!/bin/sh\ncat >> "%s"\n' "$MAILLOG" > "$FAKE_SENDMAIL"
chmod +x "$FAKE_SENDMAIL"

php -d "sendmail_path=${FAKE_SENDMAIL}" -S 127.0.0.1:${PORT} -t public >/dev/null 2>&1 &
SERVER=$!
cleanup() { kill "$SERVER" 2>/dev/null || true; rm -f "$CONFIG" "$MAILLOG" "$FAKE_SENDMAIL"; }
trap cleanup EXIT
for _ in $(seq 1 30); do curl -s -o /dev/null "http://127.0.0.1:${PORT}/" && break; sleep 0.2; done

old=$(( ($(date +%s) - 60) * 1000 ))
valid=(-F name="Jan Testowy" -F company="Test" -F website="test.pl" -F email="jan@test.pl"
       -F budget="nie-wiem" -F message="Wiadomość testowa." -F consent="tak" -F started_at="$old"
       -F pricing_config="Pakiet: GROWTH" -F source="kontakt")

expect() { # name, expected status, curl args...
  local name=$1 want=$2; shift 2
  local got
  got=$(curl -s -o /dev/null -w '%{http_code}' -H 'Accept: application/json' "$@")
  if [ "$got" = "$want" ]; then echo "ok   $name ($got)"; else echo "FAIL $name: expected $want, got $got"; fail=1; fi
}

expect "GET is rejected"            405 "$URL"
expect "empty POST is invalid"      422 -X POST "$URL"
expect "bad e-mail is invalid"      422 "${valid[@]}" -F email="nope" "$URL"
expect "unknown budget is invalid"  422 "${valid[@]}" -F budget="1000000" "$URL"
expect "missing consent is invalid" 422 -F name="Jan Testowy" -F company="Test" -F website="test.pl" -F email="jan@test.pl" -F budget="nie-wiem" -F message="Wiadomość testowa." "$URL"
expect "instant submit is rejected" 422 "${valid[@]}" -F started_at="$(( $(date +%s) * 1000 ))" "$URL"
expect "honeypot looks successful"  200 "${valid[@]}" -F fax="spam" "$URL"
expect "valid submission is sent"   200 "${valid[@]}" "$URL"

# Exactly one mail (the valid one); honeypot must not send.
mails=$(grep -c '^To: test@example.com' "$MAILLOG" || true)
if [ "$mails" = "1" ]; then echo "ok   one mail delivered"; else echo "FAIL expected 1 mail, got $mails"; fail=1; fi
grep -q 'Reply-To: jan@test.pl' "$MAILLOG" && echo "ok   Reply-To set" || { echo "FAIL Reply-To missing"; fail=1; }
grep -q 'Pakiet: GROWTH' "$MAILLOG" && echo "ok   pricing config included" || { echo "FAIL pricing config missing"; fail=1; }

# Header injection attempt must not add headers.
expect "header injection is rejected" 422 "${valid[@]}" -F email=$'jan@test.pl\r\nBcc: x@evil.test' "$URL"

# Without Accept: application/json the handler redirects (no-JS fallback).
code=$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "${valid[@]}" "$URL")
[[ "$code" == 303*"/dziekujemy/" ]] && echo "ok   no-JS redirect ($code)" || { echo "FAIL no-JS redirect: $code"; fail=1; }

exit $fail
