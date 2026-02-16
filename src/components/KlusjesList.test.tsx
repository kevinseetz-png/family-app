import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KlusjesList } from "./KlusjesList";
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
    endDate: null,
    reminder: null,
    recurrence: "none",
    recurrenceInterval: 1,
    completions: {},
    createdBy: "user1",
    createdByName: "Test User",
    createdAt: new Date("2026-01-31T12:00:00Z"),
    ...overrides,
  };
}

describe("KlusjesList", () => {
  const mockOnStatusChange = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnReschedule = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display empty state when no items", () => {
    render(
      <KlusjesList items={[]} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} onReschedule={mockOnReschedule} />
    );

    expect(screen.getByText("Geen taken op de lijst.")).toBeInTheDocument();
  });

  it("should display a list of klusjes", () => {
    const items = [
      makeItem({ id: "k1", name: "Stofzuigen", status: "todo" }),
      makeItem({ id: "k2", name: "Afwassen", status: "klaar" }),
    ];

    render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} onReschedule={mockOnReschedule} />
    );

    expect(screen.getByText("Stofzuigen")).toBeInTheDocument();
    expect(screen.getByText("Afwassen")).toBeInTheDocument();
  });

  it("should render non-klaar items before klaar items", () => {
    const items = [
      makeItem({ id: "k1", name: "Klaar Item", status: "klaar" }),
      makeItem({ id: "k2", name: "Todo Item", status: "todo" }),
    ];

    const { container } = render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} onReschedule={mockOnReschedule} />
    );
    const listItems = container.querySelectorAll("li");

    expect(listItems).toHaveLength(2);
    expect(listItems[0]).toHaveTextContent("Todo Item");
    expect(listItems[1]).toHaveTextContent("Klaar Item");
  });

  it("should cycle status on button click: todo → bezig", async () => {
    const user = userEvent.setup();
    const items = [makeItem({ id: "k1", status: "todo" })];

    render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} onReschedule={mockOnReschedule} />
    );

    const statusButton = screen.getByRole("button", { name: /status/i });
    await user.click(statusButton);

    expect(mockOnStatusChange).toHaveBeenCalledWith("k1", "bezig", undefined);
  });

  it("should cycle status: bezig → klaar", async () => {
    const user = userEvent.setup();
    const items = [makeItem({ id: "k1", status: "bezig" })];

    render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} onReschedule={mockOnReschedule} />
    );

    const statusButton = screen.getByRole("button", { name: /status/i });
    await user.click(statusButton);

    expect(mockOnStatusChange).toHaveBeenCalledWith("k1", "klaar", undefined);
  });

  it("should cycle status: klaar → todo", async () => {
    const user = userEvent.setup();
    const items = [makeItem({ id: "k1", status: "klaar" })];

    render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} onReschedule={mockOnReschedule} />
    );

    const statusButton = screen.getByRole("button", { name: /status/i });
    await user.click(statusButton);

    expect(mockOnStatusChange).toHaveBeenCalledWith("k1", "todo", undefined);
  });

  it("should call onDelete when delete button is clicked", async () => {
    const user = userEvent.setup();
    const items = [makeItem({ id: "k1", name: "Stofzuigen" })];

    render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} onReschedule={mockOnReschedule} />
    );

    const deleteButton = screen.getByRole("button", { name: /verwijder stofzuigen/i });
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith("k1");
  });

  it("should show strikethrough for klaar items", () => {
    const items = [makeItem({ id: "k1", name: "Completed Item", status: "klaar" })];

    render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} onReschedule={mockOnReschedule} />
    );

    const itemText = screen.getByText("Completed Item");
    expect(itemText).toHaveClass("line-through");
  });

  it("should show date badge when date is set", () => {
    const items = [makeItem({ id: "k1", name: "Test", date: "2026-02-10" })];

    render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} onReschedule={mockOnReschedule} />
    );

    expect(screen.getByText("10 feb")).toBeInTheDocument();
  });

  it("should show recurrence badge when recurrence is not none", () => {
    const items = [makeItem({ id: "k1", name: "Test", recurrence: "weekly" })];

    render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} onReschedule={mockOnReschedule} />
    );

    expect(screen.getByText("Wekelijks")).toBeInTheDocument();
  });

  it("should not show recurrence badge when recurrence is none", () => {
    const items = [makeItem({ id: "k1", name: "Test", recurrence: "none" })];

    render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} onReschedule={mockOnReschedule} />
    );

    expect(screen.queryByText("Eenmalig")).not.toBeInTheDocument();
  });

  it("should have accessible status button labels with instructions", () => {
    const items = [makeItem({ id: "k1", name: "Test Klusje", status: "todo" })];

    render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} onReschedule={mockOnReschedule} />
    );

    const statusButton = screen.getByRole("button", { name: /status test klusje.*klik voor/i });
    expect(statusButton).toHaveAccessibleName();
  });

  it("should have accessible delete button labels", () => {
    const items = [makeItem({ id: "k1", name: "Test Klusje" })];

    render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} onReschedule={mockOnReschedule} />
    );

    const deleteButton = screen.getByRole("button", { name: /verwijder test klusje/i });
    expect(deleteButton).toHaveAccessibleName();
  });

  it("should show priority indicator for high priority items", () => {
    const items = [makeItem({ id: "k1", name: "Urgent", priority: 1 })];

    render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} onReschedule={mockOnReschedule} />
    );

    expect(screen.getByText("Hoog")).toBeInTheDocument();
  });

  it("should show priority indicator for low priority items", () => {
    const items = [makeItem({ id: "k1", name: "Later", priority: 3 })];

    render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} onReschedule={mockOnReschedule} />
    );

    expect(screen.getByText("Laag")).toBeInTheDocument();
  });

  it("should not show priority indicator for normal priority items", () => {
    const items = [makeItem({ id: "k1", name: "Normal", priority: 2 })];

    render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} onReschedule={mockOnReschedule} />
    );

    expect(screen.queryByText("Hoog")).not.toBeInTheDocument();
    expect(screen.queryByText("Laag")).not.toBeInTheDocument();
  });

  it("should sort items by priority (high first, then normal, then low)", () => {
    const items = [
      makeItem({ id: "k1", name: "Low Item", priority: 3 }),
      makeItem({ id: "k2", name: "High Item", priority: 1 }),
      makeItem({ id: "k3", name: "Normal Item", priority: 2 }),
    ];

    const { container } = render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} onReschedule={mockOnReschedule} />
    );
    const listItems = container.querySelectorAll("li");

    expect(listItems[0]).toHaveTextContent("High Item");
    expect(listItems[1]).toHaveTextContent("Normal Item");
    expect(listItems[2]).toHaveTextContent("Low Item");
  });

  it("should show edit date button for each task", () => {
    const items = [makeItem({ id: "k1", name: "Stofzuigen" })];

    render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} onReschedule={mockOnReschedule} />
    );

    expect(screen.getByRole("button", { name: /datum wijzigen.*stofzuigen/i })).toBeInTheDocument();
  });

  it("should show date input when edit date button is clicked", async () => {
    const user = userEvent.setup();
    const items = [makeItem({ id: "k1", name: "Stofzuigen", date: "2026-02-16" })];

    render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} onReschedule={mockOnReschedule} />
    );

    await user.click(screen.getByRole("button", { name: /datum wijzigen.*stofzuigen/i }));

    expect(screen.getByLabelText("Nieuwe datum")).toBeInTheDocument();
  });

  it("should call onReschedule when date is changed", async () => {
    const user = userEvent.setup();
    mockOnReschedule.mockResolvedValue(undefined);
    const items = [makeItem({ id: "k1", name: "Stofzuigen", date: "2026-02-16" })];

    render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} onReschedule={mockOnReschedule} />
    );

    await user.click(screen.getByRole("button", { name: /datum wijzigen.*stofzuigen/i }));

    const dateInput = screen.getByLabelText("Nieuwe datum");
    await user.clear(dateInput);
    await user.type(dateInput, "2026-03-01");
    await user.click(screen.getByRole("button", { name: /opslaan/i }));

    expect(mockOnReschedule).toHaveBeenCalledWith("k1", "2026-03-01");
  });

  it("should call onReschedule with null when datum verwijderen is clicked", async () => {
    const user = userEvent.setup();
    mockOnReschedule.mockResolvedValue(undefined);
    const items = [makeItem({ id: "k1", name: "Stofzuigen", date: "2026-02-16" })];

    render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} onReschedule={mockOnReschedule} />
    );

    await user.click(screen.getByRole("button", { name: /datum wijzigen.*stofzuigen/i }));
    await user.click(screen.getByRole("button", { name: /datum verwijderen/i }));

    expect(mockOnReschedule).toHaveBeenCalledWith("k1", null);
  });
});
