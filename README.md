Knative \- OTel
==============

[GoogleDocs](https://docs.google.com/document/d/1zVsoGiIb50rPzTMCSIOD62AAp-FyuXdTZhBHDyCoWtY/edit?tab=t.0)


**Jan Chyczyński, Kacper Kozak, Dmytro Yesyp, Bartłomiej Słupik**

# Wprowadzenie

Ten projekt demonstruje praktyczne zastosowanie Knative na przykładzie zmodyfikowanej aplikacji Bookstore – prostej księgarni internetowej działającej w architekturze event-driven. Aplikacja została rozszerzona o mechanizmy obsługi błędów, takie jak retry i dead letter sink, oraz zintegrowana z OpenTelemetry i Grafaną w celu monitorowania przepływu zdarzeń. Projekt ilustruje kluczowe cechy Knative, takie jak przetwarzanie zdarzeń, elastyczne skalowanie oraz niezawodna obsługa niepowodzeń, dając jednocześnie wgląd w działanie systemu dzięki wizualizacji metryk i śledzeniu zdarzeń w czasie rzeczywistym.

# Podstawy teoretyczne i opis stosu technologicznego

Knative to system, który pomaga deweloperom w zarządzaniu i utrzymywaniu procesów w Kubernetes. Jego celem jest uproszczenie, zautomatyzowanie i monitorowanie wdrożeń w Kubernetes, aby zespoły spędzały mniej czasu na konserwacji, a więcej na tworzeniu aplikacji i realizacji projektów. Knative przejmuje powtarzalne i czasochłonne zadania, eliminując wąskie gardła i opóźnienia.

Te założenia realizowane są za pomocą dwóch funkcji. Pierwsza to **Knative Eventing**, która pozwala deweloperom definiować akcje wyzwalane przez określone zdarzenia zachodzące w szerszym środowisku. Druga to **Knative Serving**, która automatycznie zarządza tworzeniem oraz skalowaniem usług w Kubernetes, włącznie ze skalowaniem do zera. Obie te funkcje mają na celu uwolnienie zasobów, które zespoły normalnie musiałyby przeznaczyć na zarządzanie systemami. Dodatkowo przynoszą one oszczędności finansowe, reagując na zmieniające się warunki w czasie rzeczywistym, włączając w to “skalowanie do zera”  — firmy płacą tylko za zasoby, które faktycznie wykorzystują, a nie za te, które mogłyby potencjalnie zużyć.

Kluczowa idea Knative polega na umożliwieniu zespołom wykorzystania potencjału bezserwerowego wdrażania aplikacji. „Serverless” odnosi się do zarządzania serwerami i maszynami wirtualnymi w chmurze, często udostępnianymi przez platformy takie jak AWS, Google Cloud czy Microsoft Azure. Serverless to doskonałe rozwiązanie dla firm, które chcą odejść od kosztownego utrzymywania własnych serwerów i infrastruktury.

**OpenTelemetry** to otwarty standard oraz zbiór narzędzi, bibliotek i API, stworzony w celu zbierania danych telemetrycznych z oprogramowania. Jego głównym celem jest standaryzacja sposobu instrumentowania aplikacji, umożliwiając deweloperom gromadzenie danych o wykonywaniu kodu, niezależnie od używanego języka programowania czy frameworku, a także niezależnie od systemu monitorowania, który będzie te dane analizował i wizualizował (takich jak Grafana, Prometheus, Jaeger itp.).

OpenTelemetry koncentruje się na trzech głównych typach telemetrii: śladach (traces), które śledzą drogę żądania przez rozproszony system; metrykach (metrics), które mierzą wskaźniki wydajności (np. liczbę żądań, czas odpowiedzi, wykorzystanie zasobów); oraz logach (logs), które rejestrują zdarzenia w aplikacji. Integrując biblioteki OpenTelemetry ze swoim kodem, "instrumentujesz" go, aby automatycznie lub zgodnie z Twoimi wytycznymi generował te dane. Następnie dane te mogą być eksportowane (za pośrednictwem OpenTelemetry Collector lub bezpośrednio) do różnych systemów backendowych w celu przechowywania, analizy, wizualizacji i alertowania, co zapewnia głębokie zrozumienie działania systemu, lokalizację problemów i ich rozwiązywanie.

**Główne cechy Knative:**

* Automatyczne skalowanie w oparciu o obciążenie ruchem. Wprowdza skalowanie do zera, pozwalające zmniejszyć użycie zasobów.  
* Natywne wsparcie dla architektury Event-driven, która w samym Kubernetesie wymaga użycia zewnętrznego narzędzia takiego jak RabbitMQ czy Kafka.  
* “Revisions” \- knative tworzy snapshoty serwisów i ich konfiguracji co ułatwia operacje takie jak rollback i wersjonowanie.  
* Traffic splitting \- pozwala trasować ruch na wiele “revisions” w prosty sposób wspierając “Canary release” czy A/B testing.  
* Ułatwia development wprowadzając CRD “Service”, zastępujący Deploymenty/Statefulsety i obsługujący routing czy scalling co w czystym kubernetesie wymagałoby zdefiniowania i skonfigurowania dodatkowych zasobów.  
* Wbudowane trasowanie \- automatyczne generowanie tras HTTP z możliwością dostosowania domen.

Knative posiada również wbudowane mechanizmy obsługi błędów, które zwiększają niezawodność architektury event-driven. W przypadku gdy dostarczenie zdarzenia do jednej z usług zakończy się niepowodzeniem, możliwe jest automatyczne ponawianie prób zgodnie z konfigurowalną polityką retry. Jeśli mimo prób dostarczenie się nie powiedzie, zdarzenie może zostać przekierowane do tzw. *Dead Letter Sink* — specjalnego komponentu, który przechowuje lub loguje zdarzenia niedostarczone. Dzięki temu żadne dane nie zostają utracone, a deweloperzy mogą łatwo analizować przyczyny niepowodzeń.

### Stos technologiczny

Projekt oparty jest na Kubernetes i wykorzystuje Knative do zarządzania usługami i przetwarzania zdarzeń w architekturze event-driven. Backend aplikacji zbudowany jest w Node.js, interfejs użytkownika w Next.js, a dane przechowywane są w PostgreSQL. Przetwarzanie komentarzy realizują funkcje Knative wykorzystujące modele ML do analizy sentymentu i filtrowania treści. Do monitorowania systemu zastosowano OpenTelemetry oraz Grafanę, umożliwiając wizualizację przepływu zdarzeń i metryk związanych z obsługą błędów.

# Koncepcja projektu

[Knative Bookstore Code Samples: GitHub Aplikacja Bookstore](https://github.com/knative/docs/tree/main/code-samples/eventing/bookstore-sample-app/solution)

Opis katalogu „solution” przykładowej aplikacji Knative Bookstore – w pełni zaimplementowanego, event-driven sklepu z książkami opartego na Knative Eventing. Kod źródłowy dostępny jest tutaj:

#### **Struktura**

1. **bad-word-filter/**  
    Funkcja Knative filtrująca nieodpowiednie treści w komentarzach.

2. **db-service/**  
    Usługa bazodanowa przechowująca recenzje i komentarze do książek.

3. **frontend/**  
    Interfejs użytkownika aplikacji Bookstore, zbudowany w Next.js.

4. **node-server/**  
    Serwer Node.js obsługujący zaplecze (backend) aplikacji.

5. **sentiment-analysis-app/**  
    Funkcja Knative analizująca sentyment recenzji książek.

6. **sequence/**  
    Konfiguracja Knative Sequence do orkiestracji przepływu zdarzeń między komponentami.

7. **slack-sink/**  
    Integracja z Slack (Apache Camel) wysyłająca powiadomienia o nowych recenzjach.

<br>
<img src='images/image1.png'>
<br>

## Modyfikacja aplikacji Bookstore (Knative Eventing)

W ramach naszego projektu dokonamy rozszerzenia aplikacji demonstracyjnej Bookstore, opartej na architekturze event-driven z wykorzystaniem Knative. Głównym celem tej modyfikacji jest zaprezentowanie mechanizmów obsługi błędów w systemie przesyłania zdarzeń, takich jak ponowne próby (retry) i obsługa zdarzeń niedostarczalnych (dead-letter sink – DLS). Dodamy też observability w postaci Grafany połączonej przez Prometheus z OpenTelemetry.

1. **Symulacja błędów w usłudze Slack Sink:**

   * Wprowadzimy losową awaryjność (np. zwracanie błędu HTTP 500\) w komponencie slack-sink, który odpowiada za wysyłkę powiadomień do Slacka.

   * Celem jest wymuszenie sytuacji, w których zdarzenia nie są poprawnie przetwarzane.

2. **Dodanie mechanizmu Dead Letter Sink:**

   * Utworzymy osobny komponent (Knative Service), który będzie odbiorcą zdarzeń, które nie zostały pomyślnie dostarczone po określonej liczbie prób.

   * Zostanie on przypisany jako deadLetterSink w konfiguracji brokera (lub triggera).

3. **Konfiguracja polityki retry i backoff:**

   * Skonfigurujemy parametry retry w Knative Eventing (liczbę prób, politykę opóźnień).

   * Umożliwi to demonstrację automatycznego ponawiania dostarczania zdarzeń w przypadku niepowodzenia.

4. **Obserwowalność i monitoring:**

   * Wdrożymy eksportery OpenTelemetry w kluczowych komponentach.

   * Dzięki temu możliwa będzie analiza tras zdarzeń, czasów przetwarzania, liczby prób oraz przypadków przekierowania do DLS.


### **Wykorzystanie Kameleta do symulacji błędów i obsługi przez Dead Letter Sink**

Zastosujemy Kamelet jako komponent pośredniczący, którego zadaniem będzie celowe odrzucanie części wiadomości. Celem jest wygenerowanie błędów dostarczania, które trafią następnie do Dead Letter Sink (DLS), gdzie zostaną przekazane do OpenTEL w celu zwizualizowania ich w Grafanie.

#### **Mechanizm działania:**

1. Kamelet zostanie zaimplementowany jako konsument wiadomości (sink), który jako odpowiedź na co 5 wiadomość zwraca wyjątek..

2. W przypadku zwrócenia wyjątku przez Kameleta, Knative Eventing automatycznie podejmieł próbę ponownego dostarczenia wiadomości zgodnie z polityką *retry*.

3. Po przekroczeniu limitu prób, wiadomość zostanie przekierowana do wcześniej zdefiniowanego *Dead Letter Logger*, którym będzie osobny Knative Service odpowiedzialny za logowanie błędów. Odwołanie do tego serwisu będzie zdefiniowane jako *deadLetterSink* brokera *badword-broker (slack-sink/config/100-broker.yaml).*

4. DLS przekaże informacje o nieudanych zdarzeniach do Grafany za pośrednictwem zintegrowanego systemu monitoringu w standardzie Open Telemetry.

<br>
<img src='images/image3.png'>
<br>


# Architektura Rozwiązania

### <br>
<img src='images/image2.png'>
<br>


Architektura Systemu Systemu Knative \- OTel (Zmodyfikowana)

## Implementacja modyfikacji aplikacji Bookstore

### Uproszczenie aplikacji

<br>
<img src='images\kamel.png'>
<br>

Z powodu przestarzałości, niezgodności wersji i problemów z konfiguracją (a szczególnie konfiguracją Camel-K co obrazuje powyższa infografika) postanowiono usunać następujące serwisy:
* slack-sink (zastąpiony przez file-sink)
* bad-word-filter (zbędny dla głównej idei projektu)
* sentiment-analysis-app (zbędny dla głównej idei projektu)

### Implementacja serwisu file-sink

TODO

#### Symulacja błędów w serwisie file-sink

Fragment `file-sink/index.js` odpowiadający za symulację błędów
```javascript
 // Save the received event to a file (append mode)
 fs.appendFileSync('/data/events.log', JSON.stringify(req.body) + '\n');
 if (Math.random() < 0.5) {
   fs.appendFileSync('/data/events.log', 'error simulated\n');
   return res.status(500).send('Internal Server Error');
 }
 // Respond with a success message
 res.status(200).send('Event saved');
 ```

 ### Dead Letter Sink

 #### Definicja serwisu dead-letter-logger

 dead-letter-logger\config\dead-letter-logger.yaml

 ```yaml
 apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: dead-letter-logger
spec:
  template:
    metadata:
      annotations:
        # Tells Knative not to try pulling the image from Docker Hub
        "container.applinks.io/skipImagePull": "true"
    spec:
      containers:
        - image: dev.local/dead-letter-logger:latest
          volumeMounts:
            - name: data
              mountPath: /data
          ports:
            - containerPort: 8080
      volumes:
        - name: data
          emptyDir: {}
```

#### Podpięcie `dead-letter-logger` jako dead letter sink `bookstore-broker`

```
apiVersion: eventing.knative.dev/v1
kind: Broker
metadata:
  name: bookstore-broker
spec:
  delivery:
    deadLetterSink:
      ref:
        apiVersion: serving.knative.dev/v1
        kind: Service
        name: dead-letter-logger
    retry: 2
    backoffPolicy: exponential
    backoffDelay: PT1S
```

## **Konfiguracja i Wdrożenie Systemu Telemetrii**

Sekcja szczegółowo opisuje proces konfiguracji i wdrożenia kompleksowego systemu telemetrii w środowisku Kubernetes, wykorzystującego Prometheus, Grafanę oraz OpenTelemetry Collector. Celem jest zbieranie metryk zarówno z komponentów systemu, jak i z aplikacyjnych punktów końcowych, w szczególności z serwisu Node.js.

#### **Przegląd Architektury Monitorowania**

Zaimplementowany system monitorowania opiera się na następujących kluczowych komponentach:

* **Prometheus**: Działa jako centralna baza danych do przechowywania metryk, odpowiedzialna za ich zbieranie (scraping) oraz ocenę reguł alertów.  
* **Grafana**: Służy do wizualizacji metryk zebranych przez Prometheusa, umożliwiając tworzenie dynamicznych pulpitów nawigacyjnych (dashboardów).  
* **OpenTelemetry Collector**: Pełni rolę pośrednika, który zbiera metryki z aplikacji (w tym przypadku serwisu Node.js) w formacie Prometheus, a następnie przesyła je do Prometheusa. Collector również udostępnia swoje własne metryki stanu.

#### **Co jest monitorowane?**

System jest skonfigurowany do monitorowania dwóch głównych źródeł metryk:

1. **Sam OpenTelemetry Collector**: Prometheus aktywnie skrobie metryki zdrowia i wydajności samego Collectora, zapewniając wgląd w jego działanie.  
2. **Serwis node-server**: OpenTelemetry Collector skrobie metryki wystawiane przez serwis, a następnie przesyła je do Prometheusa. Ten model odciąża Prometheusa od bezpośredniego scrapowania aplikacji i pozwala na elastyczne przetwarzanie metryk przez Collector.

#### **Przewodnik po Konfiguracji Systemu**

Poniższe kroki przedstawiają kompletny proces instalacji i konfiguracji opisanego systemu telemetrii.

1. **Instalacja Helm:**

   ```Bash  
   curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
   ```
2. **Dodanie repozytorium Helm dla Prometheus Community:**

   ```Bash  
   helm repo add prometheus-community [https://prometheus-community.github.io/helm-charts](https://prometheus-community.github.io/helm-charts)

    helm repo update
    ```

3. **Tworzenie przestrzeni nazw monitoring:**

    ```Bash 
    kubectl create namespace monitoring
    ```
     
4. **Instalacja kube-prometheus-stack przy użyciu Helm:** Pakiet ten zawiera Prometheus, Grafanę i Alertmanager, a także inne komponenty Kubernetes do monitorowania. Grafana jest skonfigurowana do wystawiania na NodePort 30000 dla łatwego dostępu.

   ```Bash  
   helm install prometheus prometheus-community/kube-prometheus-stack \
     --namespace monitoring \
     --set grafana.service.type=NodePort \
     --set grafana.service.nodePort=30000 \
     --set prometheus.prometheusSpec.maximumStartupDurationSeconds=60
     ```
5. **Weryfikacja instalacji Prometheus:** Sprawdź, czy pody Prometheus są uruchomione.

   ```Bash  
   kubectl --namespace monitoring get pods -l "release=prometheus"
   ```
6. **Weryfikacja instalacji Grafany:** Sprawdź, czy pody Grafana są uruchomione.

   ```Bash  
   kubectl get pods -n monitoring -l app.kubernetes.io/name=grafana
   ```
7. **Pobranie hasła administratora Grafany:**

   ```Bash  
   kubectl get secret -n monitoring prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 --decode
   ```

<br>
<img src='images\OTel_password_guide_1.png'>
<br>

wynik polecenia służącego do pobrania i dekodowania hasła administratora Grafany

8. **(Opcjonalnie) Wdrożenie OpenTelemetry Collector:** Poniższe komendy aplikują konfigurację Collectora, jego Deployment, Service, RBAC oraz ServiceMonitor. Należy upewnić się, że pliki YAML są wcześniej poprawione (np. port 8888 dla wewnętrznych metryk Collectora i prawidłowe uprawnienia RBAC).

   ```Bash  
   kubectl apply -f otel-collector/otel-collector-rbac.yaml  
   kubectl apply -f otel-collector/otel-collector-configmap.yaml  
   kubectl apply -f otel-collector/otel-collector-deployment.yaml  
   kubectl apply -f otel-collector/otel-collector-config.yaml  
   kubectl apply -f otel-collector/otel-collector-servicemonitor.yaml
   ```

Ten krok zakłada, że pliki YAML znajdujące się w otel-collector/ zostały wcześniej zaktualizowane i zawierają prawidłowe konfiguracje, w tym poprawne porty i uprawnienia.

### **Wizualizacja i Weryfikacja Systemu Monitorowania**

Poniższe zrzuty ekranu stanowią wizualne potwierdzenie poprawnego wdrożenia oraz funkcjonalności systemu telemetrii. Prezentują kluczowe aspekty od dostępu do interfejsów, przez status celów skrobania, aż po wizualizację zebranych metryk.

<br>
<img src='images\OTel_example_grafana_1.png'>
<br>

Ten pulpit Grafany, również z Node Exporter, stosuje metodę USE (Utilization, Saturation, Errors) do zagregowanych metryk na poziomie całego klastra. Dostarcza szybkiego wglądu w ogólny stan wydajności i potencjalne problemy w klastrze  

<br>
<img src='images\OTel_example_grafana_2.png'>
<br>

Pulpit Node Exporter w Grafanie, który wizualizuje metryki dotyczące zasobów dla każdego pojedynczego węzła w klastrze Kubernetes. Umożliwia monitorowanie zużycia CPU, pamięci i sieci dla poszczególnych maszyn.

<br>
<img src='images\OTel_example_grafana_3.png'>
<br>

Pulpit nawigacyjny Grafany prezentujący ogólny przegląd stanu i wydajności serwera Prometheus. Wizualizuje kluczowe metryki działania samego systemu Prometheus.  

<br>
<img src='images\OTel_example_prometeus_1.png'>
<br>

Ten widok z interfejsu użytkownika Prometheus przedstawia listę wszystkich celów (targets) monitorowania. Wskazuje ich status (UP/DOWN) oraz szczegóły skrobania, potwierdzając, czy Prometheus skutecznie zbiera metryki ze skonfigurowanych źródeł.

Metryki node servera w grafanie:
<br>
<img src='images\OTel_grafana_node-server_visualtisation_1.png'>
<br>

OTel-collector console:
<br>
<img src='images\OTel_otel-collector_console_1.png'>
<br>




## Wdrożenie Systemu Trasowania (Tracingu) z Użyciem Jaeger

  W celu uzyskania głębszego wglądu w działanie poszczególnych żądań i operacji w systemie, wdrożono również system trasowania rozproszonego oparty o Jaeger. Umożliwia to śledzenie przepływu żądań przez różne komponenty aplikacji, identyfikację wąskich gardeł oraz ułatwia diagnozowanie problemów.

### Architektura Trasowania

System trasowania został zintegrowany z istniejącą architekturą monitorowania:

* Aplikacje (`node-server` i `file-sink`): Każdy z tych serwisów został zinstrumentowany przy użyciu bibliotek OpenTelemetry. Generują one dane trasowania (tzw. spany) dla przychodzących i wychodzących żądań.

* OpenTelemetry Collector: Działa jako centralny agent, który odbiera dane trasowania z obu serwisów. Po ich przetworzeniu, kolektor przesyła je bezpośrednio do backendu Jaeger.

* Jaeger: Służy jako system do przechowywania, analizy i wizualizacji zebranych tras. Udostępnia interfejs użytkownika, który pozwala na szczegółowe przeglądanie poszczególnych śladów.

### Konfiguracja i Implementacja

Implementacja trasowania objęła dwa kluczowe serwisy: `node-server` oraz `file-sink`. Aby włączyć generowanie tras, dla każdego z nich stworzono dedykowany plik konfiguracyjny JavaScript, który jest ładowany przy starcie aplikacji:

1. `tracing.js`: Odpowiedzialny za instrumentację serwisu node-server.

2. `file-sink-tracing.js`: Odpowiedzialny za instrumentację serwisu `file-sink` (uruchamianego przez `index.js`).

Pliki te inicjują OpenTelemetry SDK, konfigurują eksporter OTLP do wysyłania danych do kolektora oraz automatycznie instrumentują popularne biblioteki (takie jak Express.js czy klienty HTTP), aby minimalizować potrzebę ręcznych zmian w kodzie aplikacji.

Weryfikacja i Wizualizacja Tras
Poniższe zrzuty ekranu z interfejsu użytkownika Jaeger potwierdzają, że dane trasowania są poprawnie zbierane i przesyłane dla obu monitorowanych serwisów.

<br>
<img src='images\file-sink-service_jaeger_traces_1.png'>
<br>

<br>
<img src='images\node-server_jaeger_traces_1.png'>
<br>

## **Opis Działania Aplikacji**

W niniejszej sekcji przedstawiono wizualne potwierdzenie poprawnego uruchomienia komponentów frontendu i backendu aplikacji.  
**1\. Działanie Frontendu**
![frontend aplikacji](https://github.com/user-attachments/assets/af6bb047-549b-400c-9bc8-6074f7645661)

<br>
<img src='images\frontend_example_app_1.png'>
<br>

Powyższy zrzut ekranu prezentuje poprawnie uruchomiony interfejs użytkownika (frontend) aplikacji.   

**2\. Działanie Backendu**
![Backend](https://github.com/user-attachments/assets/90a3824f-c8fe-4bed-b8e9-56b8fd36daaf)

<br>
<img src='images\backend_example_app_1.png'>
<br>

Powyższy zrzut ekranu prezentuje poprawnie uruchomiony backendu aplikacji. 


W ramach naszego projektu dokonamy rozszerzenia aplikacji demonstracyjnej Bookstore, opartej na architekturze event-driven z wykorzystaniem Knative. Głównym celem tej modyfikacji jest zaprezentowanie mechanizmów obsługi błędów w systemie przesyłania zdarzeń, takich jak ponowne próby (retry) i obsługa zdarzeń niedostarczalnych (dead-letter sink – DLS). Dodamy też observability w postaci Grafany połączonej przez Prometheus z OpenTelemetry.

1. **Symulacja błędów w usłudze Slack Sink:**

   * Wprowadzimy losową awaryjność (np. zwracanie błędu HTTP 500\) w komponencie slack-sink, który odpowiada za wysyłkę powiadomień do Slacka.

   * Celem jest wymuszenie sytuacji, w których zdarzenia nie są poprawnie przetwarzane.

2. **Dodanie mechanizmu Dead Letter Sink:**

   * Utworzymy osobny komponent (Knative Service), który będzie odbiorcą zdarzeń, które nie zostały pomyślnie dostarczone po określonej liczbie prób.

   * Zostanie on przypisany jako deadLetterSink w konfiguracji brokera (lub triggera).

3. **Konfiguracja polityki retry i backoff:**

   * Skonfigurujemy parametry retry w Knative Eventing (liczbę prób, politykę opóźnień).

   * Umożliwi to demonstrację automatycznego ponawiania dostarczania zdarzeń w przypadku niepowodzenia.

4. **Obserwowalność i monitoring:**

   * Wdrożymy eksportery OpenTelemetry w kluczowych komponentach.

   * Dzięki temu możliwa będzie analiza tras zdarzeń, czasów przetwarzania, liczby prób oraz przypadków przekierowania do DLS.


### **Wykorzystanie Kameleta do symulacji błędów i obsługi przez Dead Letter Sink**

Zastosujemy Kamelet jako komponent pośredniczący, którego zadaniem będzie celowe odrzucanie części wiadomości. Celem jest wygenerowanie błędów dostarczania, które trafią następnie do Dead Letter Sink (DLS), gdzie zostaną przekazane do OpenTEL w celu zwizualizowania ich w Grafanie.

#### **Mechanizm działania:**

1. Kamelet zostanie zaimplementowany jako konsument wiadomości (sink), który jako odpowiedź na co 5 wiadomość zwraca wyjątek..

2. W przypadku zwrócenia wyjątku przez Kameleta, Knative Eventing automatycznie podejmieł próbę ponownego dostarczenia wiadomości zgodnie z polityką *retry*.

3. Po przekroczeniu limitu prób, wiadomość zostanie przekierowana do wcześniej zdefiniowanego *Dead Letter Logger*, którym będzie osobny Knative Service odpowiedzialny za logowanie błędów. Odwołanie do tego serwisu będzie zdefiniowane jako *deadLetterSink* brokera *badword-broker (slack-sink/config/100-broker.yaml).*

4. DLS przekaże informacje o nieudanych zdarzeniach do Grafany za pośrednictwem zintegrowanego systemu monitoringu w standardzie Open Telemetry.

![](images/image3.png)


# Architektura Rozwiązania

# Instalacja aplikacji

### Uruchomienie aplikacji

Przed uruchomieniem skryptu należy zainstalować wszystkie wymagane komponenty opisane w rozdziale **„Konfiguracja i Wdrożenie Systemu Telemetrii”**. Dopiero po ich poprawnej instalacji można przystąpić do uruchomienia aplikacji według poniższych kroków:

```bash  
./solution.sh
```  
Wykonujemy ewentualne polecenia wypisane przez skrypt.

# Uruchamianie demo

1. **Frontend**  
   Frontend aplikacji jest dostępny pod http://localhost:3000/

2. **Backend**  
   Prosty test backendu można zoabaczyć pod http://localhost:8080/

3. **Dodawanie komentarza**  
   Po wejściu na stronę frontendu użytkownik może dodać komentarz do książki. Komentarz trafia do backendu, a następnie jako CloudEvent do brokera Knative. Broker przekazuje zdarzenie do usługi `file-sink` która zapisuje wiadomość do pliku lokalnego. W przypadku błędów (symulowanych w `file-sink`) zdarzenie trafia do `dead-letter-logger` gdzie również jest zapisywane do pliku.

4. **Weryfikacja działania usług**  
   - Aby sprawdzić, jakie zdarzenia otrzymał `file-sink`, użyj polecenia:
     ```bash
     kubectl exec -it <file-sink-pod-name> -- cat /data/events.log
     ```
   - Aby sprawdzić, jakie zdarzenia otrzymał `dead-letter-logger`, użyj polecenia:
     ```bash
     kubectl exec -it <dead-letter-logger-pod-name> -- cat /data/events.log
     ```

# Użycie AI

## Prompt:
```
Rozwiń punkt 4. "Dodaj retry i dead-letter sink
Cel: pokazać jak Knative Eventing radzi sobie z błędami."
kod modyfikowanego projektu znajduje się https://github.com/knative/docs/tree/main/code-samples/eventing/bookstore-sample-app/solution
Dodatkowy opis modifikowanej aplikacji: Welcome to the solution directory of the Knative Bookstore tutorial. This directory contains the fully implemented version of the event-driven bookstore application using Knative. 

You can find the tutorial for this solution here.

Directory Structure
Here's an overview of the components in the solution:

bad-word-filter/: Knative Function for filtering out inappropriate content
db-service/: Database service for storing book reviews and comments
frontend/: User interface for the bookstore application built with Next.js
node-server/: Node.js server for handling backend operations
sentiment-analysis-app/: Knative Function for analyzing the sentiment of book reviews
sequence/: Knative Sequence setup for orchestrating workflows
slack-sink/: Integration with Slack for notifications with Apache Camel
Additional Files
setup.sh: Script for setting up the required services including installing Knative, frontend, and backend node-server
solution.sh: Script for installing everything, deploying the entire solution. It includes the setup script as well.
```
Odpowiedź:
Aby zilustrować obsługę błędów w Knative Eventing oraz wykorzystanie mechanizmu Dead Letter Sink (DLS) w aplikacji **bookstore-sample-app**, możesz wprowadzić następujące modyfikacje:

---

### 🔧 1. Symulacja błędów w usłudze Slack Sink

**Cel:** Wymusić błędy w dostarczaniu zdarzeń do usługi Slack Sink, aby przetestować mechanizm ponownych prób i przekierowania do DLS.

**Działania:**

* Zmodyfikuj kod usługi `slack-sink`, aby losowo zwracała błędy HTTP 500.

  Przykład w języku Go:

```go
  func handler(w http.ResponseWriter, r *http.Request) {
      if rand.Float32() < 0.5 {
          http.Error(w, "Simulated failure", http.StatusInternalServerError)
          return
      }
      // Normalne przetwarzanie
  }
```



* Zbuduj i zaktualizuj obraz kontenera `slack-sink` w klastrze Kubernetes.

---

### 📦 2. Konfiguracja Dead Letter Sink (DLS)

**Cel:** Skonfigurować miejsce docelowe dla zdarzeń, które nie zostały pomyślnie dostarczone po określonej liczbie prób.

**Działania:**

* Utwórz prostą usługę Knative, która będzie pełniła rolę DLS, np. `dead-letter-logger`.([docs.triggermesh.io][1])

  Przykład w języku Go:

```go
  func handler(w http.ResponseWriter, r *http.Request) {
      body, _ := ioutil.ReadAll(r.Body)
      log.Printf("Received dead letter: %s", string(body))
      w.WriteHeader(http.StatusOK)
  }
```



* Zdefiniuj usługę Knative:

```yaml
  apiVersion: serving.knative.dev/v1
  kind: Service
  metadata:
    name: dead-letter-logger
  spec:
    template:
      spec:
        containers:
          - image: <ścieżka_do_obrazu_dead_letter_logger>
```



* Zaktualizuj konfigurację `Broker` lub `Trigger`, aby uwzględnić DLS:([docs.triggermesh.io][2])

```yaml
  apiVersion: eventing.knative.dev/v1
  kind: Broker
  metadata:
    name: bookstore-broker
  spec:
    delivery:
      deadLetterSink:
        ref:
          apiVersion: serving.knative.dev/v1
          kind: Service
          name: dead-letter-logger
      retry: 3
      backoffPolicy: exponential
      backoffDelay: PT1S
```



W powyższej konfiguracji:

* `retry: 3` oznacza, że Knative podejmie 3 próby ponownego dostarczenia zdarzenia.

* `backoffPolicy: exponential` oraz `backoffDelay: PT1S` definiują strategię opóźnień między próbami.([Knative][3], [julianfriedman.org][4])

---

### 🔍 3. Obserwacja i weryfikacja

**Cel:** Monitorować działanie mechanizmu DLS oraz ponownych prób dostarczania zdarzeń.

**Działania:**

* Wysyłaj komentarze zawierające "bad words", aby wywołać zdarzenia kierowane do `slack-sink`.

* Obserwuj logi usługi `dead-letter-logger`, aby potwierdzić odbiór zdarzeń po nieudanych próbach dostarczenia.

* Monitoruj metryki i ślady (traces) za pomocą narzędzi takich jak OpenTelemetry, Jaeger lub Prometheus, aby analizować opóźnienia, liczbę prób i inne parametry związane z dostarczaniem zdarzeń.

---

Dzięki tym modyfikacjom możesz skutecznie zilustrować mechanizmy obsługi błędów w Knative Eventing oraz wykorzystanie Dead Letter Sink w praktyce.

[1]: https://docs.triggermesh.io/1.24/guides/creatingadls/?utm_source=chatgpt.com "Creating a Bridge With a Dead Letter Sink (DLS) - TriggerMesh"
[2]: https://docs.triggermesh.io/1.27/guides/patterns/creatingadls/?utm_source=chatgpt.com "Creating a Bridge With a Dead Letter Sink (DLS) - TriggerMesh"
[3]: https://master--knative.netlify.app/v0.19-docs/eventing/event-delivery/?utm_source=chatgpt.com "Event delivery - Knative"
[4]: https://julianfriedman.org/docs/dev/eventing/event-delivery/?utm_source=chatgpt.com "Event delivery - Knative - Julian Friedman dot Org"

-------
## Prompt:
```
Zaporponowałeś: "Zaktualizuj konfigurację Broker lub Trigger, aby uwzględnić DLS:" Co jest lepiej zaktualizować - konfigurację Broker czy Trigger? Czy jest jakaś różnica?
```
Świetne pytanie — i tak, **jest różnica** między ustawieniem Dead Letter Sink (DLS) na **Brokerze** a na **Triggerze**, i wybór zależy od tego, **co dokładnie chcesz osiągnąć**.

---

### 🔹 **DLS na poziomie Triggera (`spec.delivery.deadLetterSink`)**

* **Zalecane w większości przypadków**.
* Działa tylko dla konkretnego Triggera — czyli tylko wtedy, gdy to konkretny subskrybent nie może poprawnie przetworzyć zdarzenia.
* Pozwala mieć **różne DLS-y dla różnych Triggerów**, co jest bardzo przydatne np. gdy masz różne typy błędów w różnych częściach systemu.
* Daje większą kontrolę i obserwowalność nad tym, *kto konkretnie zawiódł*.

✅ **Kiedy używać:**
Gdy chcesz śledzić błędy konkretnego odbiorcy (np. Slacka), lub masz wiele triggerów i chcesz każdemu przypisać osobną logikę obsługi błędów.

---

### 🔸 **DLS na poziomie Brokera (`spec.config.delivery.deadLetterSink`)**

* Działa **globalnie** dla wszystkich Triggerów korzystających z tego Brokera.
* Używana jako „domyślna” strategia błędów, jeśli konkretne Triggery jej nie nadpisują.
* Może pomóc, gdy chcesz mieć **jedno centralne miejsce logowania błędów** (np. wspólny temat w Kafka, CloudEvent logger, itp.).

⚠️ **Ograniczenie:**
Nie wiesz dokładnie, który Trigger/subskrybent zawiódł, jeśli nie przechowujesz tej informacji w treści zdarzenia.

✅ **Kiedy używać:**
Gdy chcesz mieć domyślne zabezpieczenie „na wszelki wypadek” albo gdy masz proste środowisko z jednym głównym celem logowania błędów.

---

### 📌 **Podsumowanie: co lepiej zaktualizować?**

W Twoim projekcie (gdzie testujesz *losowe błędy tylko w jednej konkretnej usłudze* – Slack sink), **lepiej ustawić DLS na poziomie Triggera**. Umożliwia to precyzyjne testowanie retry i DLS tylko dla tego jednego przypadku, bez wpływu na resztę systemu.


Chcesz przykład konfiguracji DLS w Triggerze na podstawie Twojego projektu?

------

## prompt: nie został zapisany, coś podobnego do "Napisz testowy serwis Knative który będzie odbierał wiadomości od node-server". Odpoweidź powstała iteracyjnie po paru promptach.

To create a simple Knative service and enable communication between your node server and this
test service, follow these steps:
1. Create a simple Knative Service (YAML example)
Create a file, e.g., test-service.yaml:
```
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
name: test-service
spec:
template:
spec:
containers:
- image: docker.io/library/nginx:alpine # or your own test image
ports:
- containerPort: 80
```
Apply it with:
kubectl apply -f test-service.yaml
2. Add communication from node server to test service
You need to create a Knative Trigger that sends events from the broker (used by your node server)
to the test-service. Example trigger (test-trigger.yaml):
```
apiVersion: eventing.knative.dev/v1
kind: Trigger
metadata:
name: test-service-trigger
spec:
broker: bookstore-broker
filter:
attributes:
type: test-event # or whatever event type you want to route
subscriber:
ref:
apiVersion: serving.knative.dev/v1
kind: Service
name: test-service
```
Apply it with:
kubectl apply -f test-trigger.yaml
3. Send an event from node server
In your node server code, send a CloudEvent with type: test-event to the broker endpoint. The
broker will route it to test-service via the trigger above.
Summary:
Deploy a Knative service (test-service).
Create a Trigger to route events from the broker to test-service.
Send events from your node server to the broker with the correct type.
Let me know if you want a sample Node.js code snippet for sending the event!
To send a message from the node server to the Knative Sequence, you can add an endpoint that
sends a CloudEvent of type new-review-comment to the broker (which will then be routed to the
Sequence).
Here is a sample Express route you can add to your index.js:
```
// ...existing code...
const fetch = require('node-fetch'); // Add at the top if not already present
app.post('/send-to-sequence', async (req, res) => {
 try {
 const brokerURI = process.env.K_SINK || 'http://bookstore-broker.knativeeventing.svc.cluster.local'; // Use env or default
 const reviewText = req.body.reviewText || "Test review from node-server";
 const event = {
 specversion: "1.0",
 type: "new-review-comment",
 source: "node-server",
 id: Date.now().toString(),
 datacontenttype: "application/json",
 data: {
 reviewText: reviewText
 }
 };
 const response = await fetch(brokerURI, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/cloudevents+json',
 },
 body: JSON.stringify(event),
 });
 if (!response.ok) {
 return res.status(500).json({error: 'Failed to send event to sequence'});
 }
 res.status(200).json({success: true, message: 'Event sent to sequence'});
 } catch (error) {
 res.status(500).json({error: 'Internal server error'});
 }
});
// ...existing code…
```
This will allow you to POST to /send-to-sequence with a JSON body like { "reviewText": "Hello
Sequence!" } and have the event routed through your Knative Sequence.
To create a service that receives these messages (CloudEvents from the Sequence) and saves them
to a file, you can use a simple Knative Service with a minimal HTTP server. Here’s how you can do
it:
1. Create a Dockerized Node.js Service
index.js:
```
const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 8080;
app.use(express.json());
app.post('/', (req, res) => {
 // Save the received event to a file (append mode)
 fs.appendFileSync('/data/events.log', JSON.stringify(req.body) + '\n');
 res.status(200).send('Event saved');
});
app.listen(PORT, () => {
 console.log(`File sink service listening on port ${PORT}`);
});
```
dokckerfile:
```
FROM node:18-alpine
WORKDIR /app
COPY index.js .
RUN npm install express
VOLUME ["/data"]
CMD ["node", "index.js"]
```
2. Build and Push the Image
```
docker build -t <your-dockerhub-username>/file-sink:latest .
docker push <your-dockerhub-username>/file-sink:latest
```
3. Deploy as a Knative Service
file-sink.yaml:
```
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
 name: file-sink
spec:
 template:
 spec:
 containers:
 - image: <your-dockerhub-username>/file-sink:latest
 volumeMounts:
 - name: data
 mountPath: /data
 volumes:
 - name: data
 emptyDir: {}
```
Apply with:
kubectl apply -f file-sink.yaml
4. Route Events to the Service
Create a Trigger or set the Sequence’s reply to point to this service, e.g.:
reply:
 ref:
 apiVersion: serving.knative.dev/v1
 kind: Service
 name: file-sink
Or use a Trigger to route from the broker to file-sink.
Summary:
The service receives HTTP POSTs (CloudEvents), appends them to /data/events.log.
Deploy as a Knative Service.
Route events to it from your Sequence or Broker.
Let me know if you want a ready-to-use YAML or more details!

-----
## Użycie AI do radzenia sobie z błędami

W tym projekcie narzędzia AI były często wykorzystywane w ten sposób. Spisanie wszystkich takich promptów ma ograniczony sens więc postanowiliśmy przedstawić tylko jeden, przykładowy prompt:

### Prompt:
```
I've rebuilt my image:
eval $(minikube docker-env)
docker build -t file-sink:latest .
docker tag file-sink:latest dev.local/file-sink:latest


and I wanted to reapply the configuration so a new image gets pulled:
kn service apply file-sink --image=dev.local/file-sink --pull-policy=Never
but I got:

No changes to apply to service 'file-sink'
```

Odpowiedź:


The message:

```
No changes to apply to service 'file-sink'
```

means that `kn service apply` detected no difference between the existing service and the new one you're trying to apply — so it skips any update.

This happens even if you've rebuilt the image, because Knative identifies the image by its reference (`dev.local/file-sink`) — **not by its content**. Since you're using `--pull-policy=Never`, it expects the image to be locally available and doesn't try to fetch a newer version.

### ✅ Solutions

#### 🔁 Option 1: Force an update by changing the image reference

Add a **dummy tag** (like a timestamp or version bump) to ensure `kn` detects a change:

```bash
NEW_TAG="dev.local/file-sink:$(date +%s)"
docker tag file-sink:latest $NEW_TAG
kn service apply file-sink --image=$NEW_TAG --pull-policy=Never
```

This tricks Knative into thinking it's a different image, even though it's actually the same one locally.

---

#### 🔄 Option 2: Delete and recreate the service (not always ideal)

If you don’t mind downtime or losing service state:

```bash
kn service delete file-sink
kn service create file-sink --image=dev.local/file-sink:latest --pull-policy=Never
```

---

#### 🔄 Option 3: Use `kn service update` instead

Sometimes `kn service update` forces a new revision even when `apply` doesn't:

```bash
kn service update file-sink --image=dev.local/file-sink:latest --pull-policy=Never
```

This can trigger a rollout without needing to change the tag.

---

Let me know if you want to automate this tagging or update it directly in your build script.


---------------------------------------
### Prompt:

\# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.

  ...

\# TYPE db_query_duration_seconds histogram

напиши мені декілка PomQL скриптів для графани щоб відображати ще 4 метрики окрім HTTP request count і heap memory usage

### Odpowiedź:

Ось кілька PromQL скриптів для Grafana, які допоможуть вам відобразити ще 4 метрики, крім кількості HTTP-запитів та використання пам'яті купи:

1. Завантаження CPU процесу (у відсотках)
Ця метрика показує, який відсоток CPU використовує ваш Node.js процес. Використовуємо rate для розрахунку швидкості зміни лічильника process_cpu_seconds_total за певний проміжок часу (наприклад, 5 хвилин) і множимо на 100, щоб отримати відсотки.

``` bash
rate(process_cpu_seconds_total[5m]) * 100
```

Опис: Відсоток CPU, який використовує відстежуваний процес.
Тип панелі Grafana: Graph
Примітка: Це показує завантаження CPU одним процесом. Якщо у вас є кілька інстансів програми, ви можете використовувати sum by (instance) або avg by (instance) для агрегації.
2. Загальна кількість активних ресурсів Node.js
Ця метрика показує загальну кількість активних ресурсів, які підтримують роботу циклу подій (event loop) Node.js. Це можуть бути відкриті файли, сокети тощо.

``` bash
nodejs_active_resources_total
```

Опис: Загальна кількість активних ресурсів Node.js.
Тип панелі Grafana: Single Stat або Graph (якщо ви хочете бачити тренд).
Примітка: Ви також можете розбити це за типом ресурсу, використовуючи nodejs_active_resources. Наприклад, для перегляду кількості активних сокетів: nodejs_active_resources{type="TCPSocketWrap"}
3. Медіана затримки циклу подій (Event Loop Lag P50)
Затримка циклу подій є критично важливою метрикою для Node.js, оскільки вона показує, наскільки швидко Node.js може обробляти події. P50 (50-й перцентиль, або медіана) дає гарне уявлення про типову затримку.

``` bash
nodejs_eventloop_lag_p50_seconds
```

Опис: 50-й перцентиль затримки циклу подій Node.js (у секундах).
Тип панелі Grafana: Graph або Single Stat.
Примітка: Чим менше значення, тим краще. Великі значення можуть свідчити про блокування циклу подій.
4. Використання зовнішньої пам'яті Node.js (у мегабайтах)
Ця метрика відображає обсяг пам'яті, виділеної Node.js поза купою V8. Це може бути пам'ять, що використовується буферами, нативними модулями тощо.

``` bash
nodejs_external_memory_bytes / (1024 * 1024)
```

Опис: Розмір зовнішньої пам'яті Node.js у мегабайтах.
Тип панелі Grafana: Graph або Single Stat.
Примітка: Важливо відстежувати цю метрику, оскільки вона може зростати незалежно від використання купи V8.
Ці PromQL скрипти дадуть вам додаткові інсайти у продуктивність вашої Node.js програми в Grafana. Не забудьте налаштувати відповідні типи панелей (наприклад, "Graph" для трендів або "Single Stat" для поточних значень) та одиниці виміру в Grafana для кращої візуалізації.


---------------------------------------

### Prompt:
(base) usr@usr:/mnt/c/Users/123gh/pythonProjects/suu-project$ kubectl logs file-sink-00001-deployment-6d98f85976-2b2nn

'Defaulted container "user-container" out of: user-container, queue-proxy

/app/file-sink-tracing.js:15

  resource: new Resource({

            ^



TypeError: Resource is not a constructor

    at Object.<anonymous> (/app/file-sink-tracing.js:15:13)

    at Module._compile (node:internal/modules/cjs/loader:1364:14)

...

EXPOSE 8080


CMD ["node", "-r", "./file-sink-tracing.js", "index.js"]

як то пофіксити

### Odpowiedź:

Привіт! Схоже, ви зіткнулися з поширеною проблемою під час налаштування OpenTelemetry в Node.js.

Помилка TypeError: Resource is not a constructor майже завжди вказує на конфлікт або несумісність версій між різними пакетами @opentelemetry/*, які встановлені у вашому проєкті.

Ваш код у file-sink-tracing.js написаний правильно для сучасних версій OpenTelemetry. Проблема полягає не в самому коді, а в залежностях, які встановлюються у ваш Docker-образ. Найімовірніше, копіюється старий файл package-lock.json або встановлюються несумісні між собою версії пакетів.

Як це виправити
Найбільш надійний спосіб — це забезпечити, щоб усі пакети OpenTelemetry були свіжих та сумісних версій.

Крок 1: Оновіть версії у package.json

Відкрийте ваш файл package.json та встановіть для пакетів OpenTelemetry версії з одного сумісного випуску. Це критично важливо для їхньої стабільної роботи.

Ось приклад сумісних версій, які ви можете використати:

``` JSON
"dependencies": {
  "@opentelemetry/api": "^1.8.0",
  "@opentelemetry/auto-instrumentations-node": "^0.47.0",
  "@opentelemetry/exporter-trace-otlp-http": "^0.51.0",
  "@opentelemetry/resources": "^1.25.0",
  "@opentelemetry/sdk-node": "^0.51.0",
  "@opentelemetry/semantic-conventions": "^1.25.0",
  "express": "^4.19.2"
}
```

Крок 2: Виконайте чисту установку залежностей

Щоб гарантовано позбутися старих або конфліктних пакетів, видаліть папку node_modules і файл package-lock.json з вашого проєкту локально.

```Bash
rm -rf node_modules package-lock.json
```

Потім запустіть установку заново. Це створить новий, консистентний файл package-lock.json на основі версій, які ви вказали в package.json.

```Bash
npm install
```

Крок 3: Перезберіть ваш Docker-образ

Тепер, коли у вас є оновлені залежності та новий package-lock.json, перезберіть Docker-образ. Оскільки ваш Dockerfile копіює package*.json, він підхопить і новий лок-файл.

```Bash
docker build -t file-sink-service .
```

Після виконання цих кроків ваш Docker-образ буде містити узгоджені версії пакетів, і помилка TypeError має зникнути.

---------------------------------------


# Podsumowanie i wnioski

Podczas realizacji projektu napotkaliśmy istotne trudności związane z konfiguracją oryginalnej aplikacji demonstracyjnej Knative Bookstore. Głównym problemem był brak aktywnego rozwoju tej aplikacji, co skutkowało niekompatybilnością wersji, przestarzałymi zależnościami i nieaktualną dokumentacją. 

Ze smutkiem wspominamy każdą godzinę poświęconą na próbę otworzenia oryginalnej aplikacji, zanim zorientowaliśmy się że to nie jest optymalne podejście, ale liczymy że każda z tych godzin dosadniej uświadomiła nam jak ważne jest całościowe i krytyczne spojrzenie na projekt.

Kluczowe okazało się skupienie na rzeczywistej istocie projektu – telemetri, demonstracji mechanizmów event-driven, oraz dodatkowo obsługi błędów w Knative – zamiast wiernego odtwarzania każdego elementu oryginalnej architektury. W przypadku problemów konfiguracyjnych uprościliśmy rozwiązanie, zastępując problematyczne serwisy własnymi, prostszymi komponentami. Takie podejście pozwoliło nam nie tylko ukończyć projekt, ale także lepiej zrozumieć kluczowe mechanizmy Knative i praktyczne aspekty wdrażania rozwiązań serverless oraz event-driven w Kubernetes. 

Udało się skutecznie wdrożyć system observability z wykorzystaniem OpenTelemetry, Prometheusa i Grafany. Było to kształcące doświadczenie, które pozwoliło nam w praktyce poznać, jak działają narzędzia do monitorowania i śledzenia przepływu zdarzeń w architekturze event-driven. Dzięki temu mogliśmy lepiej zrozumieć zarówno techniczne aspekty wdrożenia, jak i korzyści płynące z monitorowania rozproszonych systemów.

# **Podział zadań**

* modyfikacja aplikacji: symulacja błędów w usłudze Slack Sink i obsługa błędów (2 os.)  
* itegracja aplikacji z OTel  
* integracja z Grafaną
