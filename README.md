# Planly — Marketing Budget Planner

Responsywna aplikacja do planowania budżetu marketingowego, zgodna z głównym przepływem załączonego PRD. Interfejs w języku polskim, React 19 i Vite 6.

## Uruchomienie

Wymagany Node.js 22.12+ (zweryfikowano na Node.js 24). `npm run dev` uruchamia Vite na porcie 5173 i API na 3001.

```sh
npm ci
npm run dev -- --port 5173
```

```sh
npm test       # testy obliczeń i ograniczeń budżetu
npm run build # produkcyjny katalog dist/
npm run preview # sam podgląd frontendu; API uruchamia npm run dev
npm start       # frontend produkcyjny i API na porcie 3000
```

## Funkcje

- Lista planów, miesiąc/kwartał/rok, waluty PLN/EUR/USD/GBP, profile firm i wiele rynków.
- Pozycje kosztowe z własnymi kategoriami, rodzajem kosztu, kwotą, udziałem w planie i rynku, blokadami oraz limitami.
- Automatyczne rozdzielanie środków z zachowaniem blokad i limitów, rezerwa, wykrywanie konfliktów.
- Modele e-commerce/B2C, B2B, usług i subskrypcji; edytowalne CPC, konwersja, marża, wartość transakcji, kwalifikacja leadów, skuteczność sprzedaży i churn.
- ROI uwzględniający wszystkie koszty, odrębny ROAS reklam, próg rentowności, pokrycie prognozą oraz wynik po marketingu.
- Jawne korekty przyrostowości i nakładania odbiorców. Malejące efekty powyżej indywidualnego limitu skali.
- Rekomendacje regułowe z uzasadnieniem, zasobami, założeniami, ryzykiem i horyzontem efektów.
- Scenariusze zachowujące pełny plan i założenia, zapis wersji, porównanie i zastosowanie scenariusza.
- Eksport CSV wybranej wersji; raport z wykresem, prognozą i założeniami przez drukowanie przeglądarki / „Zapisz jako PDF”.
- Tryb demonstracyjny z localStorage oraz konta firmowe z automatycznym zapisem na serwerze.
- Rejestracja, logowanie, wylogowanie, sesje HttpOnly/SameSite, hasła scrypt i limit prób logowania.
- Izolacja firm po stronie serwera, role właściciela/edytora/odczytu, jednorazowe kody zaproszeń ważne 7 dni.
- Interfejs mobilny, obsługa klawiatury i pułapka fokusu w modalach.

## Zakres i ograniczenia

Bez logowania aplikacja działa jako lokalny plan demonstracyjny. Przycisk „Moje konto” pozwala utworzyć firmę lub dołączyć kodem zaproszenia. Po zalogowaniu odczyt i zapis korzystają z API, które ustala firmę na podstawie sesji, nigdy na podstawie identyfikatora przesłanego przez klienta. Właściciel tworzy zaproszenia dla edytorów i czytelników.

Backend Express przechowuje dane w lokalnym pliku `.data/store.json` (ignorowanym przez Git), zapisywanym atomowo. `PLANLY_DATA_DIR` zmienia lokalizację danych. To rozwiązanie dla pojedynczego procesu serwera; nie obsługuje wielu instancji ani rozwiązywania konfliktów jednoczesnych edycji. Publiczne wdrożenie wymaga trwałego wolumenu oraz terminacji TLS przez reverse proxy; tryb produkcyjny ustawia ciasteczka Secure. Nie ma resetowania hasła przez e-mail ani automatycznej wysyłki zaproszeń.

Przykładowy plan jest demonstracyjny. Parametry są ręcznymi założeniami, nie zweryfikowanymi benchmarkami. Zakres ±25% jest ilustracyjną analizą wrażliwości, nie statystycznym przedziałem ufności. Wykres pokazuje skumulowane wyniki równomiernie w czasie; nie modeluje sezonowości ani opóźnienia sprzedaży. Profil firmy przechowuje sezonowość i możliwości obsługi jako kontekst, bez automatycznego wpływu na prognozę. Wybór waluty zmienia jednostkę, nie przelicza kursów. Koszty pozycji oznaczają całą kwotę w okresie planu, niezależnie od rodzaju kosztu. Dla subskrypcji wartość transakcji oznacza miesięczny przychód klienta.

Działania bez prognozy finansowej nadal obciążają całkowity wynik. Źródła i założenia należy zweryfikować przed decyzją inwestycyjną. Eksport CSV pozwala przechować kopię danych; wyczyszczenie pamięci przeglądarki usuwa lokalne plany demonstracyjne, ale nie firmowe dane na serwerze.

## Sprawdzone ścieżki

Testy jednostkowe: obliczanie ROI, zerowy budżet, e-commerce i B2B, malejące efekty, blokady i limity, konflikty, korekta przypisania, subskrypcja i eksport CSV. W przeglądarce Chromium zweryfikowano edycję kwot, automatyczny podział, nową pozycję, scenariusze, rynki, parametry B2B, pobranie CSV, trwałość zapisu po odświeżeniu i układ mobilny. Dodatkowy test integracyjny API sprawdza izolację dwóch firm, role właściciela/edytora/czytelnika, odrzucenie niepoprawnych danych, jednorazowość zaproszeń, logowanie i unieważnianie sesji. W Chromium zweryfikowano również rejestrację, zapis serwerowy po odświeżeniu, generowanie zaproszenia, wylogowanie i raport PDF.

## Publikacja przez GitHub Pages

Repozytorium zawiera workflow `.github/workflows/pages.yml`. Po każdym pushu na `main` GitHub Actions instaluje zależności, wykonuje testy i publikuje statyczną wersję Planly.

Jednorazowa konfiguracja w GitHub:

1. Otwórz **Settings → Pages** w repozytorium `mag-VA/alkmag`.
2. W sekcji **Build and deployment → Source** wybierz **GitHub Actions**.
3. W **Actions → Publish Planly to GitHub Pages → Run workflow** uruchom publikację (lub wyślij kolejny commit do `main`).
4. Po pomyślnym wdrożeniu adres będzie widoczny w **Settings → Pages** i przy jobie `deploy`. Standardowy adres projektu to `https://mag-va.github.io/alkmag/`.

GitHub Pages publikuje wyłącznie statyczne pliki. W tej wersji działa edytor, prognozy, scenariusze, zapis w przeglądarce i eksport CSV/PDF. Panel kont wyjaśnia lokalny sposób zapisu; aplikacja nie wysyła żądań do nieistniejącego backendu. Konta, role i firmowy zapis serwerowy działają po uruchomieniu pełnej wersji poleceniem `npm run dev` / `npm start` na serwerze Node.js.

Lokalna weryfikacja wersji Pages:

```sh
npm run build:pages
npm run preview:pages -- --port 4173
# Otwórz ścieżkę /alkmag/ na serwerze podglądu.
```

`.env.github-pages` ustawia ścieżkę zasobów `/alkmag/`, więc skrypty, style, fonty i favicon działają na stronie projektu. Przy publikacji pod własną domeną ustaw `VITE_BASE_PATH=/` w kroku budowania. Zwykłe `npm run build` nadal używa ścieżki `/` i pełnej obsługi API.

Pliki mają kodowanie **UTF-8**, określone również w `.editorconfig` i `<meta charset="UTF-8">`. Eksport CSV zawiera znacznik BOM UTF-8, dzięki czemu Excel prawidłowo odczytuje polskie znaki. Fonty i ikony są dołączone do kompilacji, bez zależności od zewnętrznego serwera fontów. Dostępność Pages dla repozytorium prywatnego zależy od planu GitHub i ustawień organizacji.
