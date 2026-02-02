"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import LightRays from "@/components/LightRays";

// Track failed login attempts per email (client-side only, resets on page refresh)
const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();

export default function LoginPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Update countdown timer
  useEffect(() => {
    if (!retryAfter) {
      setCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.ceil((retryAfter - Date.now()) / 1000);
      if (remaining > 0) {
        setCountdown(remaining);
      } else {
        setRetryAfter(null);
        setCountdown(null);
        setError(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [retryAfter]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (retryAfter && retryAfter > Date.now()) {
      const secondsLeft = Math.ceil((retryAfter - Date.now()) / 1000);
      setError(`Bitte warten Sie ${secondsLeft} Sekunden, bevor Sie es erneut versuchen.`);
      return;
    }
    
    // Check client-side rate limiting (only after 5 failed attempts within 2 minutes)
    const emailKey = email.toLowerCase();
    const attempts = failedAttempts.get(emailKey);
    if (attempts) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
      // Reset counter if it's been more than 2 minutes since last attempt
      if (timeSinceLastAttempt > 120000) {
        failedAttempts.delete(emailKey);
      } else if (attempts.count >= 5) {
        // Block after 5 failed attempts within 2 minutes
        const retryDelay = 30; // 30 seconds cooldown
        setRetryAfter(Date.now() + (retryDelay * 1000));
        setError(`Zu viele fehlgeschlagene Anmeldeversuche. Bitte warten Sie ${retryDelay} Sekunden.`);
        return;
      }
    }
    
    setError(null);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        // Track failed attempt (but not for rate limit errors from Supabase)
        const isRateLimitError = error.status === 429 || error.message?.includes('rate limit') || error.message?.includes('Too Many Requests');
        
        if (!isRateLimitError) {
          const current = failedAttempts.get(emailKey) || { count: 0, lastAttempt: 0 };
          const newCount = current.count + 1;
          failedAttempts.set(emailKey, {
            count: newCount,
            lastAttempt: Date.now()
          });
          
          // Show attempt counter to user
          console.log(`Failed login attempt ${newCount}/5 for ${emailKey}`);
        }
        
        // Handle different error types with clear messages
        if (isRateLimitError) {
          // Supabase's own rate limiting - just show a gentle message, don't block locally
          setError(`Bitte warten Sie einen Moment und versuchen Sie es erneut.`);
        } else if (error.message?.includes('Invalid login credentials')) {
          const current = failedAttempts.get(emailKey);
          const attemptsLeft = current ? Math.max(0, 5 - current.count) : 5;
          if (attemptsLeft > 0) {
            setError(`Ungültige E-Mail oder Passwort. Noch ${attemptsLeft} Versuche übrig.`);
          } else {
            setError(`Ungültige E-Mail oder Passwort.`);
          }
        } else if (error.message?.includes('Email not confirmed')) {
          setError("E-Mail-Adresse noch nicht bestätigt. Bitte prüfen Sie Ihr Postfach.");
        } else {
          setError(error.message || "Anmeldung fehlgeschlagen. Bitte erneut versuchen.");
        }
        setLoading(false);
        return;
      }
      
      // Successful login - clear failed attempts for this email
      failedAttempts.delete(emailKey);
      
      if (data.session) {
        // Check role to route admins to /admin
        const { data: u } = await supabase.auth.getUser();
        const userEmail = (u?.user?.email ?? "").toLowerCase();
        if (userEmail === "info@oag-media.com") {
          router.replace("/admin");
          return;
        }
        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", u?.user?.id ?? "")
          .maybeSingle();
        if (prof?.role === "admin") {
          router.replace("/admin");
        } else {
          router.replace("/");
        }
      } else {
        setError("Login fehlgeschlagen. Bitte erneut versuchen.");
        setLoading(false);
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      const error = err as { status?: number; message?: string };
      if (error.status === 429 || error.message?.includes('rate limit')) {
        const retryDelay = 30; // Reduced from 60 to 30 seconds
        setRetryAfter(Date.now() + (retryDelay * 1000));
        setError(`Zu viele Anmeldeversuche. Bitte warten Sie ${retryDelay} Sekunden.`);
      } else {
        setError("Ein Fehler ist aufgetreten. Bitte erneut versuchen.");
      }
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center text-white px-6 relative">
      <div className="page-light-rays">
        <LightRays raysColor="#63eca9" />
      </div>
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
        <h1 className="text-2xl font-semibold mb-4">Login</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm opacity-80">Email (Benutzername)</label>
            <input
              className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 outline-none focus:border-purple-400"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm opacity-80">Passwort</label>
            <input
              className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 outline-none focus:border-purple-400"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="text-red-400 text-sm">
              <p>{error}</p>
              {countdown !== null && countdown > 0 && (
                <p className="mt-1 text-xs opacity-75">
                  Verbleibende Zeit: {countdown} Sekunden
                </p>
              )}
            </div>
          )}
          <button
            type="submit"
            className="w-full rounded-lg bg-purple-600/80 hover:bg-purple-600 transition px-3 py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || (retryAfter !== null && retryAfter > Date.now())}
          >
            {loading ? "Bitte warten…" : countdown !== null && countdown > 0 ? `Warten (${countdown}s)` : "Einloggen"}
          </button>
        </form>
      </div>
    </main>
  );
}
