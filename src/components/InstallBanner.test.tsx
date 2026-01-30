import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InstallBanner } from "./InstallBanner";

const mockInstall = vi.fn();

vi.mock("@/hooks/useInstallPrompt", () => ({
  useInstallPrompt: () => ({
    isInstallable: mockIsInstallable,
    install: mockInstall,
  }),
}));

let mockIsInstallable = false;

describe("InstallBanner", () => {
  beforeEach(() => {
    mockIsInstallable = false;
    vi.clearAllMocks();
  });

  it("renders nothing when not installable", () => {
    const { container } = render(<InstallBanner />);
    expect(container.innerHTML).toBe("");
  });

  it("renders install banner when installable", () => {
    mockIsInstallable = true;
    render(<InstallBanner />);
    expect(screen.getByText("Install Family App")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Install" })).toBeInTheDocument();
  });

  it("calls install when button is clicked", async () => {
    mockIsInstallable = true;
    const user = userEvent.setup();
    render(<InstallBanner />);
    await user.click(screen.getByRole("button", { name: "Install" }));
    expect(mockInstall).toHaveBeenCalledOnce();
  });
});
