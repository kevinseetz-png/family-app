import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { FeedingSummary } from "./FeedingSummary";

describe("FeedingSummary", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should show dash when no last feeding timestamp", () => {
    render(<FeedingSummary feedingCount={0} lastFeedingTimestamp={null} />);
    expect(screen.getByLabelText("No feeding recorded")).toBeTruthy();
  });

  it("should show feeding count", () => {
    render(<FeedingSummary feedingCount={5} lastFeedingTimestamp={null} />);
    expect(screen.getByText("5 feedings")).toBeTruthy();
  });

  it("should show singular 'feeding' for count of 1", () => {
    render(<FeedingSummary feedingCount={1} lastFeedingTimestamp={null} />);
    expect(screen.getByText("1 feeding")).toBeTruthy();
  });

  it("should show minutes ago for recent feeding", () => {
    const now = new Date("2025-01-15T12:00:00Z");
    vi.setSystemTime(now);
    const tenMinutesAgo = new Date("2025-01-15T11:50:00Z");
    render(<FeedingSummary feedingCount={1} lastFeedingTimestamp={tenMinutesAgo} />);
    expect(screen.getByText("10m ago")).toBeTruthy();
  });

  it("should show hours and minutes for older feeding", () => {
    const now = new Date("2025-01-15T12:00:00Z");
    vi.setSystemTime(now);
    const twoHoursAgo = new Date("2025-01-15T09:30:00Z");
    render(<FeedingSummary feedingCount={1} lastFeedingTimestamp={twoHoursAgo} />);
    expect(screen.getByText("2h 30m ago")).toBeTruthy();
  });

  it("should show time since yesterday's feeding across midnight", () => {
    const now = new Date("2025-01-15T01:00:00Z");
    vi.setSystemTime(now);
    const yesterday = new Date("2025-01-14T22:00:00Z");
    render(<FeedingSummary feedingCount={0} lastFeedingTimestamp={yesterday} />);
    expect(screen.getByText("3h 0m ago")).toBeTruthy();
  });

  it("should update the timer after 60 seconds", () => {
    const now = new Date("2025-01-15T12:00:00Z");
    vi.setSystemTime(now);
    const fiveMinutesAgo = new Date("2025-01-15T11:55:00Z");
    render(<FeedingSummary feedingCount={1} lastFeedingTimestamp={fiveMinutesAgo} />);
    expect(screen.getByText("5m ago")).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByText("6m ago")).toBeTruthy();
  });

  it("should clean up interval on unmount", () => {
    const clearSpy = vi.spyOn(global, "clearInterval");
    const now = new Date("2025-01-15T12:00:00Z");
    vi.setSystemTime(now);
    const { unmount } = render(
      <FeedingSummary feedingCount={1} lastFeedingTimestamp={new Date("2025-01-15T11:50:00Z")} />
    );
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
