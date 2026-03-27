"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { getAuthPasswordLimits, normalizeEmail, normalizeName } from "@/lib/auth-validation";

const passwordLimits = getAuthPasswordLimits();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function MinimalLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl border border-(--surface-border) bg-(--bg-soft) backdrop-blur-sm flex items-center justify-center">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M8 5.5V18.5"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            className="text-(--text-strong)"
          />
          <path
            d="M8 6.5H12.9C14.8 6.5 16.3 7.9 16.3 9.7C16.3 11.5 14.8 12.9 12.9 12.9H8"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-(--text-strong)"
          />
          <path
            d="M8 12.4H13.4C15.5 12.4 17.1 13.8 17.1 15.7C17.1 17.5 15.5 18.9 13.4 18.9H8"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-(--accent)"
          />
        </svg>
      </div>
      <div>
        <p className="text-sm tracking-[0.18em] uppercase text-(--text-muted)">bilans.ooo</p>
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const email = normalizeEmail(formData.email);
    if (!emailRegex.test(email)) {
      setError("Podaj poprawny adres email");
      return;
    }

    if (formData.password.length < passwordLimits.min) {
      setError(`Hasło musi mieć co najmniej ${passwordLimits.min} znaków`);
      return;
    }

    if (formData.password.length > passwordLimits.max) {
      setError(`Hasło może mieć maksymalnie ${passwordLimits.max} znaków`);
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "TOO_MANY_ATTEMPTS") {
          setError("Za dużo prób logowania. Spróbuj ponownie za kilka minut");
        } else {
          setError("Nieprawidłowy email lub hasło");
        }
      } else if (result?.ok) {
        router.push("/dashboard");
      }
    } catch {
      setError("Coś poszło nie tak. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const email = normalizeEmail(formData.email);
    const name = normalizeName(formData.name);

    if (name.length < 2 || name.length > 80) {
      setError("Imię i nazwisko musi mieć od 2 do 80 znaków");
      return;
    }

    if (!emailRegex.test(email)) {
      setError("Podaj poprawny adres email");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Hasła nie zgadzają się");
      return;
    }

    if (formData.password.length < passwordLimits.min) {
      setError(`Hasło musi mieć co najmniej ${passwordLimits.min} znaków`);
      return;
    }

    if (formData.password.length > passwordLimits.max) {
      setError(`Hasło może mieć maksymalnie ${passwordLimits.max} znaków`);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password: formData.password,
          name,
        }),
      });

      let data: { message?: string } = {};
      try {
        data = (await response.json()) as { message?: string };
      } catch {
        data = {};
      }

      if (!response.ok) {
        setError(data.message || "Błąd podczas rejestracji");
        return;
      }

      // Automatyczne zalogowanie po rejestracji
      const signInResult = await signIn("credentials", {
        email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.ok) {
        router.push("/dashboard");
      } else {
        setError("Rejestracja powiodła się, ale logowanie nie powiodło się");
      }
    } catch {
      setError("Błąd podczas rejestracji. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = isSignUp ? handleSignUp : handleSignIn;

  return (
    <div className="min-h-screen bg-(--bg-canvas) flex items-center justify-center px-4">

      {/* Main form container */}
      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-(--bg-elevated) border border-(--surface-border) rounded-lg shadow-xl p-8">
          {/* Logo/Header */}
          <div className="mb-8">
            <MinimalLogo />
            <p className="mt-4 text-(--text-muted) text-sm">
              {isSignUp ? "Załóż nowe konto" : "Zaloguj się do swojego konta"}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-4 bg-(--danger-soft) border border-(--danger-border) rounded text-(--danger-text) text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name field - only for sign up */}
            {isSignUp && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-(--text-strong) mb-2">
                  Imię i nazwisko
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Jan Kowalski"
                  minLength={2}
                  maxLength={80}
                  className="w-full px-4 py-2 bg-(--bg-soft) border border-(--surface-border) rounded text-(--text-strong) placeholder-(--text-muted) focus:outline-none focus:border-(--accent) focus:ring-1 focus:ring-(--accent)/25 transition"
                  required={isSignUp}
                />
              </div>
            )}

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-(--text-strong) mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="twoj@email.com"
                maxLength={254}
                className="w-full px-4 py-2 bg-(--bg-soft) border border-(--surface-border) rounded text-(--text-strong) placeholder-(--text-muted) focus:outline-none focus:border-(--accent) focus:ring-1 focus:ring-(--accent)/25 transition"
                required
              />
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-(--text-strong) mb-2">
                Hasło
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                minLength={passwordLimits.min}
                maxLength={passwordLimits.max}
                className="w-full px-4 py-2 bg-(--bg-soft) border border-(--surface-border) rounded text-(--text-strong) placeholder-(--text-muted) focus:outline-none focus:border-(--accent) focus:ring-1 focus:ring-(--accent)/25 transition"
                required
              />
              {isSignUp && (
                <p className="text-xs text-(--text-muted) mt-1">
                  Minimum 8 znaków
                </p>
              )}
            </div>

            {/* Confirm password field - only for sign up */}
            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-(--text-strong) mb-2">
                  Powtórz hasło
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  minLength={passwordLimits.min}
                  maxLength={passwordLimits.max}
                  className="w-full px-4 py-2 bg-(--bg-soft) border border-(--surface-border) rounded text-(--text-strong) placeholder-(--text-muted) focus:outline-none focus:border-(--accent) focus:ring-1 focus:ring-(--accent)/25 transition"
                  required={isSignUp}
                />
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-(--accent) hover:bg-(--accent-hover) text-white font-semibold rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? "Proszę czekać..."
                : isSignUp
                ? "Załóż konto"
                : "Zaloguj się"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-(--surface-border)"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-(--bg-elevated) text-(--text-muted)">lub</span>
            </div>
          </div>

          {/* Toggle between sign in and sign up */}
          <p className="text-center text-(--text-muted) text-sm">
            {isSignUp ? (
              <>
                Masz już konto?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setError(null);
                    setFormData({ email: "", password: "", name: "", confirmPassword: "" });
                  }}
                  className="text-(--accent) hover:text-(--accent-hover) font-semibold transition"
                >
                  Zaloguj się
                </button>
              </>
            ) : (
              <>
                Nie masz konta?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setError(null);
                    setFormData({ email: "", password: "", name: "", confirmPassword: "" });
                  }}
                  className="text-(--accent) hover:text-(--accent-hover) font-semibold transition"
                >
                  Załóż konto
                </button>
              </>
            )}
          </p>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-(--text-muted)/80">
          <p>
            Korzystając z serwisu akceptujesz nasze{" "}
            <Link href="#" className="hover:text-(--text-strong) transition">
              warunki
            </Link>
            {" "}i{" "}
            <Link href="#" className="hover:text-(--text-strong) transition">
              politykę prywatności
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-(--bg-canvas) flex items-center justify-center">
        <p className="text-(--text-muted)">Ładowanie...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
