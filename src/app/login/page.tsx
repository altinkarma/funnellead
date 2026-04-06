"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/";
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Giriş başarısız");
        setLoading(false);
        return;
      }
      router.push(from);
      router.refresh();
    } catch {
      setError("Bağlantı hatası");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201652] via-[#0D297B] to-[#1A3A9C] flex items-center justify-center p-5 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full" />
      <div className="absolute -bottom-32 -left-20 w-80 h-80 bg-white/5 rounded-full" />
      <div className="absolute top-1/3 left-1/4 w-40 h-40 bg-[#7EE8C3]/10 rounded-full blur-2xl" />

      <div className="w-full max-w-[420px] relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 border border-white/20 text-3xl shadow-xl backdrop-blur-sm mb-3">
            🛡
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Timurlar Sigorta</h1>
          <p className="text-[11px] uppercase tracking-widest text-white/60 font-bold mt-1">
            Yönetim Paneli
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/97 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-7"
        >
          <h2 className="text-lg font-bold text-[#201652] mb-1">Giriş yap</h2>
          <p className="text-xs text-gray-500 mb-5">
            30+&apos;dan fazla sigorta firmasından teklif veriyoruz. Panele erişmek için şifrenizi girin.
          </p>

          <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
            Şifre
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoFocus
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#0D297B] outline-none transition-colors"
          />

          {error && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-5 bg-gradient-to-r from-[#201652] to-[#0D297B] text-white font-bold py-3.5 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Giriş yapılıyor..." : "Panele Giriş →"}
          </button>

          <div className="mt-4 text-center text-[11px] text-gray-400">
            Yalnızca yetkili personel erişebilir.
          </div>
        </form>

        <p className="text-center text-[11px] text-white/60 mt-5 font-medium">
          © {new Date().getFullYear()} Timurlar Sigorta · 30+&apos;dan fazla sigorta firmasından teklif veriyoruz
        </p>
      </div>
    </div>
  );
}
