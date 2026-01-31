import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: vi.fn(),
  },
}));

vi.mock("@/lib/push", () => ({
  sendNotificationToFamily: vi.fn(),
}));

import { GET } from "./route";
import { adminDb } from "@/lib/firebase-admin";
import { sendNotificationToFamily } from "@/lib/push";

const mockCollection = vi.mocked(adminDb.collection);
const mockSendNotification = vi.mocked(sendNotificationToFamily);

function makeRequest(secret?: string) {
  return new NextRequest("http://localhost:3000/api/cron/vitamin-reminder", {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });
}

describe("GET /api/cron/vitamin-reminder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", "test-cron-secret");
  });

  it("should return 401 without valid cron secret", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("should send reminder when vitamin not checked today", async () => {
    const familyDocs = [{ id: "fam1" }];

    mockCollection.mockImplementation((name: string) => {
      if (name === "families") {
        return { get: vi.fn().mockResolvedValue({ docs: familyDocs }) } as never;
      }
      if (name === "vitamins") {
        return {
          where: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue({ docs: [] }), // no check today
            }),
          }),
        } as never;
      }
      return { get: vi.fn().mockResolvedValue({ docs: [] }) } as never;
    });

    mockSendNotification.mockResolvedValue({ sent: 1, failed: 0 });

    const res = await GET(makeRequest("test-cron-secret"));
    expect(res.status).toBe(200);
    expect(mockSendNotification).toHaveBeenCalled();
  });

  it("should not send reminder when vitamin already checked today", async () => {
    const familyDocs = [{ id: "fam1" }];

    mockCollection.mockImplementation((name: string) => {
      if (name === "families") {
        return { get: vi.fn().mockResolvedValue({ docs: familyDocs }) } as never;
      }
      if (name === "vitamins") {
        return {
          where: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue({ docs: [{ id: "v1" }] }), // already checked
            }),
          }),
        } as never;
      }
      return { get: vi.fn().mockResolvedValue({ docs: [] }) } as never;
    });

    const res = await GET(makeRequest("test-cron-secret"));
    expect(res.status).toBe(200);
    expect(mockSendNotification).not.toHaveBeenCalled();
  });
});
