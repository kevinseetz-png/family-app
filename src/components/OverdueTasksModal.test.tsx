import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OverdueTasksModal } from "./OverdueTasksModal";
import type { KlusjesItem } from "@/types/klusjes";

/**
 * @vitest-environment jsdom
 */

function makeOverdueItem(overrides: Partial<KlusjesItem> = {}): KlusjesItem {
  return {
    id: "task1",
    familyId: "fam1",
    name: "Oude taak",
    status: "todo",
    priority: 2,
    date: "2026-02-10",
    recurrence: "none",
    completions: {},
    createdBy: "user1",
    createdByName: "Test User",
    createdAt: new Date("2026-01-01T12:00:00Z"),
    ...overrides,
  };
}

describe("OverdueTasksModal", () => {
  const mockOnReschedule = vi.fn();
  const mockOnRemoveDate = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render modal title", () => {
    render(
      <OverdueTasksModal
        tasks={[makeOverdueItem()]}
        onReschedule={mockOnReschedule}
        onRemoveDate={mockOnRemoveDate}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText("Verlopen taken")).toBeInTheDocument();
  });

  it("should render all overdue tasks", () => {
    const tasks = [
      makeOverdueItem({ id: "t1", name: "Taak A" }),
      makeOverdueItem({ id: "t2", name: "Taak B" }),
    ];
    render(
      <OverdueTasksModal
        tasks={tasks}
        onReschedule={mockOnReschedule}
        onRemoveDate={mockOnRemoveDate}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText("Taak A")).toBeInTheDocument();
    expect(screen.getByText("Taak B")).toBeInTheDocument();
  });

  it("should show date for each overdue task", () => {
    render(
      <OverdueTasksModal
        tasks={[makeOverdueItem({ date: "2026-02-10" })]}
        onReschedule={mockOnReschedule}
        onRemoveDate={mockOnRemoveDate}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText(/10/)).toBeInTheDocument();
  });

  it("should have a 'Verzetten' button for each task", () => {
    render(
      <OverdueTasksModal
        tasks={[makeOverdueItem()]}
        onReschedule={mockOnReschedule}
        onRemoveDate={mockOnRemoveDate}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByRole("button", { name: /verzetten/i })).toBeInTheDocument();
  });

  it("should have a 'Datum verwijderen' button for each task", () => {
    render(
      <OverdueTasksModal
        tasks={[makeOverdueItem()]}
        onReschedule={mockOnReschedule}
        onRemoveDate={mockOnRemoveDate}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByRole("button", { name: /datum verwijderen/i })).toBeInTheDocument();
  });

  it("should call onRemoveDate when 'Datum verwijderen' is clicked", async () => {
    const user = userEvent.setup();
    mockOnRemoveDate.mockResolvedValue(undefined);
    render(
      <OverdueTasksModal
        tasks={[makeOverdueItem({ id: "t1" })]}
        onReschedule={mockOnReschedule}
        onRemoveDate={mockOnRemoveDate}
        onClose={mockOnClose}
      />
    );
    await user.click(screen.getByRole("button", { name: /datum verwijderen/i }));
    expect(mockOnRemoveDate).toHaveBeenCalledWith("t1");
  });

  it("should call onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <OverdueTasksModal
        tasks={[makeOverdueItem()]}
        onReschedule={mockOnReschedule}
        onRemoveDate={mockOnRemoveDate}
        onClose={mockOnClose}
      />
    );
    await user.click(screen.getByRole("button", { name: /sluiten/i }));
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it("should show date picker when 'Verzetten' is clicked", async () => {
    const user = userEvent.setup();
    render(
      <OverdueTasksModal
        tasks={[makeOverdueItem()]}
        onReschedule={mockOnReschedule}
        onRemoveDate={mockOnRemoveDate}
        onClose={mockOnClose}
      />
    );
    await user.click(screen.getByRole("button", { name: /verzetten/i }));
    expect(screen.getByLabelText(/nieuwe datum/i)).toBeInTheDocument();
  });
});
