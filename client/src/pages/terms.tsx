import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star } from "lucide-react";

export default function Terms() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">REGULAMIN ŚWIADCZENIA USŁUG</h1>
          <p className="text-gray-500 mb-8">Ostatnia aktualizacja: 13 stycznia 2026</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">§ 1. POSTANOWIENIA OGÓLNE I DANE USŁUGODAWCY</h2>
            <p className="text-gray-600 mb-4">1.1. Niniejszy Regulamin określa zasady świadczenia usług drogą elektroniczną przez Usługodawcę na rzecz Klientów za pośrednictwem platformy Review Grow.</p>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-gray-700"><strong>Usługodawca:</strong> Bartosz Straszewski, prowadzący działalność gospodarczą pod firmą Review Grow</p>
              <p className="text-gray-700"><strong>Adres siedziby:</strong> ul. Wodzisławska 58a, 44-352 Czyżowice, Polska</p>
              <p className="text-gray-700"><strong>NIP:</strong> 6472614652</p>
              <p className="text-gray-700"><strong>REGON:</strong> 542507328</p>
              <p className="text-gray-700"><strong>Adres e-mail:</strong> contactreviewgrow@gmail.com</p>
              <p className="text-gray-700"><strong>Numer telefonu:</strong> +48 884 305 622</p>
            </div>

            <p className="text-gray-600 mb-4">1.3. Usługodawca świadczy usługi za pośrednictwem strony internetowej oraz powiązanych aplikacji i narzędzi (dalej łącznie: Platforma lub Usługi).</p>
            <p className="text-gray-600">1.4. Korzystanie z Usług oznacza akceptację niniejszego Regulaminu. Jeśli nie zgadzasz się z postanowieniami Regulaminu, prosimy o zaprzestanie korzystania z Usług.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">§ 2. DEFINICJE</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li><strong>Usługodawca / Review Grow:</strong> Bartosz Straszewski prowadzący działalność gospodarczą pod firmą Review Grow, świadczący usługi opisane w niniejszym Regulaminie.</li>
              <li><strong>Klient:</strong> osoba fizyczna prowadząca działalność gospodarczą, osoba prawna lub jednostka organizacyjna nieposiadająca osobowości prawnej, która zawarła umowę o świadczenie Usług z Usługodawcą.</li>
              <li><strong>Użytkownik Końcowy:</strong> osoba fizyczna będąca klientem, kontrahentem lub usługobiorcą Klienta, której dane kontaktowe zostały przekazane Usługodawcy w celu wysłania zaproszeń do wystawienia opinii w imieniu Klienta.</li>
              <li><strong>Usługi:</strong> usługi świadczone przez Usługodawcę na rzecz Klienta, obejmujące w szczególności automatyczne wysyłanie zaproszeń do wystawienia opinii (SMS, e-mail), integracje z platformami zewnętrznymi, monitorowanie opinii oraz inne funkcjonalności dostępne w ramach Platformy.</li>
              <li><strong>Profil Google Moja Firma (Google Business Profile):</strong> usługa Google umożliwiająca zarządzanie wizytówką firmy i opiniami w internecie.</li>
              <li><strong>RODO:</strong> Rozporządzenie Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. w sprawie ochrony osób fizycznych w związku z przetwarzaniem danych osobowych i w sprawie swobodnego przepływu takich danych (ogólne rozporządzenie o ochronie danych).</li>
              <li><strong>CRM:</strong> system do zarządzania relacjami z klientami, który może być zintegrowany z Platformą.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">§ 3. ZAKRES USŁUG</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mb-3">3.1. Automatyczne zaproszenia do wystawiania opinii</h3>
            <p className="text-gray-600 mb-4">Usługodawca, działając w imieniu Klienta, wysyła profesjonalnie przygotowane wiadomości SMS i/lub e-mail do Użytkowników Końcowych, zachęcając ich do podzielenia się opinią na temat produktów lub usług Klienta na platformach takich jak Google, media społecznościowe i inne serwisy z opiniami.</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">3.2. Monitorowanie opinii i reputacji</h3>
            <p className="text-gray-600 mb-4">Usługodawca umożliwia śledzenie opinii i wzmianek o marce Klienta na różnych platformach, udostępniając panele kontrolne i powiadomienia w czasie rzeczywistym, co pozwala na szybkie reagowanie na potencjalne problemy.</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">3.3. Profesjonalne odpowiedzi na opinie</h3>
            <p className="text-gray-600 mb-4">W ramach niektórych pakietów Usługodawca może odpowiadać na opinie w imieniu Klienta - dziękując za pozytywne recenzje i adresując uwagi z negatywnych opinii.</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">3.4. Wykorzystanie opinii w marketingu</h3>
            <p className="text-gray-600 mb-4">Usługodawca może przekształcać najlepsze opinie Klienta w treści do mediów społecznościowych, materiały promocyjne i widgety na stronę internetową.</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">3.5. Integracje systemowe</h3>
            <p className="text-gray-600 mb-4">Platforma może być zintegrowana z systemem CRM Klienta, Profilem Google Moja Firma oraz kontami w mediach społecznościowych, umożliwiając automatyzację procesów i centralne zarządzanie opiniami.</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">3.6. Ograniczenia zakresu Usług</h3>
            <p className="text-gray-600">Usługi obejmują wyłącznie pozyskiwanie opinii i powiązane funkcjonalności opisane powyżej. Usługodawca nie gwarantuje, że opinie będą pozytywne ani że negatywne opinie zostaną usunięte z platform zewnętrznych.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">§ 4. WARUNKI KORZYSTANIA Z USŁUG</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mb-3">4.1. Wymagania techniczne</h3>
            <p className="text-gray-600 mb-4">Do korzystania z Usług niezbędne jest posiadanie urządzenia z dostępem do internetu, aktualnej przeglądarki internetowej oraz aktywnego adresu e-mail.</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">4.2. Rejestracja i konto</h3>
            <p className="text-gray-600 mb-4">Korzystanie z niektórych Usług może wymagać utworzenia konta. Klient zobowiązuje się do podania prawdziwych, aktualnych i kompletnych danych podczas rejestracji oraz do ich bieżącej aktualizacji. Klient jest odpowiedzialny za zachowanie poufności hasła i za wszystkie działania wykonywane przy użyciu swojego konta.</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">4.3. Wiek użytkowników</h3>
            <p className="text-gray-600 mb-4">Usługi są przeznaczone wyłącznie dla osób, które ukończyły 18 lat. Osoby niepełnoletnie nie mogą korzystać z Usług ani rejestrować konta.</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">4.4. Oświadczenia Klienta</h3>
            <p className="text-gray-600">Korzystając z Usług, Klient oświadcza i gwarantuje, że: (a) wszystkie podane dane rejestracyjne są prawdziwe, aktualne i kompletne; (b) posiada zdolność prawną do zawarcia umowy; (c) nie będzie korzystał z Usług w celach niezgodnych z prawem; (d) korzystanie z Usług nie naruszy obowiązujących przepisów prawa.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">§ 5. OBOWIĄZKI KLIENTA</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mb-3">5.1. Uzyskanie i utrzymanie zgód</h3>
            <p className="text-gray-600 mb-4">Klient musi posiadać wyraźną zgodę każdego Użytkownika Końcowego przed przekazaniem jego danych kontaktowych Usługodawcy w celu wysłania wiadomości SMS lub e-mail. Zgoda ta musi być uzyskana zgodnie z wymogami RODO oraz Prawa telekomunikacyjnego (w przypadku SMS).</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">5.2. Zgodność z przepisami o ochronie danych osobowych</h3>
            <p className="text-gray-600 mb-4">Klient jest odpowiedzialny za przestrzeganie wszystkich obowiązujących przepisów dotyczących ochrony danych osobowych, w tym RODO, w zakresie danych Użytkowników Końcowych przekazywanych Usługodawcy.</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">5.3. Poprawność i legalność danych</h3>
            <p className="text-gray-600 mb-4">Klient odpowiada za dokładność, jakość i legalność danych kontaktowych Użytkowników Końcowych przekazywanych Usługodawcy. Klient zobowiązuje się nie przekazywać danych osób, które nie wyraziły zgody na otrzymywanie komunikacji marketingowej.</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">5.4. Utrzymanie integracji</h3>
            <p className="text-gray-600 mb-4">Jeśli Klient zdecyduje się na integrację zewnętrznych kont lub systemów z Platformą (np. Profil Google Moja Firma, CRM), jest odpowiedzialny za utrzymanie ciągłości i ważności tych integracji, w tym za aktualizację danych dostępowych.</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">5.5. Zgodność z przepisami</h3>
            <p className="text-gray-600">Klient jest odpowiedzialny za zapewnienie, że korzystanie z Usług (w tym treść i częstotliwość wysyłanych wiadomości) jest zgodne ze wszystkimi obowiązującymi przepisami prawa.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">§ 6. TREŚĆ WIADOMOŚCI I AUTOMATYZACJA</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mb-3">6.1. Upoważnienie do wysyłania wiadomości</h3>
            <p className="text-gray-600 mb-4">Korzystając z Usług, Klient upoważnia Usługodawcę do wysyłania wiadomości SMS, e-mail i innych komunikatów elektronicznych do Użytkowników Końcowych w imieniu Klienta.</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">6.2. Domyślne szablony i harmonogram</h3>
            <p className="text-gray-600 mb-4">Usługodawca udostępnia domyślne, profesjonalnie przygotowane szablony wiadomości oraz standardowy harmonogram wysyłki (np. przypomnienia po określonym czasie). Klient może dostosować treść wiadomości oraz harmonogram według własnych potrzeb za pośrednictwem Platformy.</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">6.3. Odpowiedzialność za treść</h3>
            <p className="text-gray-600 mb-4">Klient ponosi pełną odpowiedzialność za treść wszystkich wiadomości wysyłanych za pośrednictwem Usług, niezależnie od tego, czy korzysta z domyślnych szablonów, czy z własnych, spersonalizowanych treści.</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">6.4. Częstotliwość wiadomości</h3>
            <p className="text-gray-600 mb-4">Klient może skonfigurować częstotliwość wysyłania wiadomości. Klient jest odpowiedzialny za zapewnienie, że częstotliwość kontaktu nie narusza przepisów prawa ani nie jest odbierana przez Użytkowników Końcowych jako nachalna.</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">6.5. Obsługa rezygnacji</h3>
            <p className="text-gray-600">Platforma zapewnia mechanizmy obsługi rezygnacji z otrzymywania wiadomości (np. odpowiedź STOP na SMS, link rezygnacji w e-mailu). Klient jest jednak ostatecznie odpowiedzialny za przestrzeganie życzeń Użytkowników Końcowych w zakresie rezygnacji z komunikacji.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">§ 7. PRZETWARZANIE DANYCH OSOBOWYCH</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mb-3">7.1. Rola stron w przetwarzaniu danych</h3>
            <p className="text-gray-600 mb-4">W zakresie danych osobowych Użytkowników Końcowych Klient działa jako Administrator danych, a Usługodawca jako Podmiot przetwarzający w rozumieniu RODO. Usługodawca przetwarza dane osobowe wyłącznie w imieniu i na polecenie Klienta, w celu realizacji Usług.</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">7.2. Umowa powierzenia przetwarzania danych</h3>
            <p className="text-gray-600 mb-4">Niniejszy Regulamin, wraz z Polityką Prywatności, stanowi umowę powierzenia przetwarzania danych osobowych w rozumieniu art. 28 RODO. Akceptacja Regulaminu jest równoznaczna z zawarciem tej umowy.</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">7.3. Obowiązki Usługodawcy jako Podmiotu przetwarzającego</h3>
            <p className="text-gray-600 mb-2">Usługodawca zobowiązuje się do:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-600 mb-4">
              <li>przetwarzania danych osobowych wyłącznie zgodnie z udokumentowanymi poleceniami Klienta</li>
              <li>zapewnienia, że osoby upoważnione do przetwarzania danych są zobowiązane do zachowania poufności</li>
              <li>wdrożenia odpowiednich środków technicznych i organizacyjnych w celu zapewnienia bezpieczeństwa przetwarzania</li>
              <li>pomagania Klientowi w realizacji praw osób, których dane dotyczą</li>
              <li>usunięcia lub zwrotu danych po zakończeniu świadczenia Usług, według wyboru Klienta</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">7.4. Przechowywanie danych</h3>
            <p className="text-gray-600 mb-4">Usługodawca przechowuje dane Klienta i powiązane informacje przez okres niezbędny do świadczenia Usług, wypełnienia obowiązków prawnych lub realizacji uzasadnionych interesów biznesowych.</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">7.5. Podpowierzenie przetwarzania</h3>
            <p className="text-gray-600">Usługodawca może korzystać z usług dalszych podmiotów przetwarzających (podwykonawców) w celu realizacji Usług. Klient wyraża ogólną zgodę na korzystanie z podwykonawców, z zastrzeżeniem że Usługodawca poinformuje Klienta o zmianach w tym zakresie.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">§ 8. WŁASNOŚĆ INTELEKTUALNA</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mb-3">8.1. Prawa Usługodawcy</h3>
            <p className="text-gray-600 mb-4">Wszelkie prawa własności intelektualnej do Platformy, w tym kod źródłowy, bazy danych, oprogramowanie, projekty graficzne, teksty, zdjęcia, znaki towarowe i logotypy, należą do Usługodawcy lub jego licencjodawców i są chronione przepisami prawa autorskiego oraz prawa własności przemysłowej.</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">8.2. Licencja dla Klienta</h3>
            <p className="text-gray-600 mb-4">Usługodawca udziela Klientowi niewyłącznej, nieprzenoszalnej, odwołalnej licencji na korzystanie z Platformy wyłącznie w celu korzystania z Usług zgodnie z niniejszym Regulaminem.</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">8.3. Ograniczenia</h3>
            <p className="text-gray-600">Bez wyraźnej pisemnej zgody Usługodawcy zabronione jest kopiowanie, modyfikowanie, rozpowszechnianie, sprzedawanie, licencjonowanie lub w inny sposób wykorzystywanie jakiejkolwiek części Platformy w celach komercyjnych.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">§ 9. PŁATNOŚCI I SUBSKRYPCJE</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mb-3">9.1. Metody płatności</h3>
            <p className="text-gray-600 mb-4">Usługodawca akceptuje płatności kartami płatniczymi (Visa, Mastercard, American Express), przelewem bankowym oraz za pośrednictwem serwisów płatności elektronicznych (np. PayPal, Stripe).</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">9.2. Ceny i waluta</h3>
            <p className="text-gray-600 mb-4">Wszystkie ceny podawane są w złotych polskich (PLN) lub euro (EUR) i zawierają podatek VAT, jeśli ma zastosowanie. Usługodawca zastrzega sobie prawo do zmiany cen w dowolnym momencie, z odpowiednim wyprzedzeniem.</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">9.3. Subskrypcje i automatyczne odnowienie</h3>
            <p className="text-gray-600 mb-4">Subskrypcje odnawiają się automatycznie na kolejny okres rozliczeniowy, chyba że Klient anuluje subskrypcję przed końcem bieżącego okresu. Klient wyraża zgodę na automatyczne obciążanie wybranej metody płatności w kolejnych okresach rozliczeniowych.</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">9.4. Anulowanie subskrypcji</h3>
            <p className="text-gray-600 mb-4">Klient może anulować subskrypcję w dowolnym momencie za pośrednictwem swojego konta. Anulowanie będzie skuteczne od końca bieżącego opłaconego okresu rozliczeniowego.</p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">9.5. Zmiany cen</h3>
            <p className="text-gray-600">O zmianach cen subskrypcji Klient zostanie poinformowany z co najmniej 30-dniowym wyprzedzeniem. Kontynuowanie korzystania z Usług po wejściu w życie nowych cen oznacza ich akceptację.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">§ 10. NIEDOZWOLONE DZIAŁANIA</h2>
            <p className="text-gray-600 mb-4">Korzystając z Usług, Klient zobowiązuje się nie podejmować następujących działań:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>systematycznego pobierania danych z Platformy w celu tworzenia zbiorów danych bez pisemnej zgody Usługodawcy</li>
              <li>wprowadzania w błąd Usługodawcy lub innych użytkowników</li>
              <li>obchodzenia zabezpieczeń Platformy</li>
              <li>wykorzystywania informacji uzyskanych z Platformy do nękania lub szkodzenia innym osobom</li>
              <li>korzystania z Usług w sposób niezgodny z obowiązującymi przepisami prawa</li>
              <li>przesyłania wirusów, złośliwego oprogramowania lub innych szkodliwych materiałów</li>
              <li>podejmowania zautomatyzowanych działań w systemie (boty, skrypty)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">§ 11. DANE KONTAKTOWE</h2>
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
