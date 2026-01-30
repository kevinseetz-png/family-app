"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";
import { LoginForm } from "@/components/LoginForm";
import { RegisterForm } from "@/components/RegisterForm";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const { user, isLoading, login, register } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (user) return null;

  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold text-indigo-600 mb-2">Family App</h1>
      <p className="text-gray-600 mb-8">
        {mode === "login" ? "Sign in to your account" : "Create your account"}
      </p>

      {mode === "login" ? (
        <LoginForm onSubmit={login} onSwitchToRegister={() => setMode("register")} />
      ) : (
        <RegisterForm onSubmit={register} onSwitchToLogin={() => setMode("login")} />
      )}

    </main>
  );
}
