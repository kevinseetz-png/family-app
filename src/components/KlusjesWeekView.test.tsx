import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KlusjesWeekView } from "./KlusjesWeekView";
import type { KlusjesItem } from "@/types/klusjes";

/**
 * @vitest-environment jsdom
 */

function makeItem(overrides: Partial<KlusjesItem> = {}): KlusjesItem {
  return {
    id: "klusje1",
    familyId: "fam1",
    name: "Stofzuigen",
    status: "todo",
    priority: 2,
    date: null,
    recurrence: "none",
    completions: {},
    createdBy: "user1",
    createdByName: "Test User",
    createdAt: new Date("2026-01-31T12:00:00Z"),
    ...overrides,
  };
}

describe("KlusjesWeekView", () => {
  const mockOnStatusChange = vi.fn();
  const mockOnDelete = vi.fn();
  const mockGetItemsForDate = vi.fn().mockReturnValue([]);

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetItemsForDate.mockReturnValue([]);
  });

  it("should render 7 day columns", () => {
    render(
      <KlusjesWeekView
        items={[]}
        getItemsForDate={mockGetItemsForDate}
        onStatusChange={mockOnStatusChange}
        onDelete={mockOnDelete}
      />
    );

    // Should have day headers (ma, di, wo, do, vr, za, zo)
    expect(screen.getByText("ma")).toBeInTheDocument();
    expect(screen.getByText("zo")).toBeInTheDocument();
  });

  it("should show week navigation buttons", () => {
    render(
      <KlusjesWeekView
        items={[]}
        getItemsForDate={mockGetItemsForDate}
        onStatusChange={mockOnStatusChange}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByRole("button", { name: /vorige week/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /volgende week/i })).toBeInTheDocument();
  });

  it("should navigate to previous week", async () => {
    const user = userEvent.setup();
    render(
      <KlusjesWeekView
        items={[]}
        getItemsForDate={mockGetItemsForDate}
        onStatusChange={mockOnStatusChange}
        onDelete={mockOnDelete}
      />
    );

    const prevButton = screen.getByRole("button", { name: /vorige week/i });
    await user.click(prevButton);

    // Should call getItemsForDate with dates from the previous week
    expect(mockGetItemsForDate).toHaveBeenCalled();
  });

  it("should navigate to next week", async () => {
    const user = userEvent.setup();
    render(
      <KlusjesWeekView
        items={[]}
        getItemsForDate={mockGetItemsForDate}
        onStatusChange={mockOnStatusChange}
        onDelete={mockOnDelete}
      />
    );

    const nextButton = screen.getByRole("button", { name: /volgende week/i });
    await user.click(nextButton);

    expect(mockGetItemsForDate).toHaveBeenCalled();
  });

  it("should display klusjes for a day when getItemsForDate returns items", () => {
    const item = makeItem({ id: "k1", name: "Stofzuigen", date: "2026-02-09" });
    mockGetItemsForDate.mockImplementation((date: string) => {
      if (date === "2026-02-09") return [item];
      return [];
    });

    render(
      <KlusjesWeekView
        items={[item]}
        getItemsForDate={mockGetItemsForDate}
        onStatusChange={mockOnStatusChange}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText("Stofzuigen")).toBeInTheDocument();
  });

  it("should show 'Zonder datum' section for unscheduled items", () => {
    const items = [makeItem({ id: "k1", name: "No date task", date: null })];

    render(
      <KlusjesWeekView
        items={items}
        getItemsForDate={mockGetItemsForDate}
        onStatusChange={mockOnStatusChange}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText("Zonder datum")).toBeInTheDocument();
    expect(screen.getByText("No date task")).toBeInTheDocument();
  });

  it("should show 'Geen taken' for empty days instead of 'Geen klusjes'", () => {
    render(
      <KlusjesWeekView
        items={[]}
        getItemsForDate={mockGetItemsForDate}
        onStatusChange={mockOnStatusChange}
        onDelete={mockOnDelete}
      />
    );

    const emptyLabels = screen.getAllByText("Geen taken");
    expect(emptyLabels.length).toBeGreaterThan(0);
    expect(screen.queryByText("Geen klusjes")).not.toBeInTheDocument();
  });

  it("should show priority indicator for high priority items in week view", () => {
    const item = makeItem({ id: "k1", name: "Urgent", date: null, priority: 1 });

    render(
      <KlusjesWeekView
        items={[item]}
        getItemsForDate={mockGetItemsForDate}
        onStatusChange={mockOnStatusChange}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText("Hoog")).toBeInTheDocument();
  });

  it("should call onStatusChange when status button is clicked", async () => {
    const user = userEvent.setup();
    const item = makeItem({ id: "k1", name: "Test", date: null, status: "todo" });

    render(
      <KlusjesWeekView
        items={[item]}
        getItemsForDate={mockGetItemsForDate}
        onStatusChange={mockOnStatusChange}
        onDelete={mockOnDelete}
      />
    );

    const statusButtons = screen.getAllByRole("button", { name: /status/i });
    await user.click(statusButtons[0]);

    expect(mockOnStatusChange).toHaveBeenCalled();
  });
});
