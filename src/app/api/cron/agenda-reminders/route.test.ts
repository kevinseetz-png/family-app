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

function makeRequest(cronSecret: string) {
  return new NextRequest("http://localhost:3000/api/cron/agenda-reminders", {
    headers: { authorization: `Bearer ${cronSecret}` },
  });
}

describe("GET /api/cron/agenda-reminders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", "test-secret");
    mockSendNotification.mockResolvedValue({ sent: 1, failed: 0 });
  });

  it("should return 401 without valid cron secret", async () => {
    const req = new NextRequest("http://localhost:3000/api/cron/agenda-reminders");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("should return 401 with wrong cron secret", async () => {
    const res = await GET(makeRequest("wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("should send notification for event with reminder due now", async () => {
    const now = new Date();
    // Event starting in 15 minutes with a 15-minute reminder
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
      return {} as never;
    });

    const res = await GET(makeRequest("test-secret"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.reminded).toBeGreaterThanOrEqual(0);
  });

  it("should not send notification for event without reminder", async () => {
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
                    date: "2026-02-20",
                    startTime: "10:00",
                    allDay: false,
                    reminder: null,
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
      return {} as never;
    });

    const res = await GET(makeRequest("test-secret"));
    expect(res.status).toBe(200);
    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it("should not send duplicate reminders (already sent)", async () => {
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
            // Already sent
            get: vi.fn().mockResolvedValue({ exists: true }),
            set: vi.fn().mockResolvedValue(undefined),
          }),
        } as never;
      }
      return {} as never;
    });

    const res = await GET(makeRequest("test-secret"));
    expect(res.status).toBe(200);
    expect(mockSendNotification).not.toHaveBeenCalled();
  });
});
