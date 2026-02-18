import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { SupermarktResults } from "./SupermarktResults";
import type { SupermarktResult } from "@/types/supermarkt";

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
        imageUrl: "https://ah.nl/img/1",
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
  it("should render supermarket names", () => {
    render(<SupermarktResults results={mockResults} isSearching={false} hasSearched={true} />);
    expect(screen.getByText("Albert Heijn")).toBeInTheDocument();
    expect(screen.getByText("Jumbo")).toBeInTheDocument();
  });

  it("should render product names and prices", () => {
    render(<SupermarktResults results={mockResults} isSearching={false} hasSearched={true} />);
    expect(screen.getByText("AH Halfvolle melk")).toBeInTheDocument();
    expect(screen.getByText("€ 1,39")).toBeInTheDocument();
    expect(screen.getByText("Jumbo Halfvolle melk")).toBeInTheDocument();
    expect(screen.getByText("€ 1,29")).toBeInTheDocument();
  });

  it("should show error message for failed supermarkets", () => {
    render(<SupermarktResults results={mockResults} isSearching={false} hasSearched={true} />);
    expect(screen.getByText("Niet beschikbaar")).toBeInTheDocument();
  });

  it("should sort supermarkets by lowest product price first", () => {
    render(<SupermarktResults results={mockResults} isSearching={false} hasSearched={true} />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    const supermarktNames = headings.map((h) => h.textContent);
    // Jumbo (129) should come before AH (139)
    const jumboIdx = supermarktNames.indexOf("Jumbo");
    const ahIdx = supermarktNames.indexOf("Albert Heijn");
    expect(jumboIdx).toBeLessThan(ahIdx!);
  });

  it("should show empty state message when no search performed", () => {
    render(<SupermarktResults results={[]} isSearching={false} hasSearched={false} />);
    expect(screen.getByText(/zoek een product om prijzen te vergelijken/i)).toBeInTheDocument();
  });

  it("should show loading skeleton when searching", () => {
    render(<SupermarktResults results={[]} isSearching={true} hasSearched={true} />);
    expect(screen.getByText(/zoeken/i)).toBeInTheDocument();
  });

  it("should display unit quantity for products", () => {
    render(<SupermarktResults results={mockResults} isSearching={false} hasSearched={true} />);
    const unitTexts = screen.getAllByText("1 L");
    expect(unitTexts.length).toBeGreaterThan(0);
  });

  it("should render product images when available", () => {
    render(<SupermarktResults results={mockResults} isSearching={false} hasSearched={true} />);
    const images = screen.getAllByRole("img");
    expect(images.length).toBeGreaterThan(0);
  });

  it("should show supermarkets with errors after those with products", () => {
    render(<SupermarktResults results={mockResults} isSearching={false} hasSearched={true} />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    const names = headings.map((h) => h.textContent);
    const lidlIdx = names.indexOf("Lidl");
    const jumboIdx = names.indexOf("Jumbo");
    expect(lidlIdx).toBeGreaterThan(jumboIdx!);
  });
});
