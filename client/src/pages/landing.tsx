import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  MessageSquare, 
  Shield, 
  Zap, 
  CheckCircle, 
  ArrowRight, 
  Menu, 
  X,
  Users,
  BarChart3,
  Bot,
  Send,
  ChevronRight
} from "lucide-react";

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Star className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">ReviewHarvest</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection("features")} className="text-gray-600 hover:text-gray-900 transition-colors">
                Funkcje
              </button>
              <button onClick={() => scrollToSection("pricing")} className="text-gray-600 hover:text-gray-900 transition-colors">
                Cennik
              </button>
              <button onClick={() => scrollToSection("faq")} className="text-gray-600 hover:text-gray-900 transition-colors">
                FAQ
              </button>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" data-testid="button-login-nav">Zaloguj się</Button>
              </Link>
              <Link href="/login">
                <Button className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-start-nav">
                  Zacznij teraz
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 py-4 px-4 space-y-4">
            <button onClick={() => scrollToSection("features")} className="block w-full text-left text-gray-600 hover:text-gray-900 py-2">
              Funkcje
            </button>
            <button onClick={() => scrollToSection("pricing")} className="block w-full text-left text-gray-600 hover:text-gray-900 py-2">
              Cennik
            </button>
            <button onClick={() => scrollToSection("faq")} className="block w-full text-left text-gray-600 hover:text-gray-900 py-2">
              FAQ
            </button>
            <div className="pt-4 space-y-2">
              <Link href="/login">
                <Button variant="outline" className="w-full">Zaloguj się</Button>
              </Link>
              <Link href="/login">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Zacznij teraz</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                Automatyzacja opinii Google
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Zdobądź <span className="text-emerald-600">5-gwiazdkowe</span> opinie w Google automatycznie
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Inteligentny system SMS, który filtruje opinie, automatyzuje odpowiedzi AI i buduje Twoją reputację online.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login">
                  <Button size="lg" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-6" data-testid="button-hero-cta">
                    Wypróbuj teraz
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6" onClick={() => scrollToSection("features")}>
                  Zobacz jak działa
                </Button>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span>Bez karty kredytowej</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span>14 dni za darmo</span>
                </div>
              </div>
            </div>

            {/* Phone Mockup with SMS Flow */}
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[3rem] p-3 shadow-2xl max-w-sm mx-auto">
                <div className="bg-white rounded-[2.5rem] overflow-hidden">
                  {/* Phone Header */}
                  <div className="bg-gray-100 px-6 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">SMS</span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    </div>
                  </div>
                  
                  {/* Chat Messages */}
                  <div className="p-4 space-y-4 min-h-[400px]">
                    {/* Outgoing Message */}
                    <div className="flex justify-end">
                      <div className="bg-emerald-500 text-white rounded-2xl rounded-br-md px-4 py-3 max-w-[80%]">
                        <p className="text-sm">Cześć Jan! Dziękujemy za wizytę w Auto Serwis Kowalski. Jak oceniasz naszą obsługę? ⭐</p>
                        <p className="text-xs mt-2 opacity-80">reviewharvest.pl/r/abc123</p>
                      </div>
                    </div>

                    {/* Review Gate Illustration */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="text-center space-y-3">
                        <p className="text-sm font-medium text-gray-700">Jak oceniasz obsługę?</p>
                        <div className="flex justify-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-8 w-8 ${star <= 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                        <div className="flex gap-2 justify-center text-xs">
                          <span className="text-red-500">1-3: Formularz</span>
                          <span className="text-emerald-500">4-5: Google</span>
                        </div>
                      </div>
                    </div>

                    {/* Success indicator */}
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm">Opinia dodana w Google!</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-emerald-100 rounded-full blur-2xl opacity-60"></div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-teal-100 rounded-full blur-2xl opacity-60"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-emerald-100 text-emerald-700 mb-4">Funkcje</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Wszystko czego potrzebujesz do zbierania opinii
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Kompleksowe rozwiązanie, które automatyzuje cały proces zbierania recenzji Google.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 group">
              <CardHeader>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="h-6 w-6 text-emerald-600" />
                </div>
                <CardTitle className="text-xl">Inteligentne Filtrowanie</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Zatrzymaj negatywne opinie, zanim trafią do Google. Klienci z oceną 1-3 trafiają do Twojego wewnętrznego systemu.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 group">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Bot className="h-6 w-6 text-teal-600" />
                </div>
                <CardTitle className="text-xl">Automatyzacja AI</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Szybkie i unikalne odpowiedzi na każdą recenzję dzięki AI. Oszczędź godziny pracy na ręcznych odpowiedziach.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 group">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Weryfikacja Konwersji</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Wiemy dokładnie, kiedy klient wystawił opinię. Śledź konwersje i optymalizuj kampanie w czasie rzeczywistym.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-emerald-100 text-emerald-700 mb-4">Jak to działa</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              4 proste kroki do sukcesu
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Users, title: "Importuj listę", desc: "Prześlij CSV z kontaktami klientów" },
              { icon: Send, title: "Wyślij kampanię", desc: "Automatyczne SMS-y z linkiem do oceny" },
              { icon: Star, title: "System weryfikuje", desc: "Inteligentny lejek filtruje opinie" },
              { icon: BarChart3, title: "Rośnij w Google", desc: "Obserwuj wzrost pozytywnych recenzji" },
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white shadow-lg rounded-2xl flex items-center justify-center mx-auto mb-4 relative">
                    <step.icon className="h-8 w-8 text-emerald-600" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-600 text-white text-sm font-bold rounded-full flex items-center justify-center">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.desc}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%]">
                    <ChevronRight className="h-6 w-6 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-emerald-100 text-emerald-700 mb-4">Cennik</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Wybierz plan dla siebie
            </h2>
            <p className="text-xl text-gray-600">
              Przejrzyste ceny bez ukrytych opłat
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <Card className="border-2 border-gray-200 hover:border-emerald-200 transition-colors duration-300">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-2">Starter</CardTitle>
                <div className="text-4xl font-bold text-gray-900">
                  119 <span className="text-lg font-normal text-gray-500">PLN/mies</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {["50 requestów/miesiąc", "Personalizowane obrazy", "Kampanie SMS/Email", "Review Funnel", "Statystyki podstawowe"].map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/login">
                  <Button variant="outline" className="w-full mt-6" data-testid="button-plan-starter">
                    Wybierz plan
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Growth - Popular */}
            <Card className="border-2 border-emerald-500 relative shadow-xl scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-emerald-600 text-white">Najpopularniejszy</Badge>
              </div>
              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl mb-2">Growth</CardTitle>
                <div className="text-4xl font-bold text-gray-900">
                  199 <span className="text-lg font-normal text-gray-500">PLN/mies</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {["100 requestów/miesiąc", "Personalizowane obrazy", "Kampanie SMS/Email", "Review Funnel", "AI Auto-odpowiedzi", "Priorytetowe wsparcie"].map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/login">
                  <Button className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700" data-testid="button-plan-growth">
                    Wybierz plan
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro */}
            <Card className="border-2 border-gray-200 hover:border-emerald-200 transition-colors duration-300">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-2">Pro</CardTitle>
                <div className="text-4xl font-bold text-gray-900">
                  399 <span className="text-lg font-normal text-gray-500">PLN/mies</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {["300 requestów/miesiąc", "Personalizowane obrazy", "Kampanie SMS/Email", "Review Funnel", "AI Auto-odpowiedzi", "Priorytetowe wsparcie", "Dedykowany opiekun"].map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/login">
                  <Button variant="outline" className="w-full mt-6" data-testid="button-plan-pro">
                    Wybierz plan
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-emerald-100 text-emerald-700 mb-4">FAQ</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Często zadawane pytania
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Jak działa filtrowanie opinii?",
                a: "Klienci otrzymują link do strony z oceną gwiazdkową. Jeśli wybiorą 1-3 gwiazdki, trafiają do wewnętrznego formularza kontaktowego. Przy 4-5 gwiazdkach są przekierowywani do Google."
              },
              {
                q: "Czy potrzebuję konta Google Business?",
                a: "Tak, do zbierania opinii w Google potrzebujesz zweryfikowanego profilu Google Business. Nasz system integruje się z Twoim kontem."
              },
              {
                q: "Ile kosztuje wysyłka SMS?",
                a: "Koszt SMS jest wliczony w cenę planu. Liczba dostępnych requestów oznacza ilość wysłanych wiadomości miesięcznie."
              },
              {
                q: "Czy mogę anulować subskrypcję?",
                a: "Tak, możesz anulować subskrypcję w dowolnym momencie. Twoje konto pozostanie aktywne do końca opłaconego okresu."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-600 to-teal-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Gotowy na więcej 5-gwiazdkowych opinii?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Dołącz do firm, które automatyzują zbieranie recenzji i budują silną reputację online.
          </p>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6" data-testid="button-final-cta">
              Rozpocznij za darmo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">ReviewHarvest</span>
              </div>
              <p className="text-gray-400 text-sm">
                Automatyzacja opinii Google dla nowoczesnych firm.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Produkt</h4>
              <ul className="space-y-2">
                <li><button onClick={() => scrollToSection("features")} className="text-gray-400 hover:text-white text-sm">Funkcje</button></li>
                <li><button onClick={() => scrollToSection("pricing")} className="text-gray-400 hover:text-white text-sm">Cennik</button></li>
                <li><button onClick={() => scrollToSection("faq")} className="text-gray-400 hover:text-white text-sm">FAQ</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Firma</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white text-sm">O nas</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm">Kontakt</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Prawne</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white text-sm">Polityka prywatności</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm">Regulamin</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm">RODO</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            © {new Date().getFullYear()} ReviewHarvest. Wszystkie prawa zastrzeżone.
          </div>
        </div>
      </footer>
    </div>
  );
}
