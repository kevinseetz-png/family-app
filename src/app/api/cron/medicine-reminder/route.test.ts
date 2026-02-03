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
  return new NextRequest("http://localhost:3000/api/cron/medicine-reminder", {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });
}

describe("GET /api/cron/medicine-reminder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", "test-cron-secret");
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

  it("should send reminder for unchecked medicines at reminder time", async () => {
    const currentHour = new Date().getUTCHours();
    const currentMinute = new Date().getUTCMinutes();

    const mockMedicines = [
      {
        id: "med1",
        data: () => ({
          familyId: "fam1",
          name: "Paracetamol",
          reminderHour: currentHour,
          reminderMinute: currentMinute,
          active: true,
        }),
      },
    ];

    const medicinesWhere = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ docs: mockMedicines }),
        }),
      }),
    });

    const checksWhere = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ docs: [], empty: true }),
        }),
      }),
    });

    mockCollection.mockImplementation((name: string) => {
      if (name === "medicines") {
        return { where: medicinesWhere } as never;
      }
      if (name === "medicine_checks") {
        return { where: checksWhere } as never;
      }
      return {} as never;
    });

    mockSendNotification.mockResolvedValue({ sent: 1, failed: 0 });

    const res = await GET(makeRequest("test-cron-secret"));
    expect(res.status).toBe(200);
    expect(mockSendNotification).toHaveBeenCalledWith(
      "fam1",
      expect.objectContaining({
        title: "Medicijn herinnering",
        body: expect.stringContaining("Paracetamol"),
        type: "medicine_reminder",
      })
    );
  });

  it("should not send reminder for already checked medicines", async () => {
    const currentHour = new Date().getUTCHours();
    const currentMinute = new Date().getUTCMinutes();

    const mockMedicines = [
      {
        id: "med1",
        data: () => ({
          familyId: "fam1",
          name: "Paracetamol",
          reminderHour: currentHour,
          reminderMinute: currentMinute,
          active: true,
        }),
      },
    ];

    const mockChecks = [{ id: "check1" }];

    const medicinesWhere = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ docs: mockMedicines }),
        }),
      }),
    });

    const checksWhere = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ docs: mockChecks, empty: false }),
        }),
      }),
    });

    mockCollection.mockImplementation((name: string) => {
      if (name === "medicines") {
        return { where: medicinesWhere } as never;
      }
      if (name === "medicine_checks") {
        return { where: checksWhere } as never;
      }
      return {} as never;
    });

    const res = await GET(makeRequest("test-cron-secret"));
    expect(res.status).toBe(200);
    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it("should not send reminder for inactive medicines", async () => {
    const medicinesWhere = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ docs: [] }),
        }),
      }),
    });

    mockCollection.mockImplementation((name: string) => {
      if (name === "medicines") {
        return { where: medicinesWhere } as never;
      }
      return {} as never;
    });

    const res = await GET(makeRequest("test-cron-secret"));
    expect(res.status).toBe(200);
    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it("should handle multiple medicines for different families", async () => {
    const currentHour = new Date().getUTCHours();
    const currentMinute = new Date().getUTCMinutes();

    const mockMedicines = [
      {
        id: "med1",
        data: () => ({
          familyId: "fam1",
          name: "Paracetamol",
          reminderHour: currentHour,
          reminderMinute: currentMinute,
          active: true,
        }),
      },
      {
        id: "med2",
        data: () => ({
          familyId: "fam2",
          name: "Ibuprofen",
          reminderHour: currentHour,
          reminderMinute: currentMinute,
          active: true,
        }),
      },
    ];

    const medicinesWhere = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ docs: mockMedicines }),
        }),
      }),
    });

    const checksWhere = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ docs: [], empty: true }),
        }),
      }),
    });

    mockCollection.mockImplementation((name: string) => {
      if (name === "medicines") {
        return { where: medicinesWhere } as never;
      }
      if (name === "medicine_checks") {
        return { where: checksWhere } as never;
      }
      return {} as never;
    });

    mockSendNotification.mockResolvedValue({ sent: 1, failed: 0 });

    const res = await GET(makeRequest("test-cron-secret"));
    expect(res.status).toBe(200);
    expect(mockSendNotification).toHaveBeenCalledTimes(2);
  });
});
