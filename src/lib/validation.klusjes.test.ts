import { describe, it, expect } from "vitest";
import {
  klusjesSchema,
  klusjesUpdateSchema,
  klusjesDeleteSchema,
  agendaEventSchema,
  agendaEventUpdateSchema,
} from "./validation";

describe("klusjesSchema", () => {
  it("accepts valid klusje with name only", () => {
    const result = klusjesSchema.safeParse({ name: "Stofzuigen" });
    expect(result.success).toBe(true);
  });

  it("accepts klusje with date and recurrence", () => {
    const result = klusjesSchema.safeParse({
      name: "Stofzuigen",
      date: "2026-02-10",
      recurrence: "weekly",
    });
    expect(result.success).toBe(true);
  });

  it("accepts klusje with null date", () => {
    const result = klusjesSchema.safeParse({
      name: "Stofzuigen",
      date: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid date format", () => {
    const result = klusjesSchema.safeParse({
      name: "Stofzuigen",
      date: "10-02-2026",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid recurrence value", () => {
    const result = klusjesSchema.safeParse({
      name: "Stofzuigen",
      recurrence: "yearly",
    });
    expect(result.success).toBe(false);
  });

  it("defaults recurrence to none when omitted", () => {
    const result = klusjesSchema.safeParse({ name: "Stofzuigen" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.recurrence).toBe("none");
    }
  });

  it("defaults date to null when omitted", () => {
    const result = klusjesSchema.safeParse({ name: "Stofzuigen" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.date).toBeNull();
    }
  });

  it("rejects empty name", () => {
    const result = klusjesSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Name is required");
    }
  });

  it("rejects missing name", () => {
    const result = klusjesSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects name that is too long", () => {
    const result = klusjesSchema.safeParse({ name: "a".repeat(201) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Name is too long");
    }
  });

  it("accepts name at max length", () => {
    const result = klusjesSchema.safeParse({ name: "a".repeat(200) });
    expect(result.success).toBe(true);
  });

  it("trims whitespace from name", () => {
    const result = klusjesSchema.safeParse({ name: "  Stofzuigen  " });
    expect(result.success).toBe(true);
  });

  it("defaults priority to 2 when omitted", () => {
    const result = klusjesSchema.safeParse({ name: "Stofzuigen" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe(2);
    }
  });

  it("accepts priority values 1, 2, 3", () => {
    for (const priority of [1, 2, 3]) {
      const result = klusjesSchema.safeParse({ name: "Test", priority });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid priority values", () => {
    const result = klusjesSchema.safeParse({ name: "Test", priority: 4 });
    expect(result.success).toBe(false);
  });

  it("rejects priority value 0", () => {
    const result = klusjesSchema.safeParse({ name: "Test", priority: 0 });
    expect(result.success).toBe(false);
  });

  it("defaults endDate to null when omitted", () => {
    const result = klusjesSchema.safeParse({ name: "Stofzuigen" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.endDate).toBeNull();
    }
  });

  it("accepts valid endDate", () => {
    const result = klusjesSchema.safeParse({
      name: "Stofzuigen",
      endDate: "2026-03-15",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.endDate).toBe("2026-03-15");
    }
  });

  it("accepts null endDate", () => {
    const result = klusjesSchema.safeParse({
      name: "Stofzuigen",
      endDate: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid endDate format", () => {
    const result = klusjesSchema.safeParse({
      name: "Stofzuigen",
      endDate: "15-03-2026",
    });
    expect(result.success).toBe(false);
  });
});

describe("klusjesUpdateSchema", () => {
  it("accepts valid update with id and status", () => {
    const result = klusjesUpdateSchema.safeParse({
      id: "klusje123",
      status: "klaar",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid status values", () => {
    for (const status of ["todo", "bezig", "klaar"]) {
      const result = klusjesUpdateSchema.safeParse({ id: "klusje123", status });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid status value", () => {
    const result = klusjesUpdateSchema.safeParse({
      id: "klusje123",
      status: "done",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing id", () => {
    const result = klusjesUpdateSchema.safeParse({ status: "klaar" });
    expect(result.success).toBe(false);
  });

  it("accepts missing status (for date-only updates)", () => {
    const result = klusjesUpdateSchema.safeParse({ id: "klusje123" });
    expect(result.success).toBe(true);
  });

  it("rejects empty id", () => {
    const result = klusjesUpdateSchema.safeParse({ id: "", status: "klaar" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid request");
    }
  });

  it("accepts update with completionDate for recurring items", () => {
    const result = klusjesUpdateSchema.safeParse({
      id: "klusje123",
      status: "klaar",
      completionDate: "2026-02-10",
    });
    expect(result.success).toBe(true);
  });

  it("accepts update with optional date field", () => {
    const result = klusjesUpdateSchema.safeParse({
      id: "klusje123",
      status: "todo",
      date: "2026-02-15",
    });
    expect(result.success).toBe(true);
  });

  it("accepts update with optional recurrence field", () => {
    const result = klusjesUpdateSchema.safeParse({
      id: "klusje123",
      status: "todo",
      recurrence: "weekly",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid completionDate format", () => {
    const result = klusjesUpdateSchema.safeParse({
      id: "klusje123",
      status: "klaar",
      completionDate: "10/02/2026",
    });
    expect(result.success).toBe(false);
  });

  it("accepts update with optional priority field", () => {
    const result = klusjesUpdateSchema.safeParse({
      id: "klusje123",
      status: "todo",
      priority: 1,
    });
    expect(result.success).toBe(true);
  });

  it("accepts update with optional endDate field", () => {
    const result = klusjesUpdateSchema.safeParse({
      id: "klusje123",
      endDate: "2026-04-01",
    });
    expect(result.success).toBe(true);
  });

  it("accepts update with null endDate (remove end date)", () => {
    const result = klusjesUpdateSchema.safeParse({
      id: "klusje123",
      endDate: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("klusjesSchema — reminder", () => {
  it("defaults reminder to null when omitted", () => {
    const result = klusjesSchema.safeParse({ name: "Stofzuigen" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reminder).toBeNull();
    }
  });

  it("accepts valid reminder value", () => {
    for (const reminder of ["0", "5", "15", "30", "60", "1440"]) {
      const result = klusjesSchema.safeParse({ name: "Test", reminder });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid reminder value", () => {
    const result = klusjesSchema.safeParse({ name: "Test", reminder: "10" });
    expect(result.success).toBe(false);
  });

  it("accepts null reminder", () => {
    const result = klusjesSchema.safeParse({ name: "Test", reminder: null });
    expect(result.success).toBe(true);
  });
});

describe("klusjesUpdateSchema — reminder", () => {
  it("accepts update with reminder field", () => {
    const result = klusjesUpdateSchema.safeParse({
      id: "klusje123",
      reminder: "15",
    });
    expect(result.success).toBe(true);
  });

  it("accepts update with null reminder (remove alarm)", () => {
    const result = klusjesUpdateSchema.safeParse({
      id: "klusje123",
      reminder: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("agendaEventSchema — reminder", () => {
  const validEvent = {
    title: "Tandarts",
    category: "gezondheid",
    date: "2026-02-20",
    startTime: "10:00",
    endTime: "10:30",
    allDay: false,
  };

  it("defaults reminder to null when omitted", () => {
    const result = agendaEventSchema.safeParse(validEvent);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reminder).toBeNull();
    }
  });

  it("accepts valid reminder values", () => {
    for (const reminder of ["0", "5", "15", "30", "60", "1440"]) {
      const result = agendaEventSchema.safeParse({ ...validEvent, reminder });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid reminder value", () => {
    const result = agendaEventSchema.safeParse({ ...validEvent, reminder: "10" });
    expect(result.success).toBe(false);
  });

  it("accepts null reminder", () => {
    const result = agendaEventSchema.safeParse({ ...validEvent, reminder: null });
    expect(result.success).toBe(true);
  });
});

describe("agendaEventUpdateSchema — reminder", () => {
  it("accepts update with reminder", () => {
    const result = agendaEventUpdateSchema.safeParse({
      id: "evt1",
      reminder: "30",
    });
    expect(result.success).toBe(true);
  });

  it("accepts update with null reminder", () => {
    const result = agendaEventUpdateSchema.safeParse({
      id: "evt1",
      reminder: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("klusjesDeleteSchema", () => {
  it("accepts valid delete with id", () => {
    const result = klusjesDeleteSchema.safeParse({ id: "klusje123" });
    expect(result.success).toBe(true);
  });

  it("rejects missing id", () => {
    const result = klusjesDeleteSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty id", () => {
    const result = klusjesDeleteSchema.safeParse({ id: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid request");
    }
  });
});
