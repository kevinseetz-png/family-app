/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryManager } from "./CategoryManager";
import type { CustomCategory } from "@/types/customCategory";

describe("CategoryManager", () => {
  const mockCategories: CustomCategory[] = [
    { id: "cat1", familyId: "fam1", label: "Huisdier", emoji: "🐕", colorScheme: "groen" },
    { id: "cat2", familyId: "fam1", label: "Hobby", emoji: "🎨", colorScheme: "paars" },
  ];
  const mockOnAdd = vi.fn().mockResolvedValue(undefined);
  const mockOnDelete = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => vi.clearAllMocks());

  it("renders existing custom categories", () => {
    render(<CategoryManager categories={mockCategories} onAdd={mockOnAdd} onDelete={mockOnDelete} />);
    expect(screen.getByText("Huisdier")).toBeInTheDocument();
    expect(screen.getByText("Hobby")).toBeInTheDocument();
  });

  it("shows empty state when no categories", () => {
    render(<CategoryManager categories={[]} onAdd={mockOnAdd} onDelete={mockOnDelete} />);
    expect(screen.getByText(/geen eigen categorieën/i)).toBeInTheDocument();
  });

  it("opens add form when button is clicked", async () => {
    const user = userEvent.setup();
    render(<CategoryManager categories={[]} onAdd={mockOnAdd} onDelete={mockOnDelete} />);

    await user.click(screen.getByRole("button", { name: /toevoegen/i }));
    expect(screen.getByLabelText(/naam/i)).toBeInTheDocument();
  });

  it("submits new category", async () => {
    const user = userEvent.setup();
    render(<CategoryManager categories={[]} onAdd={mockOnAdd} onDelete={mockOnDelete} />);

    await user.click(screen.getByRole("button", { name: /toevoegen/i }));
    await user.type(screen.getByLabelText(/naam/i), "Huisdier");
    await user.type(screen.getByLabelText(/emoji/i), "🐕");
    await user.click(screen.getByRole("button", { name: /bewaar/i }));

    expect(mockOnAdd).toHaveBeenCalledWith({
      label: "Huisdier",
      emoji: "🐕",
      colorScheme: expect.any(String),
    });
  });

  it("calls onDelete when delete button is clicked", async () => {
    const user = userEvent.setup();
    render(<CategoryManager categories={mockCategories} onAdd={mockOnAdd} onDelete={mockOnDelete} />);

    const items = screen.getAllByRole("listitem");
    const deleteBtn = within(items[0]).getByRole("button", { name: /verwijder/i });
    await user.click(deleteBtn);

    expect(mockOnDelete).toHaveBeenCalledWith("cat1");
  });

  it("does not submit with empty label", async () => {
    const user = userEvent.setup();
    render(<CategoryManager categories={[]} onAdd={mockOnAdd} onDelete={mockOnDelete} />);

    await user.click(screen.getByRole("button", { name: /toevoegen/i }));
    await user.click(screen.getByRole("button", { name: /bewaar/i }));

    expect(mockOnAdd).not.toHaveBeenCalled();
  });
});
