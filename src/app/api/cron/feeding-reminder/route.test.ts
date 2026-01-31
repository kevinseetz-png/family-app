import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
  return new NextRequest("http://localhost:3000/api/cron/feeding-reminder", {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });
}

describe("GET /api/cron/feeding-reminder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", "test-cron-secret");
    vi.useFakeTimers();
    // Set time to 12:00 noon (outside quiet hours)
    vi.setSystemTime(new Date("2025-06-15T12:00:00+02:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return 401 without valid cron secret", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("should return 401 with wrong cron secret", async () => {
    const res = await GET(makeRequest("wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("should skip during quiet hours (22:00-07:00)", async () => {
    vi.setSystemTime(new Date("2025-06-15T23:00:00+02:00"));

    const res = await GET(makeRequest("test-cron-secret"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.skipped).toBe("quiet_hours");
    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it("should send reminders for families with old feedings", async () => {
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);

    // Mock families collection
    const familyDocs = [{ id: "fam1" }];
    // Mock feedings - last feeding > 4h ago
    const feedingDocs = [{
      data: () => ({
        timestamp: { toDate: () => fiveHoursAgo },
        familyId: "fam1",
      }),
    }];

    mockCollection.mockImplementation((name: string) => {
      if (name === "families") {
        return {
          get: vi.fn().mockResolvedValue({ docs: familyDocs }),
        } as never;
      }
      if (name === "feedings") {
        return {
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                get: vi.fn().mockResolvedValue({ docs: feedingDocs }),
              }),
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

  it("should not send reminders when feedings are recent", async () => {
    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);

    const familyDocs = [{ id: "fam1" }];
    const feedingDocs = [{
      data: () => ({
        timestamp: { toDate: () => oneHourAgo },
        familyId: "fam1",
      }),
    }];

    mockCollection.mockImplementation((name: string) => {
      if (name === "families") {
        return { get: vi.fn().mockResolvedValue({ docs: familyDocs }) } as never;
      }
      if (name === "feedings") {
        return {
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                get: vi.fn().mockResolvedValue({ docs: feedingDocs }),
              }),
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
