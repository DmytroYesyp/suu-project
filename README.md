# Knative - OTel

[GoogleDocs](https://docs.google.com/document/d/1zVsoGiIb50rPzTMCSIOD62AAp-FyuXdTZhBHDyCoWtY/edit?tab=t.0)

Jan Chyczyński, Kacper Kozak, Dmytro Yesyp, Bartłomiej Słupik

## Wprowadzenie

Ten projekt demonstruje praktyczne zastosowanie Knative na przykładzie zmodyfikowanej aplikacji Bookstore – prostej księgarni internetowej działającej w architekturze event-driven. Aplikacja została rozszerzona o mechanizmy obsługi błędów, takie jak retry i dead letter sink, oraz zintegrowana z OpenTelemetry i Grafaną w celu monitorowania przepływu zdarzeń. Projekt ilustruje kluczowe cechy Knative, takie jak przetwarzanie zdarzeń, elastyczne skalowanie oraz niezawodna obsługa niepowodzeń, dając jednocześnie wgląd w działanie systemu dzięki wizualizacji metryk i śledzeniu zdarzeń w czasie rzeczywistym.

## Podstawy teoretyczne i opis stosu technologicznego

Knative to system, który pomaga deweloperom w zarządzaniu i utrzymywaniu procesów w Kubernetes. Jego celem jest uproszczenie, zautomatyzowanie i monitorowanie wdrożeń w Kubernetes, aby zespoły spędzały mniej czasu na konserwacji, a więcej na tworzeniu aplikacji i realizacji projektów.Knative przejmuje powtarzalne i czasochłonne zadania, eliminując wąskie gardła i opóźnienia.

Te założenia realizowane są za pomocą dwóch funkcji. Pierwsza to  Knative Eventing , która pozwala deweloperom definiować akcje wyzwalane przez określone zdarzenia zachodzące w szerszym środowisku. Druga to  Knative Serving , która automatycznie zarządza tworzeniem oraz skalowaniem usług w Kubernetes, włącznie ze skalowaniem do zera.

Obie te funkcje mają na celu uwolnienie zasobów, które zespoły normalnie musiałyby przeznaczyć na zarządzanie systemami. Dodatkowo przynoszą one oszczędności finansowe, reagując na zmieniające się warunki w czasie rzeczywistym, włączając w to “skalowanie do zera”  — firmy płacą tylko za zasoby, które faktycznie wykorzystują, a nie za te, które mogłyby potencjalnie zużyć.

Kluczowa idea Knative polega na umożliwieniu zespołom wykorzystania potencjału bezserwerowego wdrażania aplikacji. „Serverless” odnosi się do zarządzania serwerami i maszynami wirtualnymi w chmurze, często udostępnianymi przez platformy takie jak AWS, Google Cloud czy Microsoft Azure. Serverless to doskonałe rozwiązanie dla firm, które chcą odejść od kosztownego utrzymywania własnych serwerów i infrastruktury.

#### Główne cechy Knative:

* Automatyczne skalowanie w oparciu o obciążenie ruchem. Wprowdza skalowanie do zera, pozwalające zmniejszyć użycie zasobów.
* Natywne wsparcie dla architektury Event-driven, która w samym Kubernetesie wymaga użycia zewnętrznego narzędzia takiego jak RabbitMQ czy Kafka.
* “Revisions” - knative tworzy snapshoty serwisów i ich konfiguracji co ułatwia operacje takie jak rollback i wersjonowanie.
* Traffic splitting - pozwala trasować ruch na wiele “revisions” w prosty sposób wspierając “Canary release” czy A/B testing.
* Ułatwia development wprowadzając CRD “Service”, zastępujący Deploymenty/Statefulsety i obsługujący routing czy scalling co w czystym kubernetesie wymagałoby zdefiniowania i skonfigurowania dodatkowych zasobów.
* Wbudowane trasowanie - automatyczne generowanie tras HTTP z możliwością dostosowania domen.

Knative posiada również wbudowane mechanizmy obsługi błędów, które zwiększają niezawodność architektury event-driven. W przypadku gdy dostarczenie zdarzenia do jednej z usług zakończy się niepowodzeniem, możliwe jest automatyczne ponawianie prób zgodnie z konfigurowalną polityką retry. Jeśli mimo prób dostarczenie się nie powiedzie, zdarzenie może zostać przekierowane do tzw. Dead Letter Sink  — specjalnego komponentu, który przechowuje lub loguje zdarzenia niedostarczone. Dzięki temu żadne dane nie zostają utracone, a deweloperzy mogą łatwo analizować przyczyny niepowodzeń.

#### Stos technologiczny

Projekt oparty jest na Kubernetes i wykorzystuje Knative do zarządzania usługami i przetwarzania zdarzeń w architekturze event-driven. Backend aplikacji zbudowany jest w Node.js, interfejs użytkownika w Next.js, a dane przechowywane są w PostgreSQL. Przetwarzanie komentarzy realizują funkcje Knative wykorzystujące modele ML do analizy sentymentu i filtrowania treści. Do monitorowania systemu zastosowano OpenTelemetry oraz Grafanę, umożliwiając wizualizację przepływu zdarzeń i metryk związanych z obsługą błędów.

## Koncepcja projektu

[Knative Bookstore Code Samples: GitHub Aplikacja Bookstore](https://github.com/knative/docs/tree/main/code-samples/eventing/bookstore-sample-app/solution)

Opis katalogu „solution” przykładowej aplikacji Knative Bookstore – w pełni zaimplementowanego, event-driven sklepu z książkami opartego na Knative Eventing.

**Struktura**

* **bad-word-filter**/  Funkcja Knative filtrująca nieodpowiednie treści w komentarzach.
* **db-service**/  Usługa bazodanowa przechowująca recenzje i komentarze do książek.
* **frontend**/  Interfejs użytkownika aplikacji Bookstore, zbudowany w Next.js.
* **node-server**/  Serwer Node.js obsługujący zaplecze (backend) aplikacji.
* **sentiment-analysis-app**/  Funkcja Knative analizująca sentyment recenzji książek.
* **sequence**/  Konfiguracja Knative Sequence do orkiestracji przepływu zdarzeń między komponentami.
* **slack-sink**/  Integracja z Slack (Apache Camel) wysyłająca powiadomienia o nowych recenzjach.

#### Modyfikacja aplikacji Bookstore (Knative Eventing)

W ramach naszego projektu dokonamy rozszerzenia aplikacji demonstracyjnej Bookstore, opartej na architekturze event-driven z wykorzystaniem Knative. Głównym celem tej modyfikacji jest zaprezentowanie mechanizmów obsługi błędów w systemie przesyłania zdarzeń, takich jak ponowne próby (retry) i obsługa zdarzeń niedostarczalnych (dead-letter sink – DLS). Dodamy też observability w postaci Grafany połączonej przez Prometheus z OpenTelemetry.

* **Symulacja błędów w usłudze Slack Sink**: 
    * Wprowadzimy losową awaryjność (np. zwracanie błędu HTTP 500) w komponencie slack-sink, który odpowiada za wysyłkę powiadomień do Slacka.
    * Celem jest wymuszenie sytuacji, w których zdarzenia nie są poprawnie przetwarzane.
* **Dodanie mechanizmu Dead Letter Sink**: 
    * Utworzymy osobny komponent (Knative Service), który będzie odbiorcą zdarzeń, które nie zostały pomyślnie dostarczone po określonej liczbie prób.
    * Zostanie on przypisany jako deadLetterSink w konfiguracji brokera (lub triggera).
* **Konfiguracja polityki retry i backoff**: 
    * Skonfigurujemy parametry retry w Knative Eventing (liczbę prób, politykę opóźnień).
    * Umożliwi to demonstrację automatycznego ponawiania dostarczania zdarzeń w przypadku niepowodzenia.
* **Obserwowalność i monitoring**: 
    * Wdrożymy eksportery OpenTelemetry w kluczowych komponentach.
    * Dzięki temu możliwa będzie analiza tras zdarzeń, czasów przetwarzania, liczby prób oraz przypadków przekierowania do DLS.

## Podział zadań

* modyfikacja aplikacji: symulacja błędów w usłudze Slack Sink i obsługa błędów (2 os.)
* integracja aplikacji z OTel
* integracja z Grafaną
