import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PicnicAddToCartModal } from "./PicnicAddToCartModal";
import type { PicnicProduct } from "@/types/picnic";

/**
 * @vitest-environment jsdom
 */

describe("PicnicAddToCartModal", () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnSearch = vi.fn();

  const ingredientLines = ["500g pasta", "2 uien", "400g gehakt"];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render ingredient list", () => {
    render(
      <PicnicAddToCartModal
        ingredients={ingredientLines}
        searchResults={{}}
        onSearch={mockOnSearch}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isLoading={false}
      />
    );

    expect(screen.getByText("500g pasta")).toBeInTheDocument();
    expect(screen.getByText("2 uien")).toBeInTheDocument();
    expect(screen.getByText("400g gehakt")).toBeInTheDocument();
  });

  it("should show search results per ingredient", () => {
    const searchResults: Record<string, PicnicProduct[]> = {
      "500g pasta": [
        { id: "p1", name: "Penne pasta", price: 129, displayPrice: "€ 1,29", imageId: "img1", unitQuantity: "500 g", maxCount: 50 },
      ],
    };

    render(
      <PicnicAddToCartModal
        ingredients={ingredientLines}
        searchResults={searchResults}
        onSearch={mockOnSearch}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isLoading={false}
      />
    );

    expect(screen.getByText("Penne pasta")).toBeInTheDocument();
  });

  it("should call onConfirm with selected products", async () => {
    const searchResults: Record<string, PicnicProduct[]> = {
      "500g pasta": [
        { id: "p1", name: "Penne pasta", price: 129, displayPrice: "€ 1,29", imageId: "img1", unitQuantity: "500 g", maxCount: 50 },
      ],
    };

    render(
      <PicnicAddToCartModal
        ingredients={ingredientLines}
        searchResults={searchResults}
        onSearch={mockOnSearch}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isLoading={false}
      />
    );

    const user = userEvent.setup();

    // Select a product
    const selectButton = screen.getByRole("button", { name: /selecteer.*penne pasta/i });
    await user.click(selectButton);

    // Confirm
    await user.click(screen.getByRole("button", { name: /toevoegen aan mandje/i }));

    expect(mockOnConfirm).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ productId: "p1" })])
    );
  });

  it("should call onCancel when cancel button is clicked", async () => {
    render(
      <PicnicAddToCartModal
        ingredients={ingredientLines}
        searchResults={{}}
        onSearch={mockOnSearch}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isLoading={false}
      />
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /annuleren/i }));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("should disable confirm button when no products selected", () => {
    render(
      <PicnicAddToCartModal
        ingredients={ingredientLines}
        searchResults={{}}
        onSearch={mockOnSearch}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isLoading={false}
      />
    );

    expect(screen.getByRole("button", { name: /toevoegen aan mandje/i })).toBeDisabled();
  });

  it("should show loading state", () => {
    render(
      <PicnicAddToCartModal
        ingredients={ingredientLines}
        searchResults={{}}
        onSearch={mockOnSearch}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isLoading={true}
      />
    );

    expect(screen.getByRole("button", { name: /toevoegen aan mandje/i })).toBeDisabled();
  });
});
