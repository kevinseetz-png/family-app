import { render, screen } from "@testing-library/react";
import OfflinePage from "./page";

describe("OfflinePage", () => {
  it("renders the offline heading", () => {
    render(<OfflinePage />);
    expect(screen.getByRole("heading", { name: /you're offline/i })).toBeInTheDocument();
  });

  it("renders helpful message", () => {
    render(<OfflinePage />);
    expect(screen.getByText(/check your internet connection/i)).toBeInTheDocument();
  });

  it("renders a main landmark", () => {
    render(<OfflinePage />);
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});
