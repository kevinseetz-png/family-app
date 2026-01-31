import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/push", () => ({
  sendNotificationToFamily: vi.fn(),
}));

import { POST } from "./route";
import { sendNotificationToFamily } from "@/lib/push";

const mockSendNotificationToFamily = vi.mocked(sendNotificationToFamily);

function makeRequest(body?: unknown, headers?: Record<string, string>) {
  return new NextRequest("http://localhost:3000/api/notifications/send", {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

describe("POST /api/notifications/send", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", "test-cron-secret");
  });

  it("should return 401 without CRON_SECRET header", async () => {
    const res = await POST(makeRequest({ familyId: "fam1", type: "feeding_reminder", title: "Test", body: "Test" }));
    expect(res.status).toBe(401);
  });

  it("should return 400 with missing fields", async () => {
    const res = await POST(makeRequest(
      { familyId: "fam1" },
      { authorization: "Bearer test-cron-secret" }
    ));
    expect(res.status).toBe(400);
  });

  it("should send notification and return 200", async () => {
    mockSendNotificationToFamily.mockResolvedValue({ sent: 2, failed: 0 });

    const res = await POST(makeRequest(
      {
        familyId: "fam1",
        type: "feeding_reminder",
        title: "Feeding Reminder",
        body: "Last feeding was 4 hours ago",
      },
      { authorization: "Bearer test-cron-secret" }
    ));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.sent).toBe(2);
  });
});
