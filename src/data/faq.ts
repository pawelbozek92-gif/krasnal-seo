export interface FaqItem {
  q: string;
  a: string;
}

/** Shown under the pricing (and marked up as FAQPage on /cennik/). */
export const pricingFaq: FaqItem[] = [
  {
    q: 'Dlaczego abonament, a nie płatność za efekt?',
    a: 'Na pozycje w Google wpływa wiele czynników poza moją kontrolą: aktualizacje algorytmu, działania konkurencji, decyzje po Twojej stronie. Model „płatność za efekt” zwykle kończy się optymalizacją pod łatwe, mało wartościowe frazy. W abonamencie płacisz za konkretny, raportowany czas eksperta, a efekty mierzymy uzgodnionymi KPI: zapytaniami z wyszukiwarki i ruchem non-brand.',
  },
  {
    q: 'Ile czasu trzeba czekać na efekty?',
    a: 'Pierwsze zmiany techniczne i optymalizacja istniejących stron często dają sygnały w ciągu 4–8 tygodni. Wyraźny wzrost ruchu i zapytań to zwykle perspektywa 4–6 miesięcy, w konkurencyjnych branżach dłużej. Dlatego okres startowy to 3 miesiące, a postępy widzisz w każdym miesięcznym raporcie.',
  },
  {
    q: 'Czy mogę zrezygnować?',
    a: 'Tak. Po 3-miesięcznym okresie startowym współpraca trwa z miesiąca na miesiąc, z 1-miesięcznym okresem wypowiedzenia. Bez kar umownych i bez długich zobowiązań.',
  },
  {
    q: 'Co dokładnie dostaję w raporcie?',
    a: 'Co miesiąc: zestawienie uzgodnionych KPI (leady organiczne, kliknięcia non-brand, widoczność kluczowych grup fraz), listę wykonanych prac z liczbą wykorzystanych godzin, wnioski oraz plan na kolejny miesiąc. Dane pochodzą z Google Search Console, GA4 i narzędzi SEO, a raport omawiamy na krótkiej rozmowie.',
  },
  {
    q: 'Czy pracujesz z firmami spoza Wrocławia?',
    a: 'Tak, pracuję z firmami z całej Polski, zdalnie. Spotykamy się online, a z firmami z Wrocławia i Dolnego Śląska mogę spotkać się także na miejscu.',
  },
  {
    q: 'Kto pisze treści i skąd są linki?',
    a: 'Przygotowuję briefy, strukturę i optymalizację treści. Teksty piszą Twoi eksperci lub sprawdzeni copywriterzy B2B, z którymi współpracuję. Linki pozyskujemy przez digital PR, publikacje eksperckie i wybrane portale branżowe – każdą pozycję akceptujesz wcześniej, a budżet na treści i linki jest zawsze osobny i jawny.',
  },
];

export const homeFaq: FaqItem[] = [
  {
    q: 'Dla jakich firm pracujesz?',
    a: 'Dla firm usługowych B2B zatrudniających od 10 do 250 osób i sprzedających w całej Polsce: software house’ów i firm IT, producentów i firm przemysłowych, logistyki, biur rachunkowych, kancelarii, firm doradczych, SaaS, firm szkoleniowych i rekrutacyjnych.',
  },
  {
    q: 'Czym różni się współpraca z Tobą od agencji?',
    a: 'Nie ma warstwy opiekunów klienta: osoba, która przedstawia ofertę, wykonuje pracę. Każdy pakiet ma określoną liczbę godzin, a raport pokazuje, ile z nich wykorzystałem i na co.',
  },
  {
    q: 'Od czego najlepiej zacząć?',
    a: 'Od audytu SEO z roadmapą na 90 dni albo od bezpłatnej rozmowy. Jeśli w ciągu 30 dni od audytu zdecydujesz się na abonament, 50% ceny audytu zaliczam na poczet współpracy.',
  },
  {
    q: 'Czy jesteś przygotowany na wyszukiwanie z AI?',
    a: 'Tak. Pracuję nad tym, by Twoja firma była rozpoznawalną encją dla Google i modeli AI: uporządkowane dane strukturalne, treści odpowiadające na konkretne pytania klientów oraz wzmianki w wiarygodnych źródłach dzięki digital PR.',
  },
];

export const auditFaq: FaqItem[] = [
  {
    q: 'Jakich dostępów potrzebujesz do audytu?',
    a: 'Dostępu do odczytu w Google Search Console i GA4. Jeśli to możliwe, także do panelu CMS lub środowiska testowego – nie jest to jednak warunek rozpoczęcia audytu.',
  },
  {
    q: 'Czy wdrażasz zmiany z audytu?',
    a: 'Audyt zawiera roadmapę, którą może wdrożyć Twój zespół. Jeśli chcesz, wdrożenie przejmuję w ramach abonamentu – wtedy 50% ceny audytu zaliczam na poczet współpracy (przy podpisaniu umowy w ciągu 30 dni).',
  },
  {
    q: 'Czy audyt obejmuje serwisy wielojęzyczne?',
    a: 'Tak, wtedy dodatkowo sprawdzam hreflang i strukturę wersji językowych. Przy bardzo dużych serwisach zakres i cenę potwierdzam przed startem.',
  },
];
