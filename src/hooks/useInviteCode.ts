"use client";

import { useState, useCallback } from "react";

export function useInviteCode() {
  const [code, setCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateCode = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/invite", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to generate invite code");
        return;
      }
      const data = await res.json();
      setCode(data.code);
    } catch {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const inviteUrl = code
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/login?invite=${code}`
    : null;

  const copyToClipboard = useCallback(async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy");
    }
  }, [inviteUrl]);

  const share = useCallback(async () => {
    if (!inviteUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join our Family App",
          text: `Use this link to join: ${inviteUrl}`,
          url: inviteUrl,
        });
      } catch {
        // User cancelled or share failed — fall back to copy
        await copyToClipboard();
      }
    } else {
      await copyToClipboard();
    }
  }, [inviteUrl, copyToClipboard]);

  return { code, inviteUrl, isLoading, error, copied, generateCode, copyToClipboard, share };
}
