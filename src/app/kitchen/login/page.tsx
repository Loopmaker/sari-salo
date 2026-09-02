"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function KitchenLoginPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/kitchen/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError("Incorrect password.");
        return;
      }

      router.push("/kitchen");
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-counter border border-counter-line rounded-lg p-6 space-y-4"
      >
        <h1 className="font-semibold text-lg text-ink">Kitchen Login</h1>
        <div>
          <label
            htmlFor="kitchen-password"
            className="block text-ink/70 text-xs font-medium uppercase tracking-wide mb-1"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="kitchen-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full min-h-12 pl-3 pr-11 rounded-lg border border-counter-line bg-paper text-ink focus:outline-none focus:ring-2 focus:ring-annatto"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-0 top-0 h-12 w-11 flex items-center justify-center text-ink/50 hover:text-ink/80 transition-colors"
            >
              {showPassword ? (
                <EyeOff size={20} strokeWidth={2} aria-hidden="true" />
              ) : (
                <Eye size={20} strokeWidth={2} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
        {error && <p className="text-status-attention text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting || password.length === 0}
          className="w-full bg-annatto text-white py-3.5 rounded-lg font-medium tracking-wide disabled:opacity-40 hover:bg-annatto/90 active:translate-y-px transition-all"
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
