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
  it("should render supermarket names", () => {
    render(<SupermarktResults results={mockResults} isSearching={false} hasSearched={true} enabledSupermarkten={allEnabled} />);
    expect(screen.getByText("Albert Heijn")).toBeInTheDocument();
    expect(screen.getByText("Jumbo")).toBeInTheDocument();
  });

  it("should render product names and prices", () => {
    render(<SupermarktResults results={mockResults} isSearching={false} hasSearched={true} enabledSupermarkten={allEnabled} />);
    expect(screen.getByText("AH Halfvolle melk")).toBeInTheDocument();
    expect(screen.getByText("€ 1,39")).toBeInTheDocument();
    expect(screen.getByText("Jumbo Halfvolle melk")).toBeInTheDocument();
    expect(screen.getByText("€ 1,29")).toBeInTheDocument();
  });

  it("should show error message for failed supermarkets", () => {
    render(<SupermarktResults results={mockResults} isSearching={false} hasSearched={true} enabledSupermarkten={allEnabled} />);
    expect(screen.getByText("Niet beschikbaar")).toBeInTheDocument();
  });

  it("should sort supermarkets by lowest product price first", () => {
    render(<SupermarktResults results={mockResults} isSearching={false} hasSearched={true} enabledSupermarkten={allEnabled} />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    const supermarktNames = headings.map((h) => h.textContent);
    const jumboIdx = supermarktNames.indexOf("Jumbo");
    const ahIdx = supermarktNames.indexOf("Albert Heijn");
    expect(jumboIdx).toBeLessThan(ahIdx!);
  });

  it("should show empty state message when no search performed", () => {
    render(<SupermarktResults results={[]} isSearching={false} hasSearched={false} enabledSupermarkten={allEnabled} />);
    expect(screen.getByText(/zoek een product om prijzen te vergelijken/i)).toBeInTheDocument();
  });

  it("should show loading skeleton when searching", () => {
    render(<SupermarktResults results={[]} isSearching={true} hasSearched={true} enabledSupermarkten={allEnabled} />);
    expect(screen.getByText(/zoeken/i)).toBeInTheDocument();
  });

  it("should display unit quantity for products", () => {
    render(<SupermarktResults results={mockResults} isSearching={false} hasSearched={true} enabledSupermarkten={allEnabled} />);
    const unitTexts = screen.getAllByText("1 L");
    expect(unitTexts.length).toBeGreaterThan(0);
  });

  it("should show supermarkets with errors after those with products", () => {
    render(<SupermarktResults results={mockResults} isSearching={false} hasSearched={true} enabledSupermarkten={allEnabled} />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    const names = headings.map((h) => h.textContent);
    const lidlIdx = names.indexOf("Lidl");
    const jumboIdx = names.indexOf("Jumbo");
    expect(lidlIdx).toBeGreaterThan(jumboIdx!);
  });

  it("should filter out disabled supermarkets", () => {
    const onlyJumbo = new Set<SupermarktId>(["jumbo"]);
    render(<SupermarktResults results={mockResults} isSearching={false} hasSearched={true} enabledSupermarkten={onlyJumbo} />);
    expect(screen.getByText("Jumbo")).toBeInTheDocument();
    expect(screen.queryByText("Albert Heijn")).not.toBeInTheDocument();
    expect(screen.queryByText("Lidl")).not.toBeInTheDocument();
  });
});
