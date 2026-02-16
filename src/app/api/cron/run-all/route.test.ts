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
  return new NextRequest("http://localhost:3000/api/cron/run-all", {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });
}

describe("GET /api/cron/run-all", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", "test-secret");
    mockSendNotification.mockResolvedValue({ sent: 1, failed: 0 });
  });

  it("should return 401 without authorization header", async () => {
    const res = await GET(new NextRequest("http://localhost:3000/api/cron/run-all"));
    expect(res.status).toBe(401);
  });

  it("should return 401 with wrong secret", async () => {
    const res = await GET(makeRequest("wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("should return 401 when CRON_SECRET is not set", async () => {
    vi.stubEnv("CRON_SECRET", "");
    const res = await GET(makeRequest("any-secret"));
    expect(res.status).toBe(401);
  });

  it("should run agenda reminders and vitamin reminders together", async () => {
    const now = new Date();
    const eventStart = new Date(now.getTime() + 15 * 60 * 1000);
    const eventDate = `${eventStart.getFullYear()}-${String(eventStart.getMonth() + 1).padStart(2, "0")}-${String(eventStart.getDate()).padStart(2, "0")}`;
    const eventTime = `${String(eventStart.getHours()).padStart(2, "0")}:${String(eventStart.getMinutes()).padStart(2, "0")}`;

    mockCollection.mockImplementation((name: string) => {
      if (name === "agendaEvents") {
        return {
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({
              docs: [
                {
                  id: "evt1",
                  data: () => ({
                    familyId: "fam1",
                    title: "Tandarts",
                    date: eventDate,
                    startTime: eventTime,
                    allDay: false,
                    reminder: "15",
                  }),
                },
              ],
            }),
          }),
        } as never;
      }
      if (name === "klusjes") {
        return {
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ docs: [] }),
          }),
        } as never;
      }
      if (name === "sentReminders") {
        return {
          doc: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ exists: false }),
            set: vi.fn().mockResolvedValue(undefined),
          }),
        } as never;
      }
      if (name === "families") {
        return {
          get: vi.fn().mockResolvedValue({ docs: [{ id: "fam1" }] }),
        } as never;
      }
      if (name === "vitamins") {
        return {
          where: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue({ docs: [] }), // no vitamin check today
            }),
          }),
        } as never;
      }
      return {} as never;
    });

    const res = await GET(makeRequest("test-secret"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("agendaReminded");
    expect(data).toHaveProperty("vitaminReminded");
  });

  it("should return results even when no reminders are due", async () => {
    mockCollection.mockImplementation((name: string) => {
      if (name === "agendaEvents") {
        return {
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ docs: [] }),
          }),
        } as never;
      }
      if (name === "klusjes") {
        return {
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ docs: [] }),
          }),
        } as never;
      }
      if (name === "families") {
        return {
          get: vi.fn().mockResolvedValue({ docs: [] }),
        } as never;
      }
      return {} as never;
    });

    const res = await GET(makeRequest("test-secret"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.agendaReminded).toBe(0);
    expect(data.vitaminReminded).toBe(0);
  });

  it("should return 500 when an error occurs", async () => {
    mockCollection.mockImplementation(() => {
      throw new Error("Firestore down");
    });

    const res = await GET(makeRequest("test-secret"));
    expect(res.status).toBe(500);
  });
});
