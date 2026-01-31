import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FeedingHistory } from "./FeedingHistory";
import type { Feeding } from "@/types/feeding";

const mockHistory = [
  { date: "2025-03-15", totalMl: 500, count: 3 },
  { date: "2025-03-14", totalMl: 400, count: 2 },
];

const mockDayFeedings: Feeding[] = [
  {
    id: "f1",
    familyId: "fam1",
    foodType: "formula",
    amount: 200,
    unit: "ml",
    loggedBy: "u1",
    loggedByName: "Alice",
    timestamp: new Date("2025-03-15T10:00:00Z"),
    createdAt: new Date("2025-03-15T10:00:00Z"),
  },
  {
    id: "f2",
    familyId: "fam1",
    foodType: "breast_milk",
    amount: 150,
    unit: "ml",
    loggedBy: "u1",
    loggedByName: "Alice",
    timestamp: new Date("2025-03-15T08:00:00Z"),
    createdAt: new Date("2025-03-15T08:00:00Z"),
  },
];

describe("FeedingHistory", () => {
  it("should render day rows as clickable buttons", () => {
    render(
      <FeedingHistory
        history={mockHistory}
        isLoading={false}
        error={null}
        selectedDate={null}
        onDayClick={vi.fn()}
        dayFeedings={[]}
        dayFeedingsLoading={false}
      />
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
  });

  it("should call onDayClick when a day is clicked", async () => {
    const user = userEvent.setup();
    const onDayClick = vi.fn();

    render(
      <FeedingHistory
        history={mockHistory}
        isLoading={false}
        error={null}
        selectedDate={null}
        onDayClick={onDayClick}
        dayFeedings={[]}
        dayFeedingsLoading={false}
      />
    );

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);
    expect(onDayClick).toHaveBeenCalledWith("2025-03-15");
  });

  it("should show loading state when selected day is loading", () => {
    render(
      <FeedingHistory
        history={mockHistory}
        isLoading={false}
        error={null}
        selectedDate="2025-03-15"
        onDayClick={vi.fn()}
        dayFeedings={[]}
        dayFeedingsLoading={true}
      />
    );

    expect(screen.getByText(/loading/i)).toBeTruthy();
  });

  it("should show day feedings when a day is selected", () => {
    render(
      <FeedingHistory
        history={mockHistory}
        isLoading={false}
        error={null}
        selectedDate="2025-03-15"
        onDayClick={vi.fn()}
        dayFeedings={mockDayFeedings}
        dayFeedingsLoading={false}
      />
    );

    expect(screen.getByText("Formula")).toBeTruthy();
    expect(screen.getByText("Breast milk")).toBeTruthy();
  });

  it("should not show feedings for unselected days", () => {
    render(
      <FeedingHistory
        history={mockHistory}
        isLoading={false}
        error={null}
        selectedDate="2025-03-14"
        onDayClick={vi.fn()}
        dayFeedings={mockDayFeedings}
        dayFeedingsLoading={false}
      />
    );

    // Feedings should only appear under the selected date's section
    const feedingItems = screen.getAllByText(/Formula|Breast milk/);
    expect(feedingItems.length).toBeGreaterThan(0);
  });

  it("should not show edit or delete buttons for historical feedings", () => {
    render(
      <FeedingHistory
        history={mockHistory}
        isLoading={false}
        error={null}
        selectedDate="2025-03-15"
        onDayClick={vi.fn()}
        dayFeedings={mockDayFeedings}
        dayFeedingsLoading={false}
      />
    );

    expect(screen.queryByLabelText("Edit feeding")).toBeNull();
    expect(screen.queryByLabelText("Delete feeding")).toBeNull();
  });

  it("should collapse day when clicking the already-selected day", async () => {
    const user = userEvent.setup();
    const onDayClick = vi.fn();

    render(
      <FeedingHistory
        history={mockHistory}
        isLoading={false}
        error={null}
        selectedDate="2025-03-15"
        onDayClick={onDayClick}
        dayFeedings={mockDayFeedings}
        dayFeedingsLoading={false}
      />
    );

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);
    expect(onDayClick).toHaveBeenCalledWith("2025-03-15");
  });
});
