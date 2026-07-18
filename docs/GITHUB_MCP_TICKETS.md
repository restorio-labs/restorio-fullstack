# Utworzenie roadmapy GitHub Issues dla Restorio

Pracuj w repozytorium:

`restorio-labs/restorio-fullstack`

## Zasady ogólne

1. Przed utworzeniem każdego issue wyszukaj istniejące issues o podobnym zakresie.
2. Nie twórz duplikatów.
3. Najpierw utwórz wszystkie epiki.
4. Zapisz numery utworzonych epików.
5. Następnie utwórz child issues, dodając w każdym:

```md
## Relations

Part of #EPIC_NUMBER

Blocked by:
- #ISSUE_NUMBER
```

6. Po utworzeniu child issues zaktualizuj body każdego epika, dodając checklistę:

```md
## Child issues

- [ ] #123
- [ ] #124
```

7. Po poznaniu wszystkich numerów zaktualizuj również zależności pomiędzy child issues.
8. Stosuj istniejące etykiety. Jeśli etykieta nie istnieje, nie przerywaj działania i nie twórz jej bez osobnego wsparcia MCP.
9. Preferowane etykiety, o ile istnieją:

* `epic`
* `infrastructure`
* `devops`
* `ci/cd`
* `frontend`
* `backend`
* `mobile`
* `security`
* `analytics`
* `privacy`
* `enhancement`

10. Każde issue musi zawierać:

```md
## Goal

## Context

## Scope

## Out of scope

## Acceptance criteria

## Relations
```

