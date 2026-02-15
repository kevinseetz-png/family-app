import { describe, it, expect } from "vitest";
import {
  agendaEventSchema,
  agendaEventUpdateSchema,
  agendaEventDeleteSchema,
} from "./validation";

describe("agendaEventSchema", () => {
  const validEvent = {
    title: "Feestje",
    category: "familie" as const,
    date: "2026-03-15",
    startTime: null,
    endTime: null,
    allDay: true,
  };

  it("accepts valid event", () => {
    const result = agendaEventSchema.safeParse(validEvent);
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const result = agendaEventSchema.safeParse({ ...validEvent, title: "" });
    expect(result.success).toBe(false);
  });

  it("accepts birthdayGroup for verjaardag events", () => {
    const result = agendaEventSchema.safeParse({
      ...validEvent,
      category: "verjaardag",
      birthdayGroup: "Familie",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.birthdayGroup).toBe("Familie");
    }
  });

  it("defaults birthdayGroup to null when omitted", () => {
    const result = agendaEventSchema.safeParse(validEvent);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.birthdayGroup).toBeNull();
    }
  });

  it("accepts null birthdayGroup", () => {
    const result = agendaEventSchema.safeParse({
      ...validEvent,
      birthdayGroup: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects birthdayGroup longer than 50 characters", () => {
    const result = agendaEventSchema.safeParse({
      ...validEvent,
      birthdayGroup: "a".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("accepts birthYear for verjaardag events", () => {
    const result = agendaEventSchema.safeParse({
      ...validEvent,
      category: "verjaardag",
      birthYear: 1990,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.birthYear).toBe(1990);
    }
  });

  it("defaults birthYear to null when omitted", () => {
    const result = agendaEventSchema.safeParse(validEvent);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.birthYear).toBeNull();
    }
  });

  it("accepts null birthYear", () => {
    const result = agendaEventSchema.safeParse({
      ...validEvent,
      birthYear: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects birthYear before 1900", () => {
    const result = agendaEventSchema.safeParse({
      ...validEvent,
      birthYear: 1899,
    });
    expect(result.success).toBe(false);
  });

  it("rejects birthYear after 2100", () => {
    const result = agendaEventSchema.safeParse({
      ...validEvent,
      birthYear: 2101,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer birthYear", () => {
    const result = agendaEventSchema.safeParse({
      ...validEvent,
      birthYear: 1990.5,
    });
    expect(result.success).toBe(false);
  });
});

describe("agendaEventUpdateSchema", () => {
  it("accepts update with birthdayGroup", () => {
    const result = agendaEventUpdateSchema.safeParse({
      id: "event1",
      birthdayGroup: "Vrienden",
    });
    expect(result.success).toBe(true);
  });

  it("accepts update with birthYear", () => {
    const result = agendaEventUpdateSchema.safeParse({
      id: "event1",
      birthYear: 1985,
    });
    expect(result.success).toBe(true);
  });

  it("accepts update with null birthdayGroup", () => {
    const result = agendaEventUpdateSchema.safeParse({
      id: "event1",
      birthdayGroup: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts update with null birthYear", () => {
    const result = agendaEventUpdateSchema.safeParse({
      id: "event1",
      birthYear: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("agendaEventDeleteSchema", () => {
  it("accepts valid delete", () => {
    const result = agendaEventDeleteSchema.safeParse({ id: "event1" });
    expect(result.success).toBe(true);
  });

  it("rejects empty id", () => {
    const result = agendaEventDeleteSchema.safeParse({ id: "" });
    expect(result.success).toBe(false);
  });
});
