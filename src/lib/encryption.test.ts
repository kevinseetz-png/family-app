import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "./encryption";

describe("encryption", () => {
  it("should encrypt and decrypt a string round-trip", () => {
    const plaintext = "picnic-auth-key-abc123";
    const encrypted = encrypt(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(decrypt(encrypted)).toBe(plaintext);
  });

  it("should produce different ciphertext for the same input (random IV)", () => {
    const plaintext = "same-key-twice";
    const a = encrypt(plaintext);
    const b = encrypt(plaintext);
    expect(a).not.toBe(b);
    // But both decrypt to the same value
    expect(decrypt(a)).toBe(plaintext);
    expect(decrypt(b)).toBe(plaintext);
  });

  it("should handle empty string", () => {
    const encrypted = encrypt("");
    expect(decrypt(encrypted)).toBe("");
  });

  it("should handle unicode characters", () => {
    const plaintext = "wachtwoord-café-ñ-日本語";
    const encrypted = encrypt(plaintext);
    expect(decrypt(encrypted)).toBe(plaintext);
  });

  it("should produce output in iv:tag:ciphertext hex format", () => {
    const encrypted = encrypt("test");
    const parts = encrypted.split(":");
    expect(parts).toHaveLength(3);
    // IV = 12 bytes = 24 hex chars
    expect(parts[0]).toMatch(/^[0-9a-f]{24}$/);
    // Auth tag = 16 bytes = 32 hex chars
    expect(parts[1]).toMatch(/^[0-9a-f]{32}$/);
    // Ciphertext is non-empty hex
    expect(parts[2]).toMatch(/^[0-9a-f]+$/);
  });

  it("should throw on tampered ciphertext", () => {
    const encrypted = encrypt("secret");
    const parts = encrypted.split(":");
    // Flip a byte in the ciphertext
    const tampered = parts[0] + ":" + parts[1] + ":ff" + parts[2].slice(2);
    expect(() => decrypt(tampered)).toThrow();
  });
});
