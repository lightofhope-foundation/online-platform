"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      router.replace("/");
    } else {
      setError("Login fehlgeschlagen. Bitte erneut versuchen.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center text-white px-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
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
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-purple-600/80 hover:bg-purple-600 transition px-3 py-2 font-medium"
            disabled={loading}
          >
            {loading ? "Bitte warten…" : "Einloggen"}
          </button>
        </form>
      </div>
    </main>
  );
}
