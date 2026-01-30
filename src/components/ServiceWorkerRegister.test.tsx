import { render } from "@testing-library/react";
import { ServiceWorkerRegister } from "./ServiceWorkerRegister";

describe("ServiceWorkerRegister", () => {
  const registerMock = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "serviceWorker", {
      value: { register: registerMock },
      writable: true,
      configurable: true,
    });
  });

  it("renders nothing", () => {
    const { container } = render(<ServiceWorkerRegister />);
    expect(container.innerHTML).toBe("");
  });

  it("registers service worker on mount", () => {
    render(<ServiceWorkerRegister />);
    expect(registerMock).toHaveBeenCalledWith("/sw.js");
  });

  it("does not throw when registration fails", () => {
    registerMock.mockRejectedValueOnce(new Error("fail"));
    expect(() => render(<ServiceWorkerRegister />)).not.toThrow();
  });
});
