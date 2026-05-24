
PDF jest za duży do bezpośredniego odczytu. Muszę zadać kilka pytań, aby lepiej zrozumieć wymagania i kontekst dokumentu.

Dziękuję za udostępnienie treści dokumentu. Widzę strukturę i kontekst. Mam kilka pytań, aby lepiej przygotować sekcje 4.1 i 4.3:

Świetnie, mam teraz pełny obraz struktury dokumentu. Widzę że sekcje 4.1 i 4.3 są oznaczone jako "TBD". Mam jeszcze kilka pytań:

Świetnie! Teraz przeszukam repozytorium, żeby zebrać szczegóły o architekturze i testach.















Mam już wystarczająco dużo informacji. Teraz przygotuję propozycje sekcji 4.1 i 4.3.

---

# Propozycja sekcji 4.1 i 4.3

## 4.1 Projekt aplikacji

Architektura systemu Restorio została zaprojektowana zgodnie z paradygmatem klient-serwer, z wyraźnym podziałem na trzy główne warstwy: warstwę prezentacji (frontend), warstwę serwerową (backend) oraz warstwę infrastruktury. Taki podział pozwala na niezależny rozwój poszczególnych komponentów, ułatwia skalowanie oraz zapewnia przejrzystość kodu źródłowego.

### 4.1.1 Warstwa prezentacji (Frontend)

Warstwa prezentacji została zrealizowana jako zestaw pięciu niezależnych aplikacji internetowych, z których każda jest przeznaczona dla innej grupy użytkowników:

- Warstwa publiczna (`public-web`) — zbudowana w środowisku Next.js, odpowiedzialna za rejestrację, logowanie, aktywację konta oraz resetowanie hasła.
- Panel administracyjny (`admin-panel`) — aplikacja React z biblioteką Vite, umożliwiająca właścicielom restauracji zarządzanie lokalem, menu, układem sali oraz personelem.
- Panel kuchenny (`kitchen-panel`) — aplikacja React z Vite, wyświetlająca zamówienia w czasie rzeczywistym z wykorzystaniem połączenia WebSocket.
- Panel kelnerski (`waiter-panel`) — aplikacja React z Vite, wspierająca obsługę sali i zarządzanie stolikami.
- Aplikacja mobilna (`mobile-app`) — aplikacja React z Vite, przeznaczona dla gości restauracji do przeglądania menu i składania zamówień.

