"use client";

import { useState, useEffect, useCallback } from "react";
import type { PicnicProduct } from "@/types/picnic";

type PicnicStatus = "loading" | "connected" | "disconnected";

interface UsePicnicReturn {
  status: PicnicStatus;
  login: (username: string, password: string) => Promise<void>;
  disconnect: () => Promise<void>;
  search: (query: string) => Promise<PicnicProduct[]>;
  addToCart: (productId: string, count?: number) => Promise<void>;
  removeFromCart: (productId: string, count?: number) => Promise<void>;
}

export function usePicnic(familyId: string | undefined): UsePicnicReturn {
  const [status, setStatus] = useState<PicnicStatus>(familyId ? "loading" : "disconnected");

  const fetchStatus = useCallback(async () => {
    if (!familyId) {
      setStatus("disconnected");
      return;
    }

    try {
      const res = await fetch("/api/picnic/status");
      if (!res.ok) {
        setStatus("disconnected");
        return;
      }
      const data = await res.json();
      setStatus(data.connected ? "connected" : "disconnected");
    } catch {
      setStatus("disconnected");
    }
  }, [familyId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch("/api/picnic/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "Inloggen mislukt");
    }

    await fetchStatus();
  }, [fetchStatus]);

  const disconnect = useCallback(async () => {
    const res = await fetch("/api/picnic/status", {
      method: "DELETE",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "Ontkoppelen mislukt");
    }

    setStatus("disconnected");
  }, []);

  const search = useCallback(async (query: string): Promise<PicnicProduct[]> => {
    const res = await fetch(`/api/picnic/search?query=${encodeURIComponent(query)}`);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "Zoeken mislukt");
    }

    const data = await res.json();
    return data.products;
  }, []);

  const addToCart = useCallback(async (productId: string, count: number = 1) => {
    const res = await fetch("/api/picnic/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, count }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "Toevoegen mislukt");
    }
  }, []);

  const removeFromCart = useCallback(async (productId: string, count: number = 1) => {
    const res = await fetch("/api/picnic/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, count }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "Verwijderen mislukt");
    }
  }, []);

  return { status, login, disconnect, search, addToCart, removeFromCart };
}
