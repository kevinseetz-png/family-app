import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(),
  },
}));

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: vi.fn(),
  },
}));

vi.mock("@/lib/vapid", () => ({
  VAPID_PUBLIC_KEY: "test-public-key",
  VAPID_PRIVATE_KEY: "test-private-key",
  VAPID_SUBJECT: "mailto:test@test.com",
}));

import { sendNotificationToFamily } from "./push";
import webpush from "web-push";
import { adminDb } from "@/lib/firebase-admin";

const mockSendNotification = vi.mocked(webpush.sendNotification);
const mockCollection = vi.mocked(adminDb.collection);

describe("sendNotificationToFamily", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should send notifications to all subscriptions for a family", async () => {
    const subDocs = [
      {
        id: "sub1",
        data: () => ({
          endpoint: "https://fcm.googleapis.com/1",
          keys: { auth: "a1", p256dh: "p1" },
          userId: "u1",
          familyActivity: true,
          feedingReminders: true,
          vitaminReminders: true,
        }),
        ref: { delete: vi.fn() },
      },
      {
        id: "sub2",
        data: () => ({
          endpoint: "https://fcm.googleapis.com/2",
          keys: { auth: "a2", p256dh: "p2" },
          userId: "u2",
          familyActivity: true,
          feedingReminders: true,
          vitaminReminders: true,
        }),
        ref: { delete: vi.fn() },
      },
    ];

    mockCollection.mockReturnValue({
      where: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({ docs: subDocs }),
      }),
    } as never);

    mockSendNotification.mockResolvedValue({} as never);

    const result = await sendNotificationToFamily("fam1", {
      title: "Test",
      body: "Test body",
      type: "family_activity",
    });

    expect(result.sent).toBe(2);
    expect(result.failed).toBe(0);
    expect(mockSendNotification).toHaveBeenCalledTimes(2);
  });

  it("should exclude a specific user when excludeUserId is provided", async () => {
    const subDocs = [
      {
        id: "sub1",
        data: () => ({
          endpoint: "https://fcm.googleapis.com/1",
          keys: { auth: "a1", p256dh: "p1" },
          userId: "u1",
          familyActivity: true,
          feedingReminders: true,
          vitaminReminders: true,
        }),
        ref: { delete: vi.fn() },
      },
      {
        id: "sub2",
        data: () => ({
          endpoint: "https://fcm.googleapis.com/2",
          keys: { auth: "a2", p256dh: "p2" },
          userId: "u2",
          familyActivity: true,
          feedingReminders: true,
          vitaminReminders: true,
        }),
        ref: { delete: vi.fn() },
      },
    ];

    mockCollection.mockReturnValue({
      where: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({ docs: subDocs }),
      }),
    } as never);

    mockSendNotification.mockResolvedValue({} as never);

    const result = await sendNotificationToFamily("fam1", {
      title: "Test",
      body: "Test body",
      type: "family_activity",
    }, "u1");

    expect(result.sent).toBe(1);
    expect(mockSendNotification).toHaveBeenCalledTimes(1);
  });

  it("should clean up expired subscriptions on 410 error", async () => {
    const mockDeleteFn = vi.fn().mockResolvedValue(undefined);
    const subDocs = [
      {
        id: "sub1",
        data: () => ({
          endpoint: "https://fcm.googleapis.com/1",
          keys: { auth: "a1", p256dh: "p1" },
          userId: "u1",
          familyActivity: true,
          feedingReminders: true,
          vitaminReminders: true,
        }),
        ref: { delete: mockDeleteFn },
      },
    ];

    mockCollection.mockReturnValue({
      where: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({ docs: subDocs }),
      }),
    } as never);

    mockSendNotification.mockRejectedValue({ statusCode: 410 });

    const result = await sendNotificationToFamily("fam1", {
      title: "Test",
      body: "Test body",
      type: "family_activity",
    });

    expect(result.failed).toBe(1);
    expect(mockDeleteFn).toHaveBeenCalled();
  });

  it("should respect notification preference for type", async () => {
    const subDocs = [
      {
        id: "sub1",
        data: () => ({
          endpoint: "https://fcm.googleapis.com/1",
          keys: { auth: "a1", p256dh: "p1" },
          userId: "u1",
          familyActivity: false, // opted out
          feedingReminders: true,
          vitaminReminders: true,
        }),
        ref: { delete: vi.fn() },
      },
    ];

    mockCollection.mockReturnValue({
      where: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({ docs: subDocs }),
      }),
    } as never);

    const result = await sendNotificationToFamily("fam1", {
      title: "Test",
      body: "Test body",
      type: "family_activity",
    });

    expect(result.sent).toBe(0);
    expect(mockSendNotification).not.toHaveBeenCalled();
  });
});
