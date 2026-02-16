import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskCard } from "./TaskCard";
import type { KlusjesItem } from "@/types/klusjes";

/**
 * @vitest-environment jsdom
 */

function makeItem(overrides: Partial<KlusjesItem> = {}): KlusjesItem {
  return {
    id: "task1",
    familyId: "fam1",
    name: "Stofzuigen",
    status: "todo",
    priority: 2,
    date: "2026-02-15",
    endDate: null,
    reminder: null,
    recurrence: "none",
    completions: {},
    createdBy: "user1",
    createdByName: "Test User",
    createdAt: new Date("2026-01-31T12:00:00Z"),
    ...overrides,
  };
}

describe("TaskCard", () => {
  const mockOnStatusChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the task name", () => {
    render(<TaskCard item={makeItem()} onStatusChange={mockOnStatusChange} />);
    expect(screen.getByText("Stofzuigen")).toBeInTheDocument();
  });

  it("should show status button with correct icon for todo", () => {
    render(<TaskCard item={makeItem({ status: "todo" })} onStatusChange={mockOnStatusChange} />);
    const btn = screen.getByRole("button", { name: /status/i });
    expect(btn).toBeInTheDocument();
  });

  it("should show status button with correct icon for klaar", () => {
    render(<TaskCard item={makeItem({ status: "klaar" })} onStatusChange={mockOnStatusChange} />);
    const btn = screen.getByRole("button", { name: /status/i });
    expect(btn).toBeInTheDocument();
  });

  it("should cycle status on click: todo → bezig", async () => {
    const user = userEvent.setup();
    const item = makeItem({ id: "t1", status: "todo" });
    render(<TaskCard item={item} onStatusChange={mockOnStatusChange} />);

    await user.click(screen.getByRole("button", { name: /status/i }));
    expect(mockOnStatusChange).toHaveBeenCalledWith("t1", "bezig", undefined);
  });

  it("should cycle status: bezig → klaar", async () => {
    const user = userEvent.setup();
    const item = makeItem({ id: "t1", status: "bezig" });
    render(<TaskCard item={item} onStatusChange={mockOnStatusChange} />);

    await user.click(screen.getByRole("button", { name: /status/i }));
    expect(mockOnStatusChange).toHaveBeenCalledWith("t1", "klaar", undefined);
  });

  it("should cycle status: klaar → todo", async () => {
    const user = userEvent.setup();
    const item = makeItem({ id: "t1", status: "klaar" });
    render(<TaskCard item={item} onStatusChange={mockOnStatusChange} />);

    await user.click(screen.getByRole("button", { name: /status/i }));
    expect(mockOnStatusChange).toHaveBeenCalledWith("t1", "todo", undefined);
  });

  it("should handle recurring task ID with completionDate", async () => {
    const user = userEvent.setup();
    const item = makeItem({ id: "t1_2026-02-15", status: "todo", date: "2026-02-15", recurrence: "daily" });
    render(<TaskCard item={item} onStatusChange={mockOnStatusChange} />);

    await user.click(screen.getByRole("button", { name: /status/i }));
    expect(mockOnStatusChange).toHaveBeenCalledWith("t1", "bezig", "2026-02-15");
  });

  it("should show strikethrough for completed tasks", () => {
    render(<TaskCard item={makeItem({ status: "klaar" })} onStatusChange={mockOnStatusChange} />);
    const nameEl = screen.getByText("Stofzuigen");
    expect(nameEl).toHaveClass("line-through");
  });

  it("should show priority badge for high priority", () => {
    render(<TaskCard item={makeItem({ priority: 1 })} onStatusChange={mockOnStatusChange} />);
    expect(screen.getByText("Hoog")).toBeInTheDocument();
  });

  it("should not show priority badge for normal priority", () => {
    render(<TaskCard item={makeItem({ priority: 2 })} onStatusChange={mockOnStatusChange} />);
    expect(screen.queryByText("Hoog")).not.toBeInTheDocument();
    expect(screen.queryByText("Laag")).not.toBeInTheDocument();
  });

  it("should show recurrence badge when not none", () => {
    render(<TaskCard item={makeItem({ recurrence: "weekly" })} onStatusChange={mockOnStatusChange} />);
    expect(screen.getByText("Wekelijks")).toBeInTheDocument();
  });
});
