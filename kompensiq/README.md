# KompensIQ — kompensacja mocy biernej

Polskojęzyczna aplikacja pilotażowa oparta na PRD. React + Vite, lokalny backend Express + SQLite (Node.js 24). Osobna aplikacja w katalogu `kompensiq`; nie zastępuje aplikacji Planly.

## Publikacja

GitHub Pages: **https://mag-va.github.io/alkmag/kompensiq/**

Workflow repozytorium buduje najpierw dotychczasową aplikację, następnie KompensIQ i umieszcza ją w podkatalogu `dist/kompensiq`. Pages obsługuje wyłącznie demonstrację z zapisem w localStorage. Nie udostępnia kont, bazy serwerowej ani separacji organizacji. Dane są lokalne dla przeglądarki; mogą zostać usunięte przez jej ustawienia. W Ustawieniach dostępny eksport kopii projektów JSON. Nie umieszczaj w demonstracji rzeczywistych danych osobowych ani poufnych dokumentów.

## Uruchomienie wersji lokalnej

```sh
cd kompensiq
npm ci
npm run build
npm start
# http://127.0.0.1:3000
```

Node.js **24+**. Bez wcześniejszego buildu `npm run dev` udostępnia frontend przez middleware Vite. Lokalny serwer obsługuje jedną organizację i nasłuchuje tylko na loopback. Baza `.data/app.sqlite` nie trafia do Git. Przed aktualizacją wykonaj jej kopię przy zatrzymanym serwerze. Nie wystawiaj serwera do Internetu — ten pilotaż nie ma uwierzytelniania ani ról.

```sh
npm test
npm run build:pages  # samodzielna demonstracja przeglądarkowa
```

## Zaimplementowane

- Lista projektów z wyszukiwaniem, statusem, wskaźnikami i tworzeniem projektów.
- Klienci i dane PPE, operator, taryfa, adres i kontakt.
- Miesięczne dane fakturowe, kontrola liczb i duplikatów okresów.
- Import CSV z mapowaniem kolumn, wyborem kW/kvar lub W/var i obowiązkowym potwierdzeniem znaków Q.
- Walidacja czasu ze strefą, interwałów, luk, nakładania i duplikatów pomiarów.
- Załączniki źródłowe do 2 MB (PDF, obraz, CSV, XLSX) — XLSX można załączyć, ale nie importować jako pomiary.
- Analiza ekonomiczna z jawnym modelem skuteczności, kosztem serwisu i energii urządzenia; 3 scenariusze.
- tg φ z faktur; moc kvar wyłącznie z profilu. Brak automatycznego przeliczania energii miesięcznej na moc kompensatora.
- Uproszczona symulacja korekty Q w interwałach, limit mocy oraz kierunek urządzenia.
- Trzy demonstracyjne warianty urządzeń, porównanie cen inwestycji, zwrotu i redukcji nadmiarowego Q.
- Kosztorys z pozycjami, rozróżnieniem marży i narzutu, rabatem oraz VAT; blokada marży 100%.
- Niezmienne snapshoty kalkulacji, urządzenia, ceny i algorytmu.
- Oferta i raport z zapisanej wersji, drukowanie / zapis PDF z polskimi znakami; brak wewnętrznych kosztów i marży w dokumencie klienta.
- Dziennik zmian w lokalnym backendzie; eksport projektów w trybie Pages.
- Responsywny interfejs, lokalne fonty, widoczny fokus i etykiety pól.

## Metody obliczeń

Algorytm `PL-PILOT-1.0`. Roczne opłaty = średnia miesięcznych opłat × 12. Mniej niż 12 miesięcy jest ekstrapolacją. Opłaty podaje użytkownik; nie są rekonstruowane ze stawek operatora. Niepełne miesiące ani wielostrefowe reguły rozliczeń nie są modelowane.

Oszczędność brutto = roczne opłaty × zadana skuteczność. Korzyść operacyjna = oszczędność brutto − serwis − koszt energii urządzenia. Brak oszczędności czynnej bez uzasadnienia. SPBT = cena inwestycji netto / korzyść operacyjna netto; dla korzyści ≤ 0 brak dodatniego zwrotu. Scenariusze: 70%, 100%, 110% efektu bazowego, ograniczone wysokością opłat historycznych; to analiza wrażliwości, nie przedział ufności.

Dla próbek z P ≥ 0 dopuszczalne Q: od 0 do P × docelowe tg φ. Q dodatnie oznacza indukcyjne, ujemne pojemnościowe. Korekta ograniczona kvar i kierunkiem konkretnego wariantu. Energie nadmiarowego Q sumowane jako |Q| × interwał [h]. Dla oddawania P model stosuje cel Q=0 — wymaga indywidualnej oceny warunków operatora. Model nie ocenia dynamiki szybszej od interwału, faz, stopni baterii, harmonicznych, deratingu ani podziału na filtrację. Redukcja Q z symulacji nie zastępuje modelu rozliczeń operatora i nie steruje scenariuszem oszczędności z faktur.

## Zakres pozostały przed pełnym MVP / produkcją

Ta wersja **nie realizuje całego PRD produkcyjnego**. Przed pilotażem na rzeczywistych PPE potrzebne są:

- Zweryfikowany katalog producentów, edycja i kontrolowany import CSV/XLSX urządzeń; obecne modele i ceny są fikcyjne.
- Import XLSX pomiarów, pełna obsługa energii interwałowych i kategorii rozliczeniowych.
- Wersjonowane wykonywalne reguły operatorów (obecnie zapis nazwy modelu i źródła + snapshot, nie pełny silnik taryf).
- Warunki techniczne instalacji, filtry krytyczne, stopnie regulacji i ograniczenia fazowe urządzeń.
- Uwierzytelnianie, wiele organizacji, role, uprawnienia do kosztów i imienne zatwierdzenie eksperta. Status „Zatwierdzony” jest blokowany po obu stronach.
- Automatyczne generowanie PDF po stronie serwera oraz uzupełnione dane wykonawcy, płatności, terminy i gwarancje. Obecnie wydruk przeglądarkowy.
- Polityka retencji, usuwanie/odtwarzanie danych, monitoring, kopie zapasowe i testy dostępności WCAG.
- Referencyjne przypadki i zasady rozliczeń potwierdzone przez eksperta. Testy matematyczne nie zastępują tej walidacji.

## Weryfikacja

8 testów: przecinek dziesiętny, marża/narzut/rabat, brak zwrotu, brak doboru kvar z faktur, limity/kierunki/interwały, zerowe P, walidacja profilu, dane ujemne/duplikaty/blokada zatwierdzenia. Lokalny test w Chromium: lista → projekt → kosztorys → zapis → wersja dokumentu → PDF; ekran mobilny bez przepełnienia poziomego. Katalog i wyniki pozostają demonstracyjne.
