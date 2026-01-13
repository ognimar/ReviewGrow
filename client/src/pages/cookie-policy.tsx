import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star } from "lucide-react";

export default function CookiePolicy() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">POLITYKA PLIKÓW COOKIE</h1>
          <p className="text-gray-500 mb-8">Ostatnia aktualizacja: 13 stycznia 2026</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. INFORMACJE OGÓLNE</h2>
            <p className="text-gray-600 mb-4">
              Niniejsza Polityka plików cookie wyjaśnia, w jaki sposób Review Grow wykorzystuje pliki cookie i podobne technologie podczas odwiedzania naszej strony internetowej oraz korzystania z naszych usług.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-gray-700"><strong>Administrator:</strong> Bartosz Straszewski, prowadzący działalność gospodarczą pod firmą Review Grow</p>
              <p className="text-gray-700"><strong>Adres siedziby:</strong> ul. Wodzisławska 58a, 44-352 Czyżowice, Polska</p>
              <p className="text-gray-700"><strong>NIP:</strong> 6472614652</p>
              <p className="text-gray-700"><strong>REGON:</strong> 542507328</p>
              <p className="text-gray-700"><strong>Adres e-mail:</strong> contactreviewgrow@gmail.com</p>
              <p className="text-gray-700"><strong>Numer telefonu:</strong> +48 884 305 622</p>
            </div>
            <p className="text-gray-600">Korzystanie z plików cookie odbywa się zgodnie z Rozporządzeniem RODO oraz ustawą z dnia 16 lipca 2004 r. Prawo telekomunikacyjne (Dz.U. 2004 Nr 171 poz. 1800 z późn. zm.).</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. CZYM SĄ PLIKI COOKIE</h2>
            <p className="text-gray-600 mb-4">
              Pliki cookie (ciasteczka) to małe pliki tekstowe, które są zapisywane na urządzeniu użytkownika (komputerze, smartfonie, tablecie) podczas odwiedzania stron internetowych. Pliki cookie są powszechnie stosowane w celu zapewnienia prawidłowego działania stron, poprawy ich wydajności oraz dostarczania informacji właścicielom stron.
            </p>
            
            <h3 className="text-lg font-medium text-gray-800 mb-3">2.1. Własne pliki cookie</h3>
            <p className="text-gray-600 mb-4">Pliki cookie ustawiane przez właściciela strony (Review Grow) nazywane są własnymi plikami cookie (first-party cookies). Służą one głównie do zapewnienia prawidłowego funkcjonowania strony i zapamiętywania preferencji użytkownika.</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">2.2. Pliki cookie podmiotów trzecich</h3>
            <p className="text-gray-600">Pliki cookie ustawiane przez podmioty inne niż właściciel strony nazywane są plikami cookie podmiotów trzecich (third-party cookies). Umożliwiają one dostarczanie dodatkowych funkcji, takich jak analityka, reklamy czy integracje z mediami społecznościowymi.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. PODSTAWA PRAWNA STOSOWANIA PLIKÓW COOKIE</h2>
            <p className="text-gray-600 mb-4">Zgodnie z prawem europejskim i polskim, stosowanie plików cookie wymaga odpowiedniej podstawy prawnej:</p>
            
            <h3 className="text-lg font-medium text-gray-800 mb-3">3.1. Pliki cookie niezbędne (techniczne)</h3>
            <p className="text-gray-600 mb-4">Podstawa prawna: Prawnie uzasadniony interes administratora (art. 6 ust. 1 lit. f RODO) oraz niezbędność do świadczenia usługi (art. 173 ust. 3 Prawa telekomunikacyjnego). Te pliki cookie nie wymagają zgody użytkownika.</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">3.2. Pozostałe pliki cookie</h3>
            <p className="text-gray-600">Podstawa prawna: Zgoda użytkownika (art. 6 ust. 1 lit. a RODO oraz art. 173 ust. 1 Prawa telekomunikacyjnego). Pliki analityczne, funkcjonalne i marketingowe wymagają uprzedniej zgody użytkownika wyrażonej poprzez baner cookie.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. CELE STOSOWANIA PLIKÓW COOKIE</h2>
            <p className="text-gray-600 mb-4">Wykorzystujemy pliki cookie w następujących celach:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>zapewnienie prawidłowego działania strony internetowej</li>
              <li>utrzymanie sesji zalogowanego użytkownika</li>
              <li>zapamiętywanie preferencji użytkownika (np. język, ustawienia)</li>
              <li>analiza sposobu korzystania ze strony w celu jej ulepszania</li>
              <li>prowadzenie statystyk odwiedzin</li>
              <li>dostosowywanie treści reklamowych (za zgodą)</li>
              <li>integracja z mediami społecznościowymi</li>
              <li>ochrona przed oszustwami i zapewnienie bezpieczeństwa</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. RODZAJE PLIKÓW COOKIE</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mb-3">5.1. Niezbędne pliki cookie (strictly necessary)</h3>
            <p className="text-gray-600 mb-4">Te pliki cookie są absolutnie niezbędne do prawidłowego funkcjonowania strony. Bez nich nie moglibyśmy świadczyć podstawowych usług. Nie wymagają zgody użytkownika i nie można ich wyłączyć.</p>
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Nazwa</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Cel</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Wygasa</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">csrf_token</td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">Ochrona przed atakami CSRF</td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">Sesja</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">session_id</td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">Utrzymanie sesji zalogowanego użytkownika</td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">24 godziny</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">cookie_consent</td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">Przechowywanie preferencji zgód na pliki cookie</td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">1 rok</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-3">5.2. Funkcjonalne pliki cookie</h3>
            <p className="text-gray-600 mb-4">Te pliki cookie umożliwiają zapamiętanie preferencji użytkownika i personalizację strony. Nie są niezbędne, ale znacznie poprawiają komfort korzystania ze strony. Wymagają zgody użytkownika.</p>
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Nazwa</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Cel</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Wygasa</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">language</td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">Zapamiętanie wybranego języka strony</td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">1 rok</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">timezone</td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">Zapamiętanie strefy czasowej użytkownika</td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">1 rok</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">theme</td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">Zapamiętanie preferencji wyglądu (tryb jasny/ciemny)</td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">Trwały</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-3">5.3. Analityczne pliki cookie</h3>
            <p className="text-gray-600 mb-4">Te pliki cookie pomagają nam zrozumieć, w jaki sposób użytkownicy korzystają z naszej strony. Zbierają informacje w sposób zanonimizowany i służą do ulepszania naszych usług. Wymagają zgody użytkownika.</p>
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Nazwa</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Dostawca</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Cel</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Wygasa</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">_ga</td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">Google Analytics</td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">Identyfikacja unikalnych użytkowników</td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">2 lata</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">_gid</td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">Google Analytics</td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">Rozróżnianie użytkowników</td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">24 godziny</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">_gat</td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">Google Analytics</td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">Ograniczanie częstotliwości zapytań</td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">1 minuta</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. ZARZĄDZANIE PLIKAMI COOKIE</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mb-3">6.1. Baner zgody na pliki cookie</h3>
            <p className="text-gray-600 mb-4">Przy pierwszej wizycie na naszej stronie wyświetlamy baner informujący o plikach cookie. Za jego pomocą możesz:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-600 mb-4">
              <li>zaakceptować wszystkie pliki cookie</li>
              <li>odrzucić wszystkie opcjonalne pliki cookie (pozostawiając tylko niezbędne)</li>
              <li>dostosować preferencje, wybierając poszczególne kategorie plików cookie</li>
            </ul>
            <p className="text-gray-600 mb-4">Swoje preferencje możesz zmienić w dowolnym momencie, klikając przycisk ustawień plików cookie w stopce strony.</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">6.2. Ustawienia przeglądarki</h3>
            <p className="text-gray-600 mb-4">Możesz również zarządzać plikami cookie za pomocą ustawień swojej przeglądarki internetowej. Poniżej znajdują się linki do instrukcji dla najpopularniejszych przeglądarek:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-600 mb-4">
              <li>Google Chrome: chrome://settings/cookies</li>
              <li>Mozilla Firefox: about:preferences#privacy</li>
              <li>Microsoft Edge: edge://settings/privacy</li>
              <li>Safari: Preferencje &gt; Prywatność</li>
              <li>Opera: opera://settings/cookies</li>
            </ul>
            <p className="text-gray-600"><strong>Uwaga:</strong> Wyłączenie lub usunięcie niektórych plików cookie może spowodować ograniczenie funkcjonalności strony lub uniemożliwić korzystanie z niektórych usług.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. INNE TECHNOLOGIE ŚLEDZĄCE</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mb-3">7.1. Piksele śledzące (web beacons)</h3>
            <p className="text-gray-600 mb-4">Piksele śledzące to małe obrazy (często niewidoczne) umieszczane na stronach lub w wiadomościach e-mail, które pozwalają nam monitorować, czy użytkownik odwiedził stronę lub otworzył wiadomość e-mail. Działają one w połączeniu z plikami cookie.</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">7.2. Local Storage i Session Storage</h3>
            <p className="text-gray-600 mb-4">Oprócz plików cookie możemy korzystać z innych mechanizmów przechowywania danych w przeglądarce, takich jak Local Storage i Session Storage. Działają one podobnie do plików cookie, ale pozwalają przechowywać większe ilości danych.</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">7.3. Fingerprinting</h3>
            <p className="text-gray-600">Nie stosujemy technik fingerprintingu (tworzenia unikalnego odcisku palca urządzenia) do identyfikacji użytkowników bez ich zgody.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. GOOGLE ANALYTICS</h2>
            <p className="text-gray-600 mb-4">Korzystamy z Google Analytics - usługi analizy internetowej świadczonej przez Google LLC. Google Analytics używa plików cookie do analizowania sposobu korzystania z naszej strony.</p>
            <p className="text-gray-600 mb-4">Informacje generowane przez pliki cookie na temat korzystania ze strony są przekazywane do serwerów Google w USA i tam przechowywane. Stosujemy anonimizację adresów IP, dzięki czemu adres IP użytkownika jest skracany przed przekazaniem.</p>
            <p className="text-gray-600">Możesz zrezygnować z Google Analytics instalując dodatek do przeglądarki: <a href="https://tools.google.com/dlpage/gaoptout" className="text-emerald-600 hover:underline">https://tools.google.com/dlpage/gaoptout</a></p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. PRAWA UŻYTKOWNIKA</h2>
            <p className="text-gray-600 mb-4">W związku z przetwarzaniem danych osobowych za pomocą plików cookie przysługują Ci następujące prawa zgodnie z RODO:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>prawo dostępu do danych</li>
              <li>prawo do sprostowania danych</li>
              <li>prawo do usunięcia danych</li>
              <li>prawo do ograniczenia przetwarzania</li>
              <li>prawo do przenoszenia danych</li>
              <li>prawo do sprzeciwu</li>
              <li>prawo do cofnięcia zgody w dowolnym momencie</li>
              <li>prawo do wniesienia skargi do Prezesa UODO</li>
            </ul>
            <p className="text-gray-600 mt-4">Aby skorzystać z tych praw, skontaktuj się z nami: contactreviewgrow@gmail.com</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. ZMIANY POLITYKI PLIKÓW COOKIE</h2>
            <p className="text-gray-600 mb-4">Możemy od czasu do czasu aktualizować niniejszą Politykę plików cookie, aby odzwierciedlić zmiany w wykorzystywanych przez nas plikach cookie lub z innych powodów prawnych, operacyjnych lub regulacyjnych.</p>
            <p className="text-gray-600">O istotnych zmianach poinformujemy użytkowników poprzez wyświetlenie stosownego komunikatu na stronie lub za pośrednictwem baneru cookie.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. DANE KONTAKTOWE</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Review Grow</strong></p>
              <p className="text-gray-700">Bartosz Straszewski</p>
              <p className="text-gray-700">ul. Wodzisławska 58a</p>
              <p className="text-gray-700">44-352 Czyżowice, Polska</p>
              <p className="text-gray-700">NIP: 6472614652</p>
              <p className="text-gray-700">REGON: 542507328</p>
              <p className="text-gray-700">E-mail: contactreviewgrow@gmail.com</p>
              <p className="text-gray-700">Telefon: +48 884 305 622</p>
            </div>
          </section>

          <p className="text-gray-500 text-sm text-center mt-12">© Review Grow. Wszelkie prawa zastrzeżone.</p>
        </div>
      </main>
    </div>
  );
}
