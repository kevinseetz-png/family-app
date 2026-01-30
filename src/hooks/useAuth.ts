"use client";

import { useState, useEffect, useCallback } from "react";
import type { User, AuthState } from "@/types/auth";
import { signInWithCustomToken } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";

interface MeResponse {
  user?: User;
}

interface AuthSuccessResponse {
  user: User;
}

interface AuthErrorResponse {
  message?: string;
}

async function signIntoFirebase() {
  try {
    const res = await fetch("/api/auth/firebase-token");
    if (!res.ok) return;
    const { token } = await res.json();
    await signInWithCustomToken(firebaseAuth, token);
  } catch {
    // Firebase sign-in is best-effort for real-time features
  }
}

export function useAuth(): AuthState & {
  login: (email: string, password: string) => Promise<string | null>;
  register: (name: string, email: string, password: string, inviteCode: string) => Promise<string | null>;
  logout: () => void;
} {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? (res.json() as Promise<MeResponse>) : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          signIntoFirebase();
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data: AuthErrorResponse = await res.json();
      return data.message || "Login failed";
    }

    const data: AuthSuccessResponse = await res.json();
    setUser(data.user);
    await signIntoFirebase();
    return null;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, inviteCode: string): Promise<string | null> => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, inviteCode }),
    });

    if (!res.ok) {
      const data: AuthErrorResponse = await res.json();
      return data.message || "Registration failed";
    }

    const data: AuthSuccessResponse = await res.json();
    setUser(data.user);
    await signIntoFirebase();
    return null;
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await firebaseAuth.signOut();
    setUser(null);
  }, []);

  return { user, isLoading, login, register, logout };
}
