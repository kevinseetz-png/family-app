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
    date: null,
    recurrence: "none",
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display empty state when no items", () => {
    render(
      <KlusjesList items={[]} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} />
    );

    expect(screen.getByText("Geen klusjes op de lijst.")).toBeInTheDocument();
  });

  it("should display a list of klusjes", () => {
    const items = [
      makeItem({ id: "k1", name: "Stofzuigen", status: "todo" }),
      makeItem({ id: "k2", name: "Afwassen", status: "klaar" }),
    ];

    render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} />
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
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} />
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
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} />
    );

    const statusButton = screen.getByRole("button", { name: /status/i });
    await user.click(statusButton);

    expect(mockOnStatusChange).toHaveBeenCalledWith("k1", "bezig", undefined);
  });

  it("should cycle status: bezig → klaar", async () => {
    const user = userEvent.setup();
    const items = [makeItem({ id: "k1", status: "bezig" })];

    render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} />
    );

    const statusButton = screen.getByRole("button", { name: /status/i });
    await user.click(statusButton);

    expect(mockOnStatusChange).toHaveBeenCalledWith("k1", "klaar", undefined);
  });

  it("should cycle status: klaar → todo", async () => {
    const user = userEvent.setup();
    const items = [makeItem({ id: "k1", status: "klaar" })];

    render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} />
    );

    const statusButton = screen.getByRole("button", { name: /status/i });
    await user.click(statusButton);

    expect(mockOnStatusChange).toHaveBeenCalledWith("k1", "todo", undefined);
  });

  it("should call onDelete when delete button is clicked", async () => {
    const user = userEvent.setup();
    const items = [makeItem({ id: "k1", name: "Stofzuigen" })];

    render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} />
    );

    const deleteButton = screen.getByRole("button", { name: /verwijder stofzuigen/i });
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith("k1");
  });

  it("should show strikethrough for klaar items", () => {
    const items = [makeItem({ id: "k1", name: "Completed Item", status: "klaar" })];

    render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} />
    );

    const itemText = screen.getByText("Completed Item");
    expect(itemText).toHaveClass("line-through");
  });

  it("should show date badge when date is set", () => {
    const items = [makeItem({ id: "k1", name: "Test", date: "2026-02-10" })];

    render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} />
    );

    expect(screen.getByText("10 feb")).toBeInTheDocument();
  });

  it("should show recurrence badge when recurrence is not none", () => {
    const items = [makeItem({ id: "k1", name: "Test", recurrence: "weekly" })];

    render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} />
    );

    expect(screen.getByText("Wekelijks")).toBeInTheDocument();
  });

  it("should not show recurrence badge when recurrence is none", () => {
    const items = [makeItem({ id: "k1", name: "Test", recurrence: "none" })];

    render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} />
    );

    expect(screen.queryByText("Eenmalig")).not.toBeInTheDocument();
  });

  it("should have accessible status button labels with instructions", () => {
    const items = [makeItem({ id: "k1", name: "Test Klusje", status: "todo" })];

    render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} />
    );

    const statusButton = screen.getByRole("button", { name: /status test klusje.*klik voor/i });
    expect(statusButton).toHaveAccessibleName();
  });

  it("should have accessible delete button labels", () => {
    const items = [makeItem({ id: "k1", name: "Test Klusje" })];

    render(
      <KlusjesList items={items} onStatusChange={mockOnStatusChange} onDelete={mockOnDelete} />
    );

    const deleteButton = screen.getByRole("button", { name: /verwijder test klusje/i });
    expect(deleteButton).toHaveAccessibleName();
  });
});
