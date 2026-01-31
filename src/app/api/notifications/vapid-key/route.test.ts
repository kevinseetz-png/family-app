import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/vapid", () => ({
  VAPID_PUBLIC_KEY: "test-vapid-public-key",
}));

import { GET } from "./route";

describe("GET /api/notifications/vapid-key", () => {
  it("should return the public VAPID key", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.publicKey).toBe("test-vapid-public-key");
  });
});
