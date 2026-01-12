import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { Star, Send, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TrackingData {
  clientId: string;
  name: string;
  status: string;
  placeId: string | null;
  businessName: string;
}

export default function ReviewLanding() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [complaint, setComplaint] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [googleOpened, setGoogleOpened] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/track/${slug}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Link wygasł lub jest nieprawidłowy");
          } else {
            setError("Nie udało się załadować strony");
          }
          return;
        }
        const data = await response.json();
        setTrackingData(data);

        if (data.status === "NEW" || data.status === "SENT") {
          await fetch(`/api/track/${slug}/status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "CLICKED" }),
          });
        }
      } catch (err) {
        setError("Błąd połączenia");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  const verifyReview = useCallback(async () => {
    if (!googleOpened || verifying) return;
    
    setVerifying(true);
    try {
      const response = await fetch(`/api/track/${slug}/verify-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      if (response.ok) {
        setLocation("/success");
      }
    } catch (err) {
      console.error("Verification error:", err);
    } finally {
      setVerifying(false);
    }
  }, [slug, googleOpened, verifying, setLocation]);

  useEffect(() => {
    const handleFocus = () => {
      if (googleOpened) {
        verifyReview();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [googleOpened, verifyReview]);

  const handleRatingSelect = async (rating: number) => {
    setSelectedRating(rating);

    if (rating >= 4 && trackingData?.placeId) {
      await fetch(`/api/track/${slug}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PENDING_REVIEW" }),
      });

      const googleUrl = `https://search.google.com/local/writereview?placeid=${trackingData.placeId}`;
      setGoogleOpened(true);
      
      const newWindow = window.open(googleUrl, "_blank");
      if (!newWindow) {
        window.location.href = googleUrl;
      }
    }
  };

  const handleSubmitComplaint = async () => {
    if (!complaint.trim() || !selectedRating) return;
    
    setSubmitting(true);
    try {
      await fetch(`/api/track/${slug}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "CLICKED",
          rating: selectedRating,
          complaint: complaint.trim(),
        }),
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Ups!</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verifying || (googleOpened && !selectedRating)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-center text-muted-foreground">
          Weryfikujemy Twoją opinię...
        </p>
        <p className="text-sm text-center text-muted-foreground">
          Po napisaniu opinii w Google wróć tutaj
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Dziękujemy za opinię!</h2>
            <p className="text-muted-foreground">
              Twoja uwaga została przekazana. Skontaktujemy się z Tobą wkrótce.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="max-w-md w-full" data-testid="card-review-landing">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {trackingData?.businessName || "Oceń nas"}
          </CardTitle>
          <CardDescription>
            Cześć{trackingData?.name ? ` ${trackingData.name}` : ""}! Jak oceniasz naszą obsługę?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center gap-2" data-testid="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRatingSelect(star)}
                className={`p-2 transition-all transform hover:scale-110 ${
                  selectedRating && selectedRating >= star
                    ? "text-yellow-400"
                    : "text-gray-300 hover:text-yellow-300"
                }`}
                data-testid={`star-${star}`}
              >
                <Star
                  className="h-10 w-10"
                  fill={selectedRating && selectedRating >= star ? "currentColor" : "none"}
                />
              </button>
            ))}
          </div>

          {selectedRating && selectedRating <= 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <p className="text-sm text-muted-foreground text-center">
                Przepraszamy za niedogodności. Powiedz nam co poszło nie tak, abyśmy mogli to naprawić.
              </p>
              <Textarea
                placeholder="Opisz swój problem..."
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                rows={4}
                data-testid="textarea-complaint"
              />
              <Button
                className="w-full"
                onClick={handleSubmitComplaint}
                disabled={submitting || !complaint.trim()}
                data-testid="button-submit-complaint"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Wyślij opinię
              </Button>
            </div>
          )}

          {selectedRating && selectedRating >= 4 && !googleOpened && (
            <div className="text-center space-y-2 animate-in fade-in">
              <p className="text-sm text-muted-foreground">
                Dziękujemy! Przekierowujemy Cię do Google...
              </p>
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