11. Nie implementuj kodu. Utwórz wyłącznie epiki i issues.
12. Nie twórz ponownie zakończonego issue [#38 – i18n Readiness & Content Strategy](https://github.com/restorio-labs/restorio-fullstack/issues/38). Nowe issue dotyczące i18n ma być jego kontynuacją.
13. Powiąż zadania frontendowe z [#14 – Frontend Bootstrap](https://github.com/restorio-labs/restorio-fullstack/issues/14), jeśli jest to uzasadnione.
14. Powiąż zadania backendowe z [#4 – Backend Core Architecture](https://github.com/restorio-labs/restorio-fullstack/issues/4), ale nie dodawaj do niego zadań Kubernetes ani CI/CD, ponieważ są poza jego zakresem.
15. Zadania analityczne dotyczące PostgreSQL mogą wskazywać [#30 – PostgreSQL Core Schema & ERD](https://github.com/restorio-labs/restorio-fullstack/issues/30) jako related issue.

---

# EPIC 1: Production Kubernetes Platform

## Tytuł

`[EPIC] Production Kubernetes Platform`

## Goal

Zastąpić produkcyjny deployment oparty na Docker Compose powtarzalną platformą Kubernetes dostosowaną do infrastruktury VPS.

## Context

Aktualnie API, PostgreSQL, MongoDB, MinIO i Nginx są wdrażane przez Docker Compose i synchronizację plików przez SSH/rsync. Docelowa platforma powinna wykorzystywać niezmienne obrazy OCI, deklaratywną konfigurację, automatyczne health checks, kontrolowane migracje i możliwość rollbacku.

Preferowaną dystrybucją dla niewielkiej infrastruktury VPS jest k3s.

Frontendy wdrażane do Cloudflare Workers mogą pozostać poza klastrem. Epic musi rozpocząć się od określenia granic deploymentu.

## Child issues

Lista zostanie uzupełniona po utworzeniu poniższych issues.

---

## 1.1 `[ADR] Define production topology and deployment boundaries`

### Goal

Udokumentować docelową topologię produkcyjną przed rozpoczęciem migracji.

### Scope

* określić, które komponenty działają w k3s;
* zdecydować, które aplikacje frontendowe są wdrażane do Cloudflare Workers;
* rozważyć Node standalone dla wybranych aplikacji Vinext;
* określić liczbę węzłów i ich role;
* zdefiniować namespace `staging` i `production`;
* określić sposób dostępu do PostgreSQL, MongoDB i MinIO;
* przygotować diagram architektury;
* przygotować ADR zawierający decyzje i odrzucone alternatywy.

### Acceptance criteria

* istnieje zaakceptowany ADR;
* diagram pokazuje przepływ ruchu, DNS, ingress, frontendy, API i storage;
* każda usługa ma przypisany target deploymentu;
* określono wymagania minimalne dla VPS;
* określono strategię HA albo jawnie zaakceptowano single-node MVP.

---

## 1.2 `Build and publish immutable OCI images for deployable components`

### Goal

Zastąpić budowanie aplikacji na serwerze produkcyjnym obrazami publikowanymi przez CI.

### Scope

* obraz API;
* obrazy aplikacji frontendowych przeznaczonych do self-hostingu;
* publikacja do GitHub Container Registry;
* tag komponentu, wersja i commit SHA;
* uruchamianie procesów jako użytkownik bez uprawnień root;
* pinowanie obrazów bazowych;
* cache warstw;
* SBOM oraz podstawowy vulnerability scan.

### Acceptance criteria

* obrazy są budowane wyłącznie w CI;
* produkcja nie otrzymuje kodu przez rsync;
* obraz ma tag wersji oraz niezmienny digest;
* każdy obraz zawiera OCI labels z wersją, SHA i datą budowy;
* obrazy można uruchomić lokalnie bez repozytorium źródłowego.

### Relations

Blocked by issue 1.1.

---

## 1.3 `Provision staging and production k3s environments`

### Goal

Przygotować klastry lub logicznie rozdzielone środowiska k3s.

### Scope

* instalacja i konfiguracja k3s;
* namespaces;
* RBAC;
* service accounts dla CI/CD;
* ograniczony kubeconfig;
* resource requests i limits;
* polityka aktualizacji klastra;
* dokumentacja odtworzenia klastra.

### Acceptance criteria

* dostępne są środowiska staging i production;
* pipeline nie używa administracyjnego kubeconfig;
* wszystkie workloady mają requests i limits;
* dostęp do klastra jest możliwy wyłącznie przez kontrolowane poświadczenia;
* istnieje runbook odtworzenia środowiska.

### Relations

Blocked by issue 1.1.

---

## 1.4 `Create Helm charts for Restorio workloads`

### Goal

Dostarczyć wersjonowane manifesty dla komponentów Restorio.

### Scope

* Deployment i Service dla API;
* Ingress;
* ConfigMap;
* odwołania do Secret;
* probes `startup`, `readiness` i `liveness`;
* osobny Kubernetes Job dla migracji Alembic;
* PodDisruptionBudget, jeżeli środowisko ma więcej niż jeden węzeł;
* opcjonalny HPA dla API;
* wartości staging i production;
* deployment aplikacji Vinext działających jako Node standalone, jeśli zostały zakwalifikowane do klastra.

### Out of scope

Migracje bazy nie mogą być wykonywane równolegle przez każdą replikę API podczas startu.

### Acceptance criteria

* `helm template` i `helm lint` przechodzą w CI;
* API nie uruchamia migracji w każdej replice;
* chart umożliwia rollback;
* wersja obrazu jest przekazywana jawnie;
* staging i production korzystają z tego samego chartu i innych values.

### Relations

Blocked by issues 1.2 i 1.3.

---

## 1.5 `Implement production secrets, ingress, TLS and network policies`

### Goal

Zabezpieczyć komunikację i konfigurację klastra.

### Scope

* wybór SOPS + age, External Secrets lub innego rozwiązania;
* usunięcie produkcyjnych wartości domyślnych typu `change-me-in-production`;
* automatyczne certyfikaty TLS;
* ingress routing;
* NetworkPolicy;
* ograniczenie dostępu do baz danych i MinIO;
* rotacja sekretów;
* dokumentacja procedury awaryjnej.

### Acceptance criteria

* sekrety nie występują jawnie w repozytorium;
* bazy nie są dostępne publicznie;
* API posiada TLS;
* tylko wymagane workloady komunikują się ze storage;
* możliwa jest rotacja sekretów bez ręcznej edycji podów.

### Relations

Blocked by issues 1.3 i 1.4.

---

## 1.6 `Implement persistent storage, backup and restore procedures`

### Goal

Zapewnić bezpieczne przechowywanie i odtwarzanie PostgreSQL, MongoDB oraz MinIO.

### Scope

* StorageClass i PVC;
* backup PostgreSQL;
* backup MongoDB;
* replikacja lub backup danych MinIO do drugiej lokalizacji;
* harmonogram retencji;
* szyfrowanie backupów;
* test odtwarzania;
* monitoring nieudanych backupów;
* dokumentacja RPO i RTO.

### Acceptance criteria

* każda usługa stanowa ma opisany backup;
* backup znajduje się poza głównym VPS-em;
* przeprowadzono i udokumentowano test restore;
* błąd backupu generuje alert;
* wdrożenie nowej wersji nie usuwa PVC.

### Relations

Blocked by issue 1.3.

---

## 1.7 `Add Kubernetes observability and operational alerts`

### Goal

Zapewnić obserwowalność platformy i aplikacji.

### Scope

* metryki klastra;
* metryki aplikacyjne API;
* centralne logi;
* dashboardy;
* alerty na niedostępność API;
* alerty na restarty i CrashLoopBackOff;
* alerty na miejsce na dysku;
* alerty na backup;
* wersja komponentu jako label w metrykach i logach.

### Acceptance criteria

* dostępny jest dashboard produkcyjny;
* można wskazać wersję każdej uruchomionej aplikacji;
* krytyczne błędy generują alert;
* logi można filtrować po tenant ID, correlation ID i komponencie;
* nie są logowane sekrety ani pełne dane płatnicze.

### Relations

Blocked by issues 1.4–1.6.

---

## 1.8 `Migrate production from Docker Compose to k3s`

### Goal

Przeprowadzić kontrolowany cutover z możliwością szybkiego rollbacku.

### Scope

* staging rehearsal;
* backup przed migracją;
* migracja danych;
* DNS cutover;
* smoke tests;
* obserwacja po wdrożeniu;
* rollback procedure;
* usunięcie starego deploymentu dopiero po okresie stabilizacji.

### Acceptance criteria

* przeprowadzono próbę na staging;
* rollback został przetestowany;
* wszystkie health checks przechodzą;
* nie utracono danych;
* Docker Compose pozostaje wyłącznie jako środowisko lokalne lub awaryjne;
* runbook zawiera dokładne kroki migracji.

### Relations

Blocked by wszystkie wcześniejsze child issues epika.

---

# EPIC 2: Independent Versioning and Release Automation

## Tytuł

`[EPIC] Independent Component Versioning and Release Automation`

## Goal

Wprowadzić niezależne wersjonowanie aplikacji i pakietów, automatyczną propagację zmian przez graf zależności oraz selektywne deploymenty.

## Context

Repozytorium zawiera aplikacje:

* `admin-panel`;
* `kitchen-panel`;
* `mobile-app`;
* `waiter-panel`;
* `public-web`;
* `api`.

Oraz pakiety:

* `api-client`;
* `auth`;
* `types`;
* `ui`;
* `utils`.

Aktualny workflow odczytuje wersje i może tymczasowo obliczyć wspólny bump, ale nie aktualizuje manifestów, nie tworzy osobnych release’ów i wdraża wiele aplikacji razem.

Preferowany model:

1. PR zawiera informację o wpływie zmiany na wersję.
2. Po merge do `main` bot tworzy lub aktualizuje Release PR.
3. Release PR pokazuje wszystkie podbijane pakiety i zależne aplikacje.
4. Człowiek zatwierdza Release PR.
5. Merge Release PR zapisuje wersje w repozytorium.
6. CI tworzy osobne tagi i GitHub Releases.
7. Budowane i wdrażane są wyłącznie zmienione komponenty.

Nie implementuj automatycznego, niekontrolowanego commita bezpośrednio do chronionego `main`.

---

## 2.1 `Define component dependency graph and release rules`

### Goal

Zdefiniować formalny graf wersjonowanych komponentów.

### Scope

* wykryć zależności workspace;
* określić niezależne wersje wszystkich aplikacji;
* określić zasady bumpowania pakietów zależnych;
* zdecydować, czy zmiana pakietu wymusza patch aplikacji;
* określić typy bumpów dla zmian API;
* określić format tagów;
* określić zasady prerelease.

### Proponowane tagi

```text
api-v1.4.0
public-web-v1.8.2
admin-panel-v1.5.0
kitchen-panel-v0.8.1
mobile-app-v1.3.0
waiter-panel-v1.2.1
ui-v1.7.0
auth-v1.4.0
api-client-v1.9.0
types-v1.12.0
utils-v1.3.0
```

### Acceptance criteria

* graf jest zapisany w dokumentacji;
* istnieje reguła dla bezpośrednich i tranzytywnych zależności;
* każda aplikacja posiada niezależną wersję;
* `ui-demo` jest jawnie oznaczone jako wersjonowane albo niewersjonowane;
* określono zasady dla breaking changes.

---

## 2.2 `Integrate Changesets for TypeScript workspaces`

### Goal

Automatyzować niezależne bumpowanie aplikacji i pakietów TypeScript.

### Scope

* konfiguracja Changesets;
* wersjonowanie prywatnych pakietów;
* aktualizacja zależności wewnętrznych;
* generowanie changelogów;
* obowiązkowy changeset dla zmian produktowych;
* możliwość `empty changeset` dla zmian bez release’u;
* walidacja changesetów w PR;
* dokumentacja dla contributorów.

### Acceptance criteria

* zmiana `@restorio/ui` podbija wymagane aplikacje;
* zmiana `@restorio/types` propaguje się przez zależności;
* niezmienione aplikacje zachowują wersję;
* CI pokazuje planowany release;
* changelogi są aktualizowane automatycznie.

### Relations

Blocked by issue 2.1.

---

## 2.3 `Add independent API versioning and changelog automation`

### Goal

Włączyć Python API do tego samego procesu release’owego.

### Scope

* aktualizacja wersji w `pyproject.toml`;
* changelog API;
* mapowanie zmian endpointów na semver;
* mechanizm przekazania wersji do obrazu;
* tag `api-vX.Y.Z`;
* synchronizacja wersji OpenAPI;
* obsługa manualnego major/minor/patch, jeśli zmiana nie może być wywnioskowana.

### Acceptance criteria

* wersja API ma jedno źródło prawdy;
* wersja w `pyproject.toml`, obrazie i `/health` jest identyczna;
* API otrzymuje osobny tag;
* zmiana wyłącznie frontendowa nie podbija API.

### Relations

Blocked by issue 2.1.

Related to [#4](https://github.com/restorio-labs/restorio-fullstack/issues/4).

---

## 2.4 `Create an approved Release PR workflow`

### Goal

Tworzyć czytelny Release PR zamiast bezpośrednio commitować bump na `main`.

### Scope

* workflow uruchamiany po merge do `main`;
* utworzenie lub aktualizacja Release PR;
* tabela starych i nowych wersji;
* lista powodów bumpu;
* lista aplikacji dotkniętych tranzytywnie;
* wymagane przejście CI;
* manualna akceptacja przez merge PR;
* zabezpieczenie przed pętlą workflow;
* commit wykonywany przez GitHub App lub dedykowanego bota.

### Acceptance criteria

* Release PR zawiera pełny plan wersji;
* merge Release PR zapisuje wersje w repozytorium;
* workflow nie tworzy nieskończonej pętli;
* zwykły push nie wdraża niezatwierdzonych wersji;
* branch protection pozostaje aktywne.

### Relations

Blocked by issues 2.2 i 2.3.

---

## 2.5 `Create component-specific Git tags and GitHub Releases`

### Goal

Po zatwierdzeniu release’u utworzyć osobne release’y dla zmienionych komponentów.

### Scope

* osobne tagi;
* release notes z changelogów;
* wskazanie commit SHA;
* linkowanie odpowiednich PR-ów;
* niedublowanie istniejącego tagu;
* idempotentny workflow.

### Acceptance criteria

* tag powstaje tylko dla zmienionego komponentu;
* każdy tag wskazuje commit zawierający właściwą wersję;
* rerun workflow nie tworzy duplikatów;
* GitHub Release zawiera listę zmian.

### Relations

Blocked by issue 2.4.

---

## 2.6 `Build and deploy only released components`

### Goal

Zastąpić wspólny deployment selektywnymi pipeline’ami.

### Scope

* macierz komponentów;
* build zależny od utworzonego tagu;
* publikacja obrazu lub artifactu;
* osobne concurrency groups;
* osobne GitHub Environments;
* staging przed production;
* manual approval dla production;
* niewdrażanie niezmienionych komponentów.

### Acceptance criteria

* tag `mobile-app-vX.Y.Z` nie wdraża `admin-panel`;
* zmiana wspólnego pakietu wdraża wszystkie faktycznie zależne aplikacje;
* status każdego komponentu jest widoczny osobno;
* deployment może zostać ponowiony dla konkretnej wersji;
* pipeline zapisuje digest wdrożonego obrazu.

### Relations

Blocked by issues 2.5 i 1.2.

---

## 2.7 `Expose application version and build metadata`

### Goal

Udostępnić jednolite informacje o wersji każdego komponentu.

### Frontend scope

Wstrzykiwać podczas builda:

```text
APP_VERSION
GIT_SHA
BUILD_TIME
RELEASE_TAG
```

Udostępnić je jako:

* `<html data-app-version="...">`;
* `<meta name="app-version" content="...">`;
* opcjonalny ekran lub element diagnostyczny;
* dane dostępne dla monitoringu błędów.

### API scope

Rozszerzyć health response:

```json
{
  "status": "ok",
  "version": "1.4.0",
  "gitSha": "abc123",
  "buildTime": "2026-07-14T18:00:00Z",
  "releaseTag": "api-v1.4.0"
}
```

### Acceptance criteria

* wersji nie można zmienić runtime bez zbudowania nowego artifactu;
* metadata są identyczne z Git tagiem;
* wszystkie produkcyjne aplikacje wystawiają wersję;
* smoke test weryfikuje wersję po deploymentcie;
* health endpoint nie ujawnia sekretów.

### Relations

Blocked by issues 2.2–2.5.

---

## 2.8 `Add release smoke tests and automated rollback`

### Goal

Sprawdzać działanie wersji po wdrożeniu i umożliwiać rollback.

### Scope

* health check API;
* test podstawowego routingu każdej aplikacji;
* test logowania;
* test pobrania konfiguracji publicznej;
* weryfikacja wersji;
* rollback Helm;
* rollback Cloudflare deploymentu;
* zapis wyniku w GitHub Deployment.

### Acceptance criteria

* deployment nie jest oznaczany jako successful przed smoke testem;
* nieudany smoke test zatrzymuje promocję;
* dostępny jest udokumentowany rollback;
* rollback przywraca poprzednią wersję, a nie przebudowuje kodu.

### Relations

Blocked by issues 2.6 i 2.7.

---

## 2.9 `Audit Dependabot alerts and harden dependency governance`

### Goal

Rozwiązać istniejące alerty i ustanowić trwały proces zarządzania zależnościami.

### Scope

* sprawdzić Security → Dependabot alerts;
* sklasyfikować alerty według severity i exploitability;
* zaktualizować bezpośrednie i tranzytywne zależności;
* dodać `.github/dependabot.yml`;
* uwzględnić npm/Bun, pip/uv, GitHub Actions i Docker;
* grupować powiązane aktualizacje;
* dodać dependency review do PR;
* automatycznie scalać wyłącznie bezpieczne patch updates po pełnym CI;
* dokumentować odrzucone lub ignorowane alerty;
* unikać globalnych, nieuzasadnionych `overrides`.

### Acceptance criteria

* wszystkie alerty critical i high są rozwiązane albo udokumentowane;
* Dependabot sprawdza wszystkie używane ekosystemy;
* PR nie może wprowadzić nowej krytycznej podatności;
* update Actions nie omija kontroli CI;
* istnieje cykliczny proces przeglądu alertów.

---

## 2.10 `Generate the TypeScript API client from OpenAPI`

### Goal

Zmniejszyć ryzyko rozjazdu ręcznie utrzymywanego `@restorio/api-client` względem FastAPI.

### Scope

* generowanie klienta z OpenAPI;
* generowanie DTO;
* stabilne nazewnictwo;
* adapter dla istniejącego API clienta;
* kontrola breaking changes w CI;
* publikacja wygenerowanej wersji razem z wersją kontraktu.

### Acceptance criteria

* zmiana DTO backendu jest wykrywana w CI;
* aplikacje nie duplikują ręcznie typów odpowiedzi;
* wygenerowany kod nie jest ręcznie modyfikowany;
* migration path nie wymaga jednorazowego przepisania wszystkich wywołań.

---

# EPIC 3: Frontend Runtime Standardization with Vinext

## Tytuł

`[EPIC] Evaluate and Standardize Frontend Runtime with Vinext`

## Goal

Przeanalizować i, po pozytywnym PoC, zmigrować produkcyjne aplikacje frontendowe na wspólny runtime Vinext.

## Context

`public-web` posiada już skrypty Vinext i osobny workflow Cloudflare. Pozostałe aplikacje są Vite SPA z React Router.

Migracja nie jest prostą zmianą bundlera. Dla aplikacji Vite wymaga decyzji dotyczącej routingu, renderowania, autoryzacji i targetu deploymentu.

`ui-demo` pozostaje poza zakresem, chyba że ADR wykaże korzyść z migracji.

Related to [#14](https://github.com/restorio-labs/restorio-fullstack/issues/14).

---

## 3.1 `[ADR] Run a Vinext compatibility and deployment proof of concept`

### Goal

Zweryfikować sens i wykonalność migracji przed zmianą wszystkich aplikacji.

### Scope

* uruchomić `vinext check` dla `public-web`;
* przygotować PoC jednej prostej aplikacji operacyjnej;
* porównać Cloudflare Workers i Node standalone;
* sprawdzić React Router migration path;
* sprawdzić cookies, JWT, CSRF i CORS;
* sprawdzić WebSocket;
* porównać bundle size i build time;
* zidentyfikować brakujące API Vinext;
* ustalić kryteria go/no-go.

### Acceptance criteria

* istnieje raport kompatybilności;
* wykonano działający deployment PoC;
* ADR wybiera target dla każdego frontendu;
* istnieje udokumentowany rollback;
* migracja może zostać przerwana bez destabilizacji obecnych aplikacji.

---

## 3.2 `Align React, Vite, Vinext and shared package peer dependencies`

### Goal

Usunąć obecny miks React 18/19, Vite 7/8 i niespójnych peer dependencies.

### Scope

* jedna wspierana wersja React;
* zgodne `react-dom`;
* aktualizacja peer dependencies `@restorio/ui` i `@restorio/auth`;
* usunięcie niepotrzebnych root overrides;
* jedna polityka wersji Vite/Vinext;
* test dwóch kopii React;
* aktualizacja Testing Library.

### Acceptance criteria

* `bun pm ls react` nie pokazuje konfliktowych runtime’ów;
* nie występują invalid hook calls;
* wszystkie aplikacje budują się bez wymuszonych niespójnych override’ów;
* peer dependencies odpowiadają faktycznie wspieranym wersjom.

### Relations

Blocked by issue 3.1.

---

## 3.3 `Create a reusable Vinext application template`

### Goal

Przygotować standardową strukturę dla migrowanych aplikacji.

### Scope

* App Router;
* root layout;
* providers;
* error boundaries;
* loading states;
* auth integration;
* i18n integration;
* theme;
* environment validation;
* version metadata;
* test setup;
* Cloudflare i Node target;
* wspólne conventions.

### Acceptance criteria

* nową aplikację można utworzyć bez kopiowania innej aplikacji;
* template działa lokalnie i w CI;
* posiada test smoke;
* nie zawiera business-specific kodu.

### Relations

Blocked by issues 3.1 i 3.2.

---

## 3.4 `Complete public-web migration to Vinext`

### Scope

* usunąć podwójny, tymczasowy tryb Next.js/Vinext;
* uruchamiać produkcyjne buildy wyłącznie wskazanym mechanizmem;
* sprawdzić SSR, metadata, routing i i18n;
* usunąć nieużywane OpenNext dependencies po potwierdzeniu migracji;
* zachować SEO i wydajność.

### Acceptance criteria

* produkcja korzysta z jednej ścieżki build/deploy;
* wszystkie istniejące trasy działają;
* metadata i sitemap nie ulegają regresji;
* E2E przechodzą na Vinext.

### Relations

Blocked by issue 3.3.

---

## 3.5 `Migrate admin-panel to Vinext`

## 3.6 `Migrate kitchen-panel to Vinext`

## 3.7 `Migrate waiter-panel to Vinext`

## 3.8 `Migrate mobile-app to Vinext`

Dla każdego z powyższych issues zastosuj ten sam zakres:

### Scope

* migracja routingu;
* migracja entrypointu;
* integracja providers;
* zachowanie auth i role guards;
* zachowanie TanStack Query;
* migracja konfiguracji środowiskowej;
* wersja aplikacji;
* osobny deployment;
* testy jednostkowe i E2E;
* usunięcie starego entrypointu dopiero po potwierdzeniu parity.

### Acceptance criteria

* wszystkie dotychczasowe trasy działają;
* mechanizmy autoryzacji nie ulegają regresji;
* aplikacja otrzymuje osobny tag i deployment;
* nie występują cross-app imports;
* aplikacja działa po bezpośrednim odświeżeniu dowolnej trasy;
* stary build Vite zostaje usunięty dopiero po stabilizacji.

### Relations

Blocked by issues 3.3 i 3.4 albo przez decyzję ADR dopuszczającą migracje równoległe.

---

## 3.9 `Replace static frontend deployment workflows with per-app Vinext deployments`

### Goal

Usunąć wspólny workflow budujący cztery statyczne aplikacje jednocześnie.

### Acceptance criteria

* każda aplikacja ma osobny reusable workflow;
* deployment reaguje na tag konkretnej aplikacji;
* możliwe jest wdrożenie do staging;
* wersje i deploymenty są niezależne;
* workflow jest zgodny z epicem wersjonowania.

### Relations

Blocked by issues 3.4–3.8 oraz epic 2.

---

## 3.10 `Add frontend migration parity and performance gates`

### Scope

* Lighthouse lub równoważny budget;
* bundle size;
* E2E najważniejszych przepływów;
* routing;
* auth;
* WebSocket;
* accessibility;
* smoke test wersji;
* porównanie przed i po migracji.

### Acceptance criteria

* migracja nie zwiększa głównego bundle’u ponad ustalony limit;
* krytyczne ścieżki mają E2E;
* nie występują regresje WCAG;
* wyniki są widoczne w PR.

---

# EPIC 4: Mobile CMS and Shared Runtime Renderer

## Tytuł

`[EPIC] Mobile CMS and Shared Mobile Runtime Renderer`

## Goal

Rozwinąć istniejącą konfigurację mobilną do wersjonowanego CMS-a oraz usunąć duplikację między prawdziwą aplikacją mobilną i podglądem administratora.

## Context

Obecnie istnieje `MobileGuestAppPreview` w `@restorio/ui`, ale jest to osobna, syntetyczna implementacja ekranów. Produkcyjna aplikacja mobilna posiada własne strony i markup.

Docelowo admin preview i mobile-app powinny używać tych samych komponentów prezentacyjnych. Różnić mają się adapterami danych i interakcji.

---

## 4.1 `Create @restorio/mobile shared package`

### Goal

Utworzyć pakiet zawierający wspólny renderer aplikacji gościa.

### Scope

* `MobileShell`;
* `LandingScreen`;
* `MenuScreen`;
* `TablesScreen`;
* `OrderScreen`;
* `GuestBottomNav`;
* wspólne view models;
* wspólne theme integration;
* publiczne exports;
* testy komponentów.

### Architectural rule

Pakiet nie może wykonywać requestów API ani używać routera konkretnej aplikacji. Otrzymuje dane i callbacki przez props lub adaptery.

### Acceptance criteria

* pakiet jest używany przez `mobile-app`;
* pakiet może być używany przez admin preview;
* nie zawiera tenant-specific business copy;
* nie importuje kodu z `app/apps/*`;
* posiada testy.

### Relations

Related to [#14](https://github.com/restorio-labs/restorio-fullstack/issues/14).

---

## 4.2 `Replace synthetic admin mobile preview with shared runtime screens`

### Goal

Sprawić, aby preview dokładnie odpowiadał produkcyjnej aplikacji.

### Scope

* usunąć duplikację markup;
* admin przekazuje mock data i disabled interaction adapters;
* mobile przekazuje prawdziwe dane i navigation adapters;
* obsłużyć wszystkie ekrany;
* zachować light/dark preview;
* skalować runtime UI do ramki telefonu bez tworzenia drugiej wersji komponentów.

### Acceptance criteria

* zmiana markup ekranu wymaga edycji jednego komponentu;
* preview i mobile renderują te same komponenty;
* preview nie wykonuje prawdziwych zamówień;
* test snapshot lub visual regression porównuje oba tryby.

### Relations

Blocked by issue 4.1.

---

## 4.3 `Define a versioned block-based mobile CMS schema`

### Goal

Zaprojektować schema CMS umożliwiające rozbudowę bez częstych migracji całego modelu.

### Przykładowe bloki

* hero;
* rich text;
* image;
* gallery;
* menu categories;
* promoted products;
* CTA;
* opening hours;
* restaurant information;
* social links;
* map/location;
* custom divider;
* announcement/banner.

### Scope

* schema version;
* block ID;
* typ bloku;
* kolejność;
* visibility;
* configuration;
* locale-aware content;
* walidacja;
* migration strategy;
* limit liczby i rozmiaru bloków.

### Acceptance criteria

* nieznany typ bloku nie powoduje awarii całej strony;
* schema posiada wersję;
* istnieje migracja z obecnego `landingContent`;
* backend i frontend walidują ten sam kontrakt;
* każdy blok ma stabilny identyfikator.

---

## 4.4 `Implement CMS draft, publish and version history API`

### Scope

* draft;
* published version;
* preview;
* optimistic concurrency;
* historia wersji;
* rollback;
* audit log;
* uprawnienia;
* publiczny endpoint zwracający wyłącznie published content.

### Acceptance criteria

* niezapisane zmiany nie trafiają do gości;
* można przywrócić poprzednią wersję;
* dwa równoczesne zapisy nie nadpisują się bez ostrzeżenia;
* wszystkie operacje są tenant-scoped;
* publiczny endpoint nie ujawnia draftu.

### Relations

Blocked by issue 4.3.

Related to [#4](https://github.com/restorio-labs/restorio-fullstack/issues/4).

---

## 4.5 `Build the admin mobile CMS editor`

### Scope

* dodawanie bloków;
* usuwanie;
* zmiana kolejności;
* edycja właściwości;
* preview;
* draft save;
* publish;
* unsaved changes guard;
* validation errors;
* keyboard accessibility;
* undo/redo jako opcjonalny etap.

### Acceptance criteria

* administrator może zbudować landing page bez edycji kodu;
* preview korzysta z `@restorio/mobile`;
* błędy wskazują konkretny blok;
* nie można opublikować niepoprawnej konfiguracji;
* obsługiwany jest keyboard fallback.

### Relations

Blocked by issues 4.2–4.4.

---

## 4.6 `Render published CMS pages in mobile-app`

### Scope

* pobieranie published schema;
* mapowanie bloków;
* fallback dla poprzedniej konfiguracji;
* cache;
* error states;
* telemetry nieznanych bloków;
* locale-aware content.

### Acceptance criteria

* opublikowana zmiana jest widoczna bez nowego deploymentu aplikacji;
* stara konfiguracja nadal działa podczas migracji;
* nieznany blok jest pomijany bez awarii;
* renderer używa wspólnego pakietu.

### Relations

Blocked by issues 4.1, 4.3 i 4.4.

---

## 4.7 `Integrate CMS media library with MinIO`

### Scope

* wybór istniejącego pliku;
* upload;
* metadata;
* alt text;
* warianty rozmiaru;
* bezpieczne usuwanie;
* wykrywanie referencji;
* presigned URLs;
* limity MIME i wielkości;
* cleanup nieużywanych plików.

### Acceptance criteria

* nie można usunąć assetu używanego przez published page bez ostrzeżenia;
* upload jest walidowany;
* obraz posiada alt text albo jawne oznaczenie dekoracyjne;
* frontend nie ładuje pełnego obrazu, gdy potrzebna jest miniatura.

---

## 4.8 `Expand mobile application configuration capabilities`

### Goal

Rozszerzyć punkt „dodanie większej możliwości” jako większą konfigurowalność aplikacji mobilnej.

### Scope

* widoczność sekcji;
* kolejność sekcji;
* custom CTA;
* banner promocyjny;
* godziny otwarcia;
* social links;
* dane kontaktowe;
* własne etykiety;
* featured menu items;
* konfiguracja bottom navigation;
* ustawienia SEO i share preview;
* domyślny ekran po wejściu;
* tryb maintenance/temporarily closed.

### Acceptance criteria

* konfiguracja jest walidowana;
* ustawienia są dostępne w preview;
* ustawienia nie wymagają release’u frontendu;
* istnieją bezpieczne wartości domyślne.

### Relations

Blocked by podstawowe issues CMS.

---

## 4.9 `Restore full i18n runtime and translation coverage`

### Goal

Przywrócić działające tłumaczenia, a nie tylko architektoniczną gotowość.

### Scope

* kontynuacja [#38](https://github.com/restorio-labs/restorio-fullstack/issues/38);
* ujednolicenie providerów;
* wybór locale;
* locale tenant-level dla mobile;
* preferencja użytkownika dla paneli;
* zapis locale;
* synchronizacja `lang` na HTML;
* formatowanie dat, kwot i liczb;
* walidacja brakujących kluczy;
* usunięcie hardcoded Polish/English strings;
* fallback locale.

### Acceptance criteria

* każda produkcyjna aplikacja działa po polsku i angielsku;
* CI wykrywa brakujące klucze;
* wybrany język pozostaje po odświeżeniu;
* kwoty i daty są formatowane zgodnie z locale;
* długie tłumaczenia nie łamią layoutu.

---

## 4.10 `Migrate existing mobile configuration data to CMS schema`

### Goal

Zapewnić bezpieczną migrację obecnych tenantów.

### Scope

* skrypt migracyjny;
* dry run;
* raport;
* idempotency;
* fallback;
* backup;
* rollback;
* migracja istniejących theme overrides, CTA i landing content.

### Acceptance criteria

* żaden tenant nie traci konfiguracji;
* migracja może zostać wykonana ponownie;
* wyniki dry run są dostępne przed zapisem;
* po migracji aplikacja zachowuje dotychczasowy wygląd.

---

# EPIC 5: Restaurant Discovery and Geolocation

## Tytuł

`[EPIC] Restaurant Discovery Map and Geolocation`

## Goal

Dodać publiczną mapę współpracujących restauracji i wymagać poprawnego położenia restauracji.

---

## 5.1 `Add structured restaurant address and geolocation data`

### Scope

* adres strukturalny;
* latitude;
* longitude;
* geocoding status;
* source;
* precision;
* public visibility;
* migracja;
* indeks geograficzny;
* rozważyć PostGIS `geography(Point, 4326)`.

### Acceptance criteria

* współrzędne nie są przechowywane wyłącznie jako string;
* zapytania po odległości używają indeksu;
* tenant isolation pozostaje zachowane;
* można oznaczyć lokalizację jako niepubliczną.

---

## 5.2 `Require restaurant location during onboarding and profile editing`

### Scope

* wymagane pola;
* walidacja adresu;
* możliwość wskazania punktu ręcznie;
* blokada publikacji restauracji bez lokalizacji;
* migracja istniejących tenantów z okresem przejściowym;
* komunikat o brakujących danych.

### Acceptance criteria

* nowa restauracja nie może zostać opublikowana bez lokalizacji;
* istniejące restauracje otrzymują czytelny status wymagający uzupełnienia;
* backend nie polega wyłącznie na walidacji frontendowej.

### Relations

Blocked by issue 5.1.

---

## 5.3 `Add geocoding and map picker to admin-panel`

### Scope

* wyszukiwanie adresu;
* marker;
* ręczne przesuwanie;
* reverse geocoding;
* potwierdzenie dokładności;
* obsługa błędów dostawcy;
* limity requestów;
* cache geocodingu.

### Acceptance criteria

* administrator widzi finalny punkt na mapie;
* zapisuje się zarówno adres, jak i współrzędne;
* awaria geocodingu pozwala wskazać punkt ręcznie;
* requesty nie ujawniają danych innych tenantów.

---

## 5.4 `Add public nearby-restaurants API`

### Scope

* bounding box;
* radius;
* sortowanie po odległości;
* pagination;
* tylko aktywne i publiczne restauracje;
* podstawowe filtry;
* ograniczenie pól odpowiedzi;
* rate limiting;
* testy indeksu i wydajności.

### Acceptance criteria

* endpoint nie zwraca prywatnych restauracji;
* zapytanie nie skanuje całej tabeli;
* odpowiedź zawiera dystans;
* limity chronią endpoint przed nadużyciem.

---

## 5.5 `Build the mobile root restaurant map`

### Scope

* mapa pod `/`;
* markery restauracji;
* popup/karta restauracji;
* przejście do tenant route;
* fallback listy;
* obsługa odmowy geolokalizacji;
* pozycja domyślna;
* loading/error/empty states.

### Acceptance criteria

* mapa działa bez zgody na położenie urządzenia;
* użytkownik może otworzyć restaurację;
* dostępny jest list fallback;
* markery nie ujawniają restauracji niepublicznych;
* root nie przekierowuje już wyłącznie do ostatniej restauracji bez możliwości discovery.

### Relations

Blocked by issues 5.1 i 5.4.

---

## 5.6 `Add map clustering, search and discovery filters`

### Scope

* clustering;
* wyszukiwanie po nazwie i mieście;
* filtry;
* viewport-based fetching;
* URL state;
* accessibility list;
* performance tests.

### Acceptance criteria

* mapa pozostaje responsywna przy dużej liczbie punktów;
* filtry mają reprezentację w URL;
* wszystkie wyniki mapy są dostępne również w formie listy;
* przesuwanie mapy nie generuje niekontrolowanej liczby requestów.

---

# EPIC 6: First-Party Analytics and Customer Intelligence

## Tytuł

`[EPIC] First-Party Analytics and Privacy-Aware Customer Intelligence`

## Goal

Zbudować własną analitykę produktową i restauracyjną oraz bezpieczny model profili klientów powiązanych z zamówieniami.

## Fundamental rule

Adres e-mail podany do realizacji płatności nie oznacza automatycznie zgody na marketing ani profilowanie.

Najpierw należy określić cele przetwarzania, podstawę prawną, retencję i mechanizmy praw użytkownika. Implementacja ma być privacy-aware i tenant-isolated.

---

## 6.1 `[ADR] Define analytics architecture, event taxonomy and storage`

### Scope

* cele analityki;
* event naming;
* schema version;
* tenant ID;
* anonymous/session/customer ID;
* event ID;
* timestamp klienta i serwera;
* source application;
* application version;
* consent state;
* idempotency;
* retention;
* storage decision.

### Storage decision

Porównać:

* partycjonowane PostgreSQL jako MVP;
* ClickHouse dla większego wolumenu;
* MongoDB;
* event queue przed storage.

### Acceptance criteria

* istnieje katalog eventów;
* eventy biznesowe i techniczne są rozdzielone;
* każde pole ma właściciela i cel;
* określono limity retencji;
* schemat umożliwia migracje wersji.

---

## 6.2 `Define privacy, consent and retention requirements for analytics`

### Goal

Ustalić wymagania przed tworzeniem profili klientów.

### Scope

* osobne cele: płatność, obsługa zamówienia, analityka, marketing;
* consent state;
* withdrawal;
* data minimisation;
* retention;
* export;
* deletion;
* tenant responsibilities;
* platform responsibilities;
* privacy notice;
* pseudonymizacja;
* audit log;
* dokumentacja review prawnego.

### Acceptance criteria

* marketing jest technicznie oddzielony od transakcyjnego e-maila;
* cofnięcie zgody zatrzymuje przyszłe użycie marketingowe;
* retencja jest egzekwowana przez job;
* istnieje workflow eksportu i usunięcia;
* issue jasno zaznacza konieczność review prawnego przed produkcją.

---

## 6.3 `Create @restorio/analytics event client`

### Goal

Ujednolicić emisję eventów przez aplikacje frontendowe.

### Scope

* typed events;
* batching;
* retry;
* deduplication;
* session ID;
* consent-aware transport;
* application version;
* event queue przy krótkim offline;
* zakaz przesyłania dowolnych obiektów i sekretów;
* testy.

### Acceptance criteria

* eventy są typowane;
* SDK odrzuca niedozwolone pola;
* brak zgody blokuje eventy wymagające zgody;
* błędy analityki nie blokują zamówienia;
* SDK jest używane przez wszystkie wymagane aplikacje.

### Relations

Blocked by issues 6.1 i 6.2.

---

## 6.4 `Implement analytics ingestion and storage pipeline`

### Scope

* ingestion endpoint;
* schema validation;
* rate limiting;
* idempotency;
* batch ingestion;
* tenant isolation;
* storage;
* dead-letter/error handling;
* retention jobs;
* monitoring.

### Acceptance criteria

* duplikat event ID nie tworzy drugiego rekordu;
* niepoprawny event ma czytelny błąd;
* tenant nie odczyta danych innego tenanta;
* ingestion nie obciąża krytycznej ścieżki płatności;
* metryki pokazują odrzucone eventy.

### Relations

Blocked by issues 6.1–6.3.

---

## 6.5 `Add restaurant analytics dashboards`

### Przykładowe metryki

* wejścia do restauracji;
* wyświetlenia menu;
* konwersja menu → koszyk;
* rozpoczęte i zakończone płatności;
* średnia wartość zamówienia;
* najpopularniejsze produkty;
* skuteczność promocji;
* użycie CTA;
* powracający klienci;
* porównanie okresów.

### Acceptance criteria

* wszystkie wyniki są tenant-scoped;
* dashboard pokazuje definicję metryki;
* obsługiwany jest zakres dat;
* metryki nie mieszają stref czasowych;
* wynik można powiązać z wersją event schema.

---

## 6.6 `Create privacy-aware customer profiles from payment identities`

### Goal

Połączyć historię zamówień tego samego klienta bez tworzenia niekontrolowanej bazy marketingowej.

### Scope

* normalizacja e-maila;
* wewnętrzny customer ID;
* opcjonalny hash do dopasowania;
* powiązanie transakcji i zamówień;
* consent flags;
* source;
* timestamps;
* tenant isolation;
* merge rules;
* brak przechowywania pełnych payloadów operatora płatności;
* możliwość profilu anonimowego/pseudonimowego.

### Acceptance criteria

* ten sam e-mail u dwóch restauracji nie tworzy współdzielonego profilu bez jawnej decyzji architektonicznej i prawnej;
* brak zgody marketingowej nie blokuje płatności;
* profil posiada informację o źródle danych;
* profil można usunąć lub zanonimizować;
* dane transakcyjne wymagane prawnie nie są usuwane razem z danymi marketingowymi bez analizy wymagań.

### Relations

Blocked by issues 6.1, 6.2 i 6.4.

---

## 6.7 `Add customer segmentation and marketing audiences`

### Scope

* częstotliwość zamówień;
* wartość zakupów;
* ostatnia aktywność;
* preferowane kategorie;
* klienci nowi/powracający;
* manualne segmenty;
* exclusion lists;
* tylko profile dopuszczone do danego celu;
* liczebność segmentu;
* preview criteria.

### Acceptance criteria

* segment nigdy nie zawiera użytkownika bez wymaganej podstawy dla danego celu;
* użytkownik po cofnięciu zgody znika z odpowiednich audience;
* kryteria segmentu są audytowalne;
* brak automatycznego wysyłania kampanii w pierwszej wersji.

### Relations

Blocked by issues 6.2, 6.5 i 6.6.

---

## 6.8 `Implement customer data export, deletion and consent audit`

### Scope

* wyszukiwanie użytkownika;
* eksport;
* anonimizacja;
* usunięcie danych marketingowych;
* cofnięcie zgody;
* audit trail;
* status realizacji żądania;
* ograniczony dostęp pracowników;
* testy tenant isolation.

### Acceptance criteria

* operator może wykonać eksport bez ręcznych zapytań do bazy;
* operacja jest audytowana;
* dane innego tenanta nie są dostępne;
* usunięcie jest propagowane do analityki i audience;
* retencja i wyjątki są jawnie udokumentowane.

---

# Dodatkowe relacje i kolejność realizacji

Po utworzeniu wszystkich issues dodaj zależności zgodnie z poniższą kolejnością.

## Etap 1 — pilne fundamenty

1. Audit Dependabot.
2. Ujednolicenie React/Vite.
3. Graf zależności i reguły wersjonowania.
4. Changesets i wersjonowanie API.
5. Runtime version metadata.
6. Generowany OpenAPI client.

## Etap 2 — release automation

1. Release PR.
2. Tagi i GitHub Releases.
3. Selektywne buildy.
4. Selektywne deploymenty.
5. Smoke tests i rollback.

## Etap 3 — platforma produkcyjna

1. ADR topologii.
2. Obrazy OCI.
3. k3s.
4. Helm.
5. secrets/networking.
6. storage i backup.
7. observability.
8. cutover.

## Etap 4 — frontend

1. Vinext PoC.
2. shared template.
3. public-web.
4. pozostałe aplikacje.
5. deployment parity.

## Etap 5 — produkt mobilny

1. `@restorio/mobile`.
2. wspólny renderer.
3. schema CMS.
4. API draft/publish.
5. editor.
6. mobile runtime.
7. i18n.
8. mapa i lokalizacja.

## Etap 6 — dane i marketing

1. analytics ADR.
2. privacy model.
3. event SDK.
4. ingestion.
5. dashboards.
6. customer profiles.
7. segmentation.
8. export/deletion.

# Final report

Po zakończeniu tworzenia issues zwróć:

1. link do każdego epika;
2. listę child issues pod każdym epikiem;
3. informacje o wykrytych duplikatach;
4. issues, których nie utworzono z powodu istniejącego odpowiednika;
5. brakujące labels;
6. pełną kolejność zależności;
7. liczbę utworzonych epików i child issues.
