import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <a className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Contact Review Grow</span>
              </a>
            </Link>
            <Link href="/">
              <Button variant="ghost" data-testid="button-back">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Powrót
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto prose prose-gray">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">POLITYKA PRYWATNOŚCI</h1>
          <p className="text-gray-500 mb-8">Ostatnia aktualizacja: 13 stycznia 2026</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. ADMINISTRATOR DANYCH OSOBOWYCH</h2>
            <p className="text-gray-600 mb-4">
              Niniejsza Polityka Prywatności określa zasady przetwarzania i ochrony danych osobowych w związku z korzystaniem z usług Contact Review Grow.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-gray-700"><strong>Administrator danych:</strong> Bartosz Straszewski, prowadzący działalność gospodarczą pod firmą Contact Review Grow</p>
              <p className="text-gray-700"><strong>Adres siedziby:</strong> ul. Wodzisławska 58a, 44-352 Czyżowice, Polska</p>
              <p className="text-gray-700"><strong>NIP:</strong> 6472614652</p>
              <p className="text-gray-700"><strong>REGON:</strong> 542507328</p>
              <p className="text-gray-700"><strong>Adres e-mail:</strong> contactreviewgrow@gmail.com</p>
              <p className="text-gray-700"><strong>Numer telefonu:</strong> +48 884 305 622</p>
            </div>
            <p className="text-gray-600">
              Administrator przetwarza dane osobowe zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. w sprawie ochrony osób fizycznych w związku z przetwarzaniem danych osobowych (RODO) oraz innymi obowiązującymi przepisami prawa polskiego i unijnego.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. DEFINICJE</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li><strong>Dane osobowe:</strong> wszelkie informacje dotyczące zidentyfikowanej lub możliwej do zidentyfikowania osoby fizycznej.</li>
              <li><strong>Przetwarzanie:</strong> operacja lub zestaw operacji wykonywanych na danych osobowych, takich jak zbieranie, utrwalanie, przechowywanie, modyfikowanie, udostępnianie lub usuwanie.</li>
              <li><strong>Administrator:</strong> Bartosz Straszewski / Contact Review Grow - podmiot decydujący o celach i sposobach przetwarzania danych osobowych.</li>
              <li><strong>Podmiot przetwarzający (Procesor):</strong> podmiot przetwarzający dane osobowe w imieniu Administratora.</li>
              <li><strong>Osoba, której dane dotyczą:</strong> osoba fizyczna, której dane osobowe są przetwarzane przez Administratora.</li>
              <li><strong>Użytkownik/Klient:</strong> osoba fizyczna lub prawna korzystająca z Usług Contact Review Grow.</li>
              <li><strong>Użytkownik Końcowy:</strong> osoba fizyczna będąca klientem Klienta, której dane kontaktowe są przetwarzane w celu wysłania zaproszeń do wystawienia opinii.</li>
              <li><strong>Usługi:</strong> usługi świadczone przez Contact Review Grow, w tym automatyczne wysyłanie zaproszeń do wystawiania opinii, monitorowanie reputacji online i powiązane funkcjonalności.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. JAKIE DANE OSOBOWE ZBIERAMY</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mb-3">3.1. Dane podawane bezpośrednio przez Użytkowników</h3>
            <p className="text-gray-600 mb-2">Zbieramy dane osobowe, które Użytkownicy dobrowolnie nam przekazują podczas rejestracji konta, korzystania z Usług lub kontaktu z nami. Mogą to być:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-600 mb-4">
              <li>imię i nazwisko</li>
              <li>adres e-mail</li>
              <li>numer telefonu</li>
              <li>adres korespondencyjny</li>
              <li>dane do faktury (NIP, adres firmy)</li>
              <li>dane do płatności (przetwarzane przez zewnętrznych operatorów płatności)</li>
              <li>dane logowania do konta</li>
              <li>preferencje komunikacyjne</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">3.2. Dane Użytkowników Końcowych</h3>
            <p className="text-gray-600 mb-2">W ramach świadczenia Usług przetwarzamy również dane Użytkowników Końcowych przekazane nam przez Klientów, takie jak:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-600 mb-4">
              <li>imię i nazwisko</li>
              <li>numer telefonu</li>
              <li>adres e-mail</li>
            </ul>
            <p className="text-gray-600 mb-4">W odniesieniu do tych danych Administrator działa jako Podmiot przetwarzający na zlecenie Klienta (który jest Administratorem tych danych).</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">3.3. Dane zbierane automatycznie</h3>
            <p className="text-gray-600 mb-2">Podczas korzystania z naszej strony internetowej i Usług automatycznie zbieramy pewne informacje techniczne:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-600 mb-4">
              <li>adres IP</li>
              <li>typ i wersja przeglądarki internetowej</li>
              <li>system operacyjny</li>
              <li>data i czas dostępu</li>
              <li>strony odwiedzane w ramach serwisu</li>
              <li>źródło ruchu (strona odsyłająca)</li>
              <li>przybliżona lokalizacja geograficzna (na podstawie adresu IP)</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">3.4. Dane wrażliwe</h3>
            <p className="text-gray-600">Co do zasady nie zbieramy danych wrażliwych (szczególnych kategorii danych osobowych w rozumieniu art. 9 RODO), takich jak dane dotyczące zdrowia, przekonań religijnych, orientacji seksualnej itp.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. CELE I PODSTAWY PRAWNE PRZETWARZANIA</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mb-3">4.1. Wykonanie umowy (art. 6 ust. 1 lit. b RODO)</h3>
            <ul className="list-disc pl-6 space-y-1 text-gray-600 mb-4">
              <li>utworzenie i obsługa konta użytkownika</li>
              <li>świadczenie Usług zgodnie z umową</li>
              <li>wysyłanie zaproszeń do wystawiania opinii w imieniu Klientów</li>
              <li>obsługa płatności</li>
              <li>obsługa zapytań i reklamacji</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">4.2. Zgoda (art. 6 ust. 1 lit. a RODO)</h3>
            <ul className="list-disc pl-6 space-y-1 text-gray-600 mb-4">
              <li>wysyłanie newslettera i informacji marketingowych</li>
              <li>wykorzystanie plików cookies do celów analitycznych i reklamowych</li>
              <li>przetwarzanie danych w celach określonych w treści zgody</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">4.3. Prawnie uzasadniony interes Administratora (art. 6 ust. 1 lit. f RODO)</h3>
            <ul className="list-disc pl-6 space-y-1 text-gray-600 mb-4">
              <li>zapewnienie bezpieczeństwa Usług i zapobieganie oszustwom</li>
              <li>analiza sposobu korzystania z Usług w celu ich ulepszania</li>
              <li>marketing bezpośredni własnych produktów i usług</li>
              <li>dochodzenie lub obrona przed roszczeniami</li>
              <li>prowadzenie statystyk i analiz biznesowych</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">4.4. Obowiązek prawny (art. 6 ust. 1 lit. c RODO)</h3>
            <ul className="list-disc pl-6 space-y-1 text-gray-600">
              <li>wypełnianie obowiązków podatkowych i księgowych</li>
              <li>odpowiadanie na żądania organów publicznych</li>
              <li>przechowywanie dokumentacji wymaganej przepisami prawa</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. ODBIORCY DANYCH OSOBOWYCH</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mb-3">5.1. Podmioty przetwarzające (podwykonawcy)</h3>
            <ul className="list-disc pl-6 space-y-1 text-gray-600 mb-4">
              <li>dostawcy usług hostingowych i serwerowych</li>
              <li>dostawcy usług chmurowych</li>
              <li>operatorzy płatności elektronicznych (np. Stripe, PayPal)</li>
              <li>dostawcy usług SMS i e-mail</li>
              <li>dostawcy narzędzi analitycznych</li>
              <li>dostawcy usług wsparcia technicznego</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">5.2. Inni odbiorcy</h3>
            <ul className="list-disc pl-6 space-y-1 text-gray-600">
              <li>organy publiczne (jeśli wymagają tego przepisy prawa)</li>
              <li>doradcy prawni i podatkowi</li>
              <li>podmioty przejmujące działalność w przypadku fuzji lub przejęcia</li>
            </ul>
            <p className="text-gray-600 mt-4">Ze wszystkimi podmiotami przetwarzającymi dane w naszym imieniu zawarliśmy umowy powierzenia przetwarzania danych zgodnie z art. 28 RODO.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. PRZEKAZYWANIE DANYCH POZA EOG</h2>
            <p className="text-gray-600 mb-4">Co do zasady przetwarzamy dane osobowe na terenie Europejskiego Obszaru Gospodarczego (EOG).</p>
            <p className="text-gray-600 mb-4">W niektórych przypadkach dane mogą być przekazywane do państw trzecich (poza EOG), w szczególności do USA, w związku z korzystaniem z usług dostawców takich jak Google, Stripe czy platformy chmurowe. W takich przypadkach stosujemy odpowiednie zabezpieczenia zgodnie z RODO:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-600">
              <li>standardowe klauzule umowne przyjęte przez Komisję Europejską (art. 46 ust. 2 lit. c RODO)</li>
              <li>decyzje Komisji Europejskiej stwierdzające odpowiedni poziom ochrony (art. 45 RODO)</li>
              <li>w przypadku USA - EU-U.S. Data Privacy Framework (jeśli dostawca jest certyfikowany)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. OKRES PRZECHOWYWANIA DANYCH</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li><strong>Dane związane z kontem użytkownika:</strong> przez czas trwania umowy i korzystania z Usług, a następnie przez okres przedawnienia roszczeń (3 lata od zakończenia umowy).</li>
              <li><strong>Dane do celów podatkowych i księgowych:</strong> przez okres wymagany przepisami prawa (5 lat od końca roku podatkowego).</li>
              <li><strong>Dane marketingowe (zgoda):</strong> do momentu wycofania zgody lub zgłoszenia sprzeciwu.</li>
              <li><strong>Dane Użytkowników Końcowych:</strong> zgodnie z instrukcjami Klienta lub do momentu zakończenia umowy z Klientem.</li>
              <li><strong>Dane z plików cookies:</strong> zgodnie z okresem ważności poszczególnych plików cookies (od sesji do 2 lat).</li>
            </ul>
            <p className="text-gray-600 mt-4">Po upływie okresu przechowywania dane są usuwane lub anonimizowane.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. PRAWA OSÓB, KTÓRYCH DANE DOTYCZĄ</h2>
            <p className="text-gray-600 mb-4">Zgodnie z RODO przysługują Państwu następujące prawa:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li><strong>Prawo dostępu do danych (art. 15 RODO):</strong> Mają Państwo prawo uzyskać potwierdzenie, czy przetwarzamy Państwa dane osobowe, a jeśli tak - uzyskać dostęp do tych danych oraz informacje o przetwarzaniu.</li>
              <li><strong>Prawo do sprostowania (art. 16 RODO):</strong> Mają Państwo prawo żądać niezwłocznego sprostowania nieprawidłowych danych lub uzupełnienia niekompletnych danych.</li>
              <li><strong>Prawo do usunięcia danych (art. 17 RODO):</strong> Mają Państwo prawo żądać usunięcia danych (prawo do bycia zapomnianym) w określonych przypadkach.</li>
              <li><strong>Prawo do ograniczenia przetwarzania (art. 18 RODO):</strong> Mają Państwo prawo żądać ograniczenia przetwarzania danych w określonych sytuacjach.</li>
              <li><strong>Prawo do przenoszenia danych (art. 20 RODO):</strong> Mają Państwo prawo otrzymać swoje dane w ustrukturyzowanym, powszechnie używanym formacie nadającym się do odczytu maszynowego.</li>
              <li><strong>Prawo do sprzeciwu (art. 21 RODO):</strong> Mają Państwo prawo w dowolnym momencie wnieść sprzeciw wobec przetwarzania danych na podstawie prawnie uzasadnionego interesu.</li>
              <li><strong>Prawo do cofnięcia zgody:</strong> Jeśli przetwarzanie odbywa się na podstawie zgody, mają Państwo prawo cofnąć zgodę w dowolnym momencie.</li>
              <li><strong>Prawo do zgłoszenia skargi:</strong> Mają Państwo prawo wnieść skargę do organu nadzorczego - Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa, www.uodo.gov.pl).</li>
            </ul>
            <p className="text-gray-600 mt-4">Aby skorzystać z powyższych praw, prosimy o kontakt na adres: contactreviewgrow@gmail.com</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. BEZPIECZEŃSTWO DANYCH</h2>
            <p className="text-gray-600 mb-4">Wdrożyliśmy odpowiednie środki techniczne i organizacyjne mające na celu ochronę danych osobowych przed nieuprawnionym dostępem, utratą, zniszczeniem lub ujawnieniem. Środki te obejmują m.in.:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-600">
              <li>szyfrowanie połączeń (SSL/TLS)</li>
              <li>szyfrowanie danych przechowywanych</li>
              <li>kontrolę dostępu i uwierzytelnianie</li>
              <li>regularne kopie zapasowe</li>
              <li>monitorowanie bezpieczeństwa systemów</li>
              <li>szkolenia pracowników z zakresu ochrony danych</li>
              <li>procedury reagowania na incydenty bezpieczeństwa</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. DANE KONTAKTOWE</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Contact Review Grow</strong></p>
              <p className="text-gray-700">Bartosz Straszewski</p>
              <p className="text-gray-700">ul. Wodzisławska 58a</p>
              <p className="text-gray-700">44-352 Czyżowice, Polska</p>
              <p className="text-gray-700">NIP: 6472614652</p>
              <p className="text-gray-700">REGON: 542507328</p>
              <p className="text-gray-700">E-mail: contactreviewgrow@gmail.com</p>
              <p className="text-gray-700">Telefon: +48 884 305 622</p>
            </div>
          </section>

          <p className="text-gray-500 text-sm text-center mt-12">© Contact Review Grow. Wszelkie prawa zastrzeżone.</p>
        </div>
      </main>
    </div>
  );
}
