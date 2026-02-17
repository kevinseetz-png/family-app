import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PicnicSearch } from "./PicnicSearch";
import type { PicnicProduct } from "@/types/picnic";

/**
 * @vitest-environment jsdom
 */

describe("PicnicSearch", () => {
  const mockOnSearch = vi.fn();
  const mockOnAddToCart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render search input", () => {
    render(<PicnicSearch onSearch={mockOnSearch} onAddToCart={mockOnAddToCart} products={[]} isSearching={false} />);
    expect(screen.getByPlaceholderText(/zoek.*picnic/i)).toBeInTheDocument();
  });

  it("should call onSearch when user types and submits", async () => {
    mockOnSearch.mockResolvedValue(undefined);
    render(<PicnicSearch onSearch={mockOnSearch} onAddToCart={mockOnAddToCart} products={[]} isSearching={false} />);

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText(/zoek.*picnic/i), "melk");
    await user.click(screen.getByRole("button", { name: /zoeken/i }));

    expect(mockOnSearch).toHaveBeenCalledWith("melk");
  });

  it("should display search results", () => {
    const products: PicnicProduct[] = [
      { id: "p1", name: "Halfvolle melk", price: 139, displayPrice: "€ 1,39", imageId: "img1", unitQuantity: "1 L", maxCount: 50 },
      { id: "p2", name: "Volle melk", price: 149, displayPrice: "€ 1,49", imageId: "img2", unitQuantity: "1 L", maxCount: 50 },
    ];
    render(<PicnicSearch onSearch={mockOnSearch} onAddToCart={mockOnAddToCart} products={products} isSearching={false} />);

    expect(screen.getByText("Halfvolle melk")).toBeInTheDocument();
    expect(screen.getByText("Volle melk")).toBeInTheDocument();
  });

  it("should show loading state while searching", () => {
    render(<PicnicSearch onSearch={mockOnSearch} onAddToCart={mockOnAddToCart} products={[]} isSearching={true} />);
    expect(screen.getByText(/zoeken/i)).toBeInTheDocument();
  });

  it("should call onAddToCart when add button is clicked", async () => {
    const products: PicnicProduct[] = [
      { id: "p1", name: "Halfvolle melk", price: 139, displayPrice: "€ 1,39", imageId: "img1", unitQuantity: "1 L", maxCount: 50 },
    ];
    render(<PicnicSearch onSearch={mockOnSearch} onAddToCart={mockOnAddToCart} products={products} isSearching={false} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /toevoegen.*mandje/i }));

    expect(mockOnAddToCart).toHaveBeenCalledWith("p1");
  });

  it("should show empty state when no results found", () => {
    render(
      <PicnicSearch
        onSearch={mockOnSearch}
        onAddToCart={mockOnAddToCart}
        products={[]}
        isSearching={false}
        hasSearched={true}
      />
    );
    expect(screen.getByText(/geen producten gevonden/i)).toBeInTheDocument();
  });
});