Wszystkie aplikacje frontendowe współdzielą pakiety biblioteczne znajdujące się w katalogu [packages/](cci:9://file:///home/oshki/Projects/restorio-fullstack/app/packages:0:0-0:0):
- `@restorio/ui` — biblioteka komponentów interfejsu użytkownika (przyciski, formularze, modale, layouty)
- `@restorio/api-client` — klient HTTP do komunikacji z warstwą serwerową
- `@restorio/auth` — moduł uwierzytelniania i zarządzania sesją
- `@restorio/types` — współdzielone definicje typów TypeScript
- `@restorio/utils` — funkcje pomocnicze (walidacja, formatowanie, obsługa błędów)

Architektura monorepozytorium z wykorzystaniem systemu Turborepo pozwala na równoległe budowanie pakietów oraz aplikacji, co znacząco skraca czas kompilacji i zapewnia spójność wersji zależności między projektami.

### 4.1.2 Warstwa serwerowa (Backend)

Warstwa serwerowa została zaimplementowana w języku Python z wykorzystaniem struktury FastAPI. Główne moduły warstwy serwerowej obejmują:

- Moduł uwierzytelniania — obsługa rejestracji, logowania, aktywacji kont, resetowania haseł oraz zarządzania sesjami JWT
- Moduł zarządzania najemcami — konfiguracja restauracji, profili lokali, układów sal oraz menu
- Moduł zamówień — obsługa cyklu życia zamówień od złożenia przez klienta do archiwizacji
- Moduł płatności — integracja z systemem Przelewy24, obsługa webhooków i weryfikacja transakcji
- Moduł użytkowników — zarządzanie kontami pracowników i przypisywanie ról
- Moduł WebSocket — komunikacja w czasie rzeczywistym z panelem kuchni

Komunikacja między warstwą prezentacji a serwerową odbywa się poprzez interfejs REST API z punktami końcowymi zgrupowanymi w wersjonowanej strukturze `/api/v1/`. Walidacja danych wejściowych realizowana jest przez bibliotekę Pydantic, która automatycznie generuje dokumentację OpenAPI.

### 4.1.3 Warstwa infrastruktury

Infrastruktura systemu opiera się na konteneryzacji z wykorzystaniem platformy Docker. Główne komponenty infrastruktury obejmują:

- PostgreSQL 16 — relacyjna baza danych przechowująca dane użytkowników, konfigurację najemców, transakcje płatnicze oraz zarchiwizowane zamówienia
- MongoDB 7 — dokumentowa baza danych przechowująca aktywne zamówienia, menu restauracji oraz historyczne wersje układów sal
- MinIO — system przechowywania obiektów dla plików multimedialnych (zdjęcia menu, logo restauracji, ikony witryn)
- Nginx — serwer pośredniczący zarządzający ruchem sieciowym i serwujący statyczne pliki aplikacji frontendowych
- Uvicorn — serwer ASGI uruchamiający aplikację FastAPI

Proces wdrożenia jest zautomatyzowany przy pomocy GitHub Actions, które realizują paradygmat ciągłej integracji i ciągłego wdrażania (CI/CD). Przy każdym żądaniu scalenia (Pull Request) uruchamiane są automatyczne testy, walidacja kodu oraz raportowanie pokrycia testami.

---

## 4.3 Testowanie aplikacji

Proces testowania aplikacji Restorio został zaprojektowany wielopoziomowo, obejmując testy jednostkowe, testy integracyjne oraz testy manualne. Wysoki poziom pokrycia kodu testami zapewnia stabilność systemu oraz ułatwia wprowadzanie zmian bez ryzyka regresji.

### 4.3.1 Testy jednostkowe warstwy serwerowej

Testy jednostkowe warstwy serwerowej zostały zaimplementowane z wykorzystaniem biblioteki pytest w trybie asynchronicznym. Konfiguracja testów znajduje się w pliku `pyproject.toml` i obejmuje automatyczne mierzenie pokrycia kodu dla modułów [core](cci:9://file:///home/oshki/Projects/restorio-fullstack/app/api/tests/core:0:0-0:0), [services](cci:9://file:///home/oshki/Projects/restorio-fullstack/app/api/tests/unit/services:0:0-0:0), [routes](cci:9://file:///home/oshki/Projects/restorio-fullstack/app/api/tests/unit/routes:0:0-0:0) oraz `main`.

Struktura testów odzwierciedla architekturę aplikacji:
- [tests/unit/core/](cci:9://file:///home/oshki/Projects/restorio-fullstack/app/api/tests/unit/core:0:0-0:0) — testy modułów podstawowych (konfiguracja, bezpieczeństwo, obsługa wyjątków, middleware)
- [tests/unit/services/](cci:9://file:///home/oshki/Projects/restorio-fullstack/app/api/tests/unit/services:0:0-0:0) — testy warstwy usług biznesowych
- [tests/unit/routes/](cci:9://file:///home/oshki/Projects/restorio-fullstack/app/api/tests/unit/routes:0:0-0:0) — testy punktów końcowych API
- [tests/unit/modules/](cci:9://file:///home/oshki/Projects/restorio-fullstack/app/api/tests/unit/modules:0:0-0:0) — testy modułów funkcjonalnych (uwierzytelnianie, email, użytkownicy)

Testy wykorzystują mechanizm mocków do izolacji testowanych komponentów od zewnętrznych zależności, takich jak bazy danych czy usługi zewnętrzne. Pokrycie kodu testami dla warstwy serwerowej wynosi ponad 97%.

### 4.3.2 Testy jednostkowe warstwy prezentacji

Testy jednostkowe aplikacji frontendowych zostały zrealizowane z wykorzystaniem środowiska Vitest, które jest natywnie zintegrowane z narzędziem Vite. Konfiguracja testów wykorzystuje środowisko jsdom do symulacji przeglądarki oraz bibliotekę Testing Library do testowania komponentów React.

Zakres testów jednostkowych obejmuje:
- Pakiety współdzielone — testy komponentów UI (formularze, przyciski, modale, layouty), hooków (useToast, useAuth), providerów (I18nProvider, ThemeProvider) oraz funkcji pomocniczych (walidacja, formatowanie)
- Aplikacje — testy stron (PaymentConfigPage, MenuCreatorPage, FloorEditorPage), hooków aplikacyjnych (useTenants, useTransactions) oraz logiki biznesowej

Każda aplikacja oraz pakiet posiada własną konfigurację Vitest z możliwością uruchomienia testów niezależnie lub w ramach całego monorepozytorium. Pokrycie kodu testami dla pakietów współdzielonych wynosi 100%, natomiast dla aplikacji frontendowych przekracza 90%.

### 4.3.3 Testy całościowe (E2E)

Infrastruktura testów całościowych została przygotowana z wykorzystaniem platformy Playwright, która umożliwia automatyzację testów w trzech silnikach przeglądarek: Chromium, Firefox oraz WebKit (Safari). Konfiguracja testów obejmuje automatyczne uruchomienie serwera deweloperskiego oraz kontenera API przed wykonaniem testów.

Testy E2E symulują rzeczywiste interakcje użytkownika z aplikacją, weryfikując poprawność przepływów biznesowych od początku do końca, takich jak:
- Sprawdzanie dostępności serwera API (endpointy /health i /health/live)
- Nawigacja po stronie głównej warstwy publicznej (logowanie, rejestracja, reset hasła)
- Weryfikacja ładowania interfejsu w panelach z autoryzacją (admin-panel, kitchen-panel, mobile-app, waiter-panel) przy użyciu tokenu ze zmiennej środowiskowej PW_TOKEN

### 4.3.4 Testy manualne

Oprócz testów automatycznych, przeprowadzono obszerne testy manualne obejmujące wszystkie moduły systemu. Testy manualne koncentrowały się na:

- Testach funkcjonalnych — weryfikacja poprawności działania wszystkich funkcjonalności zgodnie ze specyfikacją, w tym:
  - Proces rejestracji konta właściciela restauracji z weryfikacją e-mail
  - Tworzenie i konfiguracja profilu lokalu (dane firmowe, NIP, adres)
  - Projektowanie układu sali z edytorem floor canvas (dodawanie stolików, ścian, stref)
  - Kreowanie menu z kategoriami, pozycjami, cenami i zdjęciami
  - Konfiguracja motywu aplikacji mobilnej (kolory, czcionki, teksty)
  - Zarządzanie personelem (dodawanie kelnerów i kucharzy, nadawanie ról)
  - Proces składania zamówienia przez aplikację mobilną (od skanu QR do płatności)
  - Obsługa zamówienia w panelu kuchni (akceptacja, zmiana statusu, odrzucenie)
  - Wyświetlanie zamówień w panelu kelnerskim z układem sali
  - Przeglądanie historii transakcji płatniczych w panelu administracyjnym

- Testach użyteczności — ocena intuicyjności interfejsu i wygody użytkowania, w tym:
  - Ocena czytelności formularzy i komunikatów błędów
  - Weryfikacja czytelnności interfejsu panelu kuchni podczas dużego obciążenia zamówieniami
  - Sprawdzenie czy interfejs panelu kelnerskiego pozwala na szybką identyfikację stolików
  - Ocena intuicyjności procesu składania zamówienia dla gościa restauracji

- Testach responsywności — sprawdzenie poprawnego wyświetlania aplikacji na różnych rozdzielczościach ekranu, w tym:
  - Urządzenia mobilne (smartfony) — aplikacja mobilna, panel kelnerski
  - Tablety — panel kuchenny, panel administracyjny
  - Monitory desktop — panel administracyjny, panel kelnerski
  - Testy orientacji pionowej i poziomej ekranu

- Testach integracyjnych — weryfikacja poprawnej komunikacji między warstwą prezentacji a serwerową, w tym:
  - Synchronizacja zamówień między aplikacją mobilną a panelem kuchni w czasie rzeczywistym
  - Aktualizacja statusu zamówienia w panelu kuchni i odbiór tej zmiany w panelu kelnerskim
  - Przesyłanie plików graficznych (zdjęcia menu, logo) do usługi MinIO
  - Weryfikacja czy zmiany w konfiguracji motywu są natychmiast widoczne w aplikacji mobilnej

- Testach płatności — weryfikacja integracji z systemem Przelewy24 w środowisku sandbox, w tym:
  - Rejestracja transakcji i przekierowanie do bramki płatniczej
  - Symulacja udanej płatności i weryfikacja webhook potwierdzającego
  - Symulacja anulowania płatności przez użytkownika
  - Weryfikacja poprawnego archiwizowania transakcji w bazie danych

- Testach wymagań niefunkcjonalnych (NFR) — weryfikacja właściwości systemu niezwiązanych z funkcjonalnością, w tym:
  - Wydajność — pomiar czasu odpowiedzi API dla kluczowych endpointów (logowanie, pobieranie menu, aktualizacja zamówienia)
  - Skalowalność — testy z dużą liczbą zamówień w panelu kuchni (>50 zamówień jednocześnie)
  - Bezpieczeństwo — weryfikacja mechanizmów autoryzacji JWT, rotacji tokenów odświeżających, haszowania haseł bcrypt
  - Odporność na błędy — testy zachowania systemu przy braku połączenia z bazą danych lub usługą zewnętrzną
  - Wielojęzyczność — weryfikacja poprawnego wyświetlania interfejsu w różnych językach (polski, angielski)

### 4.3.5 Automatyzacja procesu testowania

Proces testowania został zintegrowany z systemem ciągłej integracji GitHub Actions. Przy każdym żądaniu scalenia (Pull Request) automatycznie uruchamiane są:
1. Wykrywanie zmienionych obszarów kodu (frontend/backend)
2. Budowanie pakietów współdzielonych
3. Walidacja typów TypeScript oraz analiza statyczna kodu
4. Uruchomienie testów jednostkowych z mierzeniem pokrycia
5. Agregacja raportów pokrycia i publikacja komentarza w żądaniu scalenia
6. Walidacja kodu Python (ruff) oraz uruchomienie testów pytest

Takie podejście zapewnia, że każda zmiana w kodzie jest automatycznie weryfikowana przed scaleniem z główną gałęzią repozytorium, co minimalizuje ryzyko wprowadzenia błędów do środowiska produkcyjnego.
