import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KlusjesList } from "./KlusjesList";
import type { KlusjesItem } from "@/types/klusjes";

/**
 * @vitest-environment jsdom
 */

describe("KlusjesList", () => {
  const mockOnToggle = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display empty state when no items", () => {
    render(
      <KlusjesList items={[]} onToggle={mockOnToggle} onDelete={mockOnDelete} />
    );

    expect(screen.getByText("Geen klusjes op de lijst.")).toBeInTheDocument();
  });

  it("should display a list of klusjes", () => {
    const mockItems: KlusjesItem[] = [
      {
        id: "klusje1",
        familyId: "fam1",
        name: "Stofzuigen",
        checked: false,
        createdBy: "user1",
        createdByName: "Test User",
        createdAt: new Date("2026-01-31T12:00:00Z"),
      },
      {
        id: "klusje2",
        familyId: "fam1",
        name: "Afwassen",
        checked: true,
        createdBy: "user2",
        createdByName: "Test User 2",
        createdAt: new Date("2026-01-31T11:00:00Z"),
      },
    ];

    render(
      <KlusjesList
        items={mockItems}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText("Stofzuigen")).toBeInTheDocument();
    expect(screen.getByText("Afwassen")).toBeInTheDocument();
  });

  it("should render unchecked items before checked items", () => {
    const mockItems: KlusjesItem[] = [
      {
        id: "klusje1",
        familyId: "fam1",
        name: "Checked Item",
        checked: true,
        createdBy: "user1",
        createdByName: "Test",
        createdAt: new Date(),
      },
      {
        id: "klusje2",
        familyId: "fam1",
        name: "Unchecked Item",
        checked: false,
        createdBy: "user1",
        createdByName: "Test",
        createdAt: new Date(),
      },
    ];

    const { container } = render(
      <KlusjesList
        items={mockItems}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );
    const listItems = container.querySelectorAll("li");

    expect(listItems).toHaveLength(2);
    expect(listItems[0]).toHaveTextContent("Unchecked Item");
    expect(listItems[1]).toHaveTextContent("Checked Item");
  });

  it("should call onToggle when checkbox is clicked", async () => {
    const user = userEvent.setup();
    const mockItems: KlusjesItem[] = [
      {
        id: "klusje1",
        familyId: "fam1",
        name: "Stofzuigen",
        checked: false,
        createdBy: "user1",
        createdByName: "Test",
        createdAt: new Date(),
      },
    ];

    render(
      <KlusjesList
        items={mockItems}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    expect(mockOnToggle).toHaveBeenCalledWith("klusje1", true);
  });

  it("should call onDelete when delete button is clicked", async () => {
    const user = userEvent.setup();
    const mockItems: KlusjesItem[] = [
      {
        id: "klusje1",
        familyId: "fam1",
        name: "Stofzuigen",
        checked: false,
        createdBy: "user1",
        createdByName: "Test",
        createdAt: new Date(),
      },
    ];

    render(
      <KlusjesList
        items={mockItems}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByRole("button", {
      name: /verwijder stofzuigen/i,
    });
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith("klusje1");
  });

  it("should show strikethrough for checked items", () => {
    const mockItems: KlusjesItem[] = [
      {
        id: "klusje1",
        familyId: "fam1",
        name: "Completed Item",
        checked: true,
        createdBy: "user1",
        createdByName: "Test",
        createdAt: new Date(),
      },
    ];

    render(
      <KlusjesList
        items={mockItems}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    const itemText = screen.getByText("Completed Item");
    expect(itemText).toHaveClass("line-through");
  });

  it("should have accessible checkbox labels", () => {
    const mockItems: KlusjesItem[] = [
      {
        id: "klusje1",
        familyId: "fam1",
        name: "Test Klusje",
        checked: false,
        createdBy: "user1",
        createdByName: "Test",
        createdAt: new Date(),
      },
    ];

    render(
      <KlusjesList
        items={mockItems}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAccessibleName(/vink aan test klusje/i);
  });

  it("should have accessible delete button labels", () => {
    const mockItems: KlusjesItem[] = [
      {
        id: "klusje1",
        familyId: "fam1",
        name: "Test Klusje",
        checked: false,
        createdBy: "user1",
        createdByName: "Test",
        createdAt: new Date(),
      },
    ];

    render(
      <KlusjesList
        items={mockItems}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByRole("button");
    expect(deleteButton).toHaveAccessibleName(/verwijder test klusje/i);
  });

  it("should update checkbox aria-label based on checked state", () => {
    const mockItems: KlusjesItem[] = [
      {
        id: "klusje1",
        familyId: "fam1",
        name: "Test Klusje",
        checked: true,
        createdBy: "user1",
        createdByName: "Test",
        createdAt: new Date(),
      },
    ];

    render(
      <KlusjesList
        items={mockItems}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAccessibleName(/vink uit test klusje/i);
  });
});
