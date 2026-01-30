import { render, screen } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { AuthProvider, useAuthContext } from "./AuthProvider";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "1", name: "Test", email: "test@test.com" },
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe("AuthProvider", () => {
  it("renders children", () => {
    render(
      <AuthProvider>
        <div>child content</div>
      </AuthProvider>
    );
    expect(screen.getByText("child content")).toBeInTheDocument();
  });
});

describe("useAuthContext", () => {
  it("returns auth context when used within AuthProvider", () => {
    const { result } = renderHook(() => useAuthContext(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });
    expect(result.current.user).toEqual({ id: "1", name: "Test", email: "test@test.com" });
    expect(result.current.isLoading).toBe(false);
  });

  it("throws when used outside AuthProvider", () => {
    expect(() => {
      renderHook(() => useAuthContext());
    }).toThrow("useAuthContext must be used within AuthProvider");
  });
});
