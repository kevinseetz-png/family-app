import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SupermarktResults } from "./SupermarktResults";
import type { SupermarktResult, SupermarktId } from "@/types/supermarkt";

const allEnabled = new Set<SupermarktId>(["ah", "jumbo", "lidl", "picnic", "dirk", "dekamarkt", "aldi", "plus", "hoogvliet", "spar", "vomar", "poiesz"]);

const mockResults: SupermarktResult[] = [
  {
    supermarkt: "ah",
    label: "Albert Heijn",
    products: [
      {
        id: "ah-1",
        name: "AH Halfvolle melk",
        price: 139,
        displayPrice: "€ 1,39",
        unitQuantity: "1 L",
        imageUrl: null,
        supermarkt: "ah",
      },
      {
        id: "ah-2",
        name: "AH Volle melk",
        price: 149,
        displayPrice: "€ 1,49",
        unitQuantity: "1 L",
        imageUrl: null,
        supermarkt: "ah",
      },
    ],
    error: null,
  },
  {
    supermarkt: "jumbo",
    label: "Jumbo",
    products: [
      {
        id: "j-1",
        name: "Jumbo Halfvolle melk",
        price: 129,
        displayPrice: "€ 1,29",
        unitQuantity: "1 L",
        imageUrl: null,
        supermarkt: "jumbo",
      },
    ],
    error: null,
  },
  {
    supermarkt: "lidl",
    label: "Lidl",
    products: [],
    error: "Niet beschikbaar",
  },
];

describe("SupermarktResults", () => {
  it("should render product names and prices in a flat list", () => {
    render(<SupermarktResults results={mockResults} isSearching={false} hasSearched={true} enabledSupermarkten={allEnabled} />);
    expect(screen.getByText("AH Halfvolle melk")).toBeInTheDocument();
    expect(screen.getByText("€ 1,39")).toBeInTheDocument();
    expect(screen.getByText("Jumbo Halfvolle melk")).toBeInTheDocument();
    expect(screen.getByText("€ 1,29")).toBeInTheDocument();
  });

  it("should show supermarket name per product", () => {
    render(<SupermarktResults results={mockResults} isSearching={false} hasSearched={true} enabledSupermarkten={allEnabled} />);
    // AH has 2 products, each shows "Albert Heijn" label
    expect(screen.getAllByText(/Albert Heijn/).length).toBe(2);
    // Jumbo appears in both product name and label text
    expect(screen.getAllByText(/Jumbo/).length).toBeGreaterThanOrEqual(1);
  });

  it("should sort all products by cheapest first", () => {
    render(<SupermarktResults results={mockResults} isSearching={false} hasSearched={true} enabledSupermarkten={allEnabled} />);
    const items = screen.getAllByRole("listitem");
    // Jumbo 1,29 should be first, then AH 1,39, then AH 1,49
    expect(items[0]).toHaveTextContent("Jumbo Halfvolle melk");
    expect(items[1]).toHaveTextContent("AH Halfvolle melk");
    expect(items[2]).toHaveTextContent("AH Volle melk");
  });

  it("should show empty state message when no search performed", () => {
    render(<SupermarktResults results={[]} isSearching={false} hasSearched={false} enabledSupermarkten={allEnabled} />);
    expect(screen.getByText(/zoek een product om prijzen te vergelijken/i)).toBeInTheDocument();
  });

  it("should show loading message when searching", () => {
    render(<SupermarktResults results={[]} isSearching={true} hasSearched={true} enabledSupermarkten={allEnabled} />);
    expect(screen.getByText(/zoeken/i)).toBeInTheDocument();
  });

  it("should show no results message when all results are empty", () => {
    const emptyResults: SupermarktResult[] = [
      { supermarkt: "ah", label: "Albert Heijn", products: [], error: null },
    ];
    render(<SupermarktResults results={emptyResults} isSearching={false} hasSearched={true} enabledSupermarkten={allEnabled} />);
    expect(screen.getByText(/geen resultaten/i)).toBeInTheDocument();
  });

  it("should filter out disabled supermarkets", () => {
    const onlyJumbo = new Set<SupermarktId>(["jumbo"]);
    render(<SupermarktResults results={mockResults} isSearching={false} hasSearched={true} enabledSupermarkten={onlyJumbo} />);
    expect(screen.getByText("Jumbo Halfvolle melk")).toBeInTheDocument();
    expect(screen.queryByText("AH Halfvolle melk")).not.toBeInTheDocument();
  });

  it("should not show products with error results", () => {
    render(<SupermarktResults results={mockResults} isSearching={false} hasSearched={true} enabledSupermarkten={allEnabled} />);
    expect(screen.queryByText("Niet beschikbaar")).not.toBeInTheDocument();
  });
});
