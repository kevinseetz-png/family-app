import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MaaltijdenPage from "./page";

/**
 * @vitest-environment jsdom
 */

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

vi.mock("@/components/AuthProvider", () => ({
  useAuthContext: vi.fn(),
}));

vi.mock("@/hooks/useMeals", () => ({
  useMeals: vi.fn(),
}));

vi.mock("@/hooks/useWeekMenu", () => ({
  useWeekMenu: vi.fn(),
}));

import { useAuthContext } from "@/components/AuthProvider";
import { useMeals } from "@/hooks/useMeals";
import { useWeekMenu } from "@/hooks/useWeekMenu";

const mockUseAuthContext = vi.mocked(useAuthContext);
const mockUseMeals = vi.mocked(useMeals);
const mockUseWeekMenu = vi.mocked(useWeekMenu);

const mockAuthContextBase = {
  logout: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  visibleTabs: null,
  updateVisibleTabs: vi.fn(),
};

const mockUseMealsBase = {
  meals: [],
  isLoading: false,
  error: null,
  addMeal: vi.fn(),
  updateMeal: vi.fn(),
  deleteMeal: vi.fn(),
  getRandomMeal: vi.fn(),
  refetch: vi.fn(),
};

const EMPTY_DAYS = { mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "" };
const EMPTY_INGREDIENTS = { mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "" };

const mockUseWeekMenuBase = {
  days: EMPTY_DAYS,
  ingredients: EMPTY_INGREDIENTS,
  isLoading: false,
  error: null,
  isSaving: false,
  saveMenu: vi.fn(),
};

describe("MaaltijdenPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWeekMenu.mockReturnValue(mockUseWeekMenuBase);
  });

  it("should redirect to login when not authenticated", async () => {
    mockUseAuthContext.mockReturnValue({
      ...mockAuthContextBase,
      user: null,
      isLoading: false,
    });

    mockUseMeals.mockReturnValue(mockUseMealsBase);

    render(<MaaltijdenPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
  });

  it("should show loading spinner while loading", () => {
    mockUseAuthContext.mockReturnValue({
      ...mockAuthContextBase,
      user: null,
      isLoading: true,
    });

    mockUseMeals.mockReturnValue({
      ...mockUseMealsBase,
      isLoading: true,
    });

    render(<MaaltijdenPage />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("should render page title", async () => {
    mockUseAuthContext.mockReturnValue({
      ...mockAuthContextBase,
      user: {
        id: "user1",
        name: "Test User",
        email: "test@example.com",
        familyId: "fam1",
        role: "member",
      },
      isLoading: false,
    });

    mockUseMeals.mockReturnValue(mockUseMealsBase);

    render(<MaaltijdenPage />);

    expect(screen.getByRole("heading", { name: /maaltijden/i })).toBeInTheDocument();
  });

  it("should display meal cards", async () => {
    mockUseAuthContext.mockReturnValue({
      ...mockAuthContextBase,
      user: {
        id: "user1",
        name: "Test User",
        email: "test@example.com",
        familyId: "fam1",
        role: "member",
      },
      isLoading: false,
    });

    mockUseMeals.mockReturnValue({
      ...mockUseMealsBase,
      meals: [
        {
          id: "meal1",
          familyId: "fam1",
          name: "Spaghetti Bolognese",
          ingredients: "pasta, gehakt, tomaat",
          instructions: "Kook de pasta",
          createdBy: "user1",
          createdByName: "Test User",
          createdAt: new Date(),
        },
        {
          id: "meal2",
          familyId: "fam1",
          name: "Pizza",
          ingredients: "deeg, kaas",
          instructions: "Bak in de oven",
          createdBy: "user1",
          createdByName: "Test User",
          createdAt: new Date(),
        },
      ],
    });

    render(<MaaltijdenPage />);

    expect(screen.getByText("Spaghetti Bolognese")).toBeInTheDocument();
    expect(screen.getByText("Pizza")).toBeInTheDocument();
  });

  it("should show random meal button", async () => {
    mockUseAuthContext.mockReturnValue({
      ...mockAuthContextBase,
      user: {
        id: "user1",
        name: "Test User",
        email: "test@example.com",
        familyId: "fam1",
        role: "member",
      },
      isLoading: false,
    });

    mockUseMeals.mockReturnValue({
      ...mockUseMealsBase,
      meals: [
        {
          id: "meal1",
          familyId: "fam1",
          name: "Spaghetti",
          ingredients: "",
          instructions: "",
          createdBy: "user1",
          createdByName: "Test User",
          createdAt: new Date(),
        },
      ],
    });

    render(<MaaltijdenPage />);

    expect(screen.getByRole("button", { name: /willekeurig/i })).toBeInTheDocument();
  });

  it("should call getRandomMeal when random button clicked", async () => {
    const mockGetRandomMeal = vi.fn().mockReturnValue({
      id: "meal1",
      name: "Random Meal",
      ingredients: "",
      instructions: "",
    });

    mockUseAuthContext.mockReturnValue({
      ...mockAuthContextBase,
      user: {
        id: "user1",
        name: "Test User",
        email: "test@example.com",
        familyId: "fam1",
        role: "member",
      },
      isLoading: false,
    });

    mockUseMeals.mockReturnValue({
      ...mockUseMealsBase,
      meals: [
        {
          id: "meal1",
          familyId: "fam1",
          name: "Random Meal",
          ingredients: "",
          instructions: "",
          createdBy: "user1",
          createdByName: "Test User",
          createdAt: new Date(),
        },
      ],
      getRandomMeal: mockGetRandomMeal,
    });

    render(<MaaltijdenPage />);

    const randomButton = screen.getByRole("button", { name: /willekeurig/i });
    await userEvent.click(randomButton);

    expect(mockGetRandomMeal).toHaveBeenCalled();
  });

  it("should show empty state when no meals", () => {
    mockUseAuthContext.mockReturnValue({
      ...mockAuthContextBase,
      user: {
        id: "user1",
        name: "Test User",
        email: "test@example.com",
        familyId: "fam1",
        role: "member",
      },
      isLoading: false,
    });

    mockUseMeals.mockReturnValue(mockUseMealsBase);

    render(<MaaltijdenPage />);

    expect(screen.getByText(/geen maaltijden/i)).toBeInTheDocument();
  });

  it("should open edit modal when clicking edit button", async () => {
    mockUseAuthContext.mockReturnValue({
      ...mockAuthContextBase,
      user: {
        id: "user1",
        name: "Test User",
        email: "test@example.com",
        familyId: "fam1",
        role: "member",
      },
      isLoading: false,
    });

    mockUseMeals.mockReturnValue({
      ...mockUseMealsBase,
      meals: [
        {
          id: "meal1",
          familyId: "fam1",
          name: "Test Meal",
          ingredients: "test ingredients",
          instructions: "test instructions",
          createdBy: "user1",
          createdByName: "Test User",
          createdAt: new Date(),
        },
      ],
    });

    render(<MaaltijdenPage />);

    const editButton = screen.getByRole("button", { name: /bewerk/i });
    await userEvent.click(editButton);

    // Modal should show ingredients and instructions fields
    expect(screen.getByLabelText(/ingrediënten/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/instructies/i)).toBeInTheDocument();
  });

  it("should call deleteMeal when delete button clicked", async () => {
    const mockDeleteMeal = vi.fn().mockResolvedValue(undefined);

    mockUseAuthContext.mockReturnValue({
      ...mockAuthContextBase,
      user: {
        id: "user1",
        name: "Test User",
        email: "test@example.com",
        familyId: "fam1",
        role: "member",
      },
      isLoading: false,
    });

    mockUseMeals.mockReturnValue({
      ...mockUseMealsBase,
      meals: [
        {
          id: "meal1",
          familyId: "fam1",
          name: "To Delete",
          ingredients: "",
          instructions: "",
          createdBy: "user1",
          createdByName: "Test User",
          createdAt: new Date(),
        },
      ],
      deleteMeal: mockDeleteMeal,
    });

    render(<MaaltijdenPage />);

    const deleteButton = screen.getByRole("button", { name: /verwijder/i });
    await userEvent.click(deleteButton);

    expect(mockDeleteMeal).toHaveBeenCalledWith("meal1");
  });

  it("should display error message when error occurs", () => {
    mockUseAuthContext.mockReturnValue({
      ...mockAuthContextBase,
      user: {
        id: "user1",
        name: "Test User",
        email: "test@example.com",
        familyId: "fam1",
        role: "member",
      },
      isLoading: false,
    });

    mockUseMeals.mockReturnValue({
      ...mockUseMealsBase,
      error: "Failed to load meals",
    });

    render(<MaaltijdenPage />);

    expect(screen.getByText("Failed to load meals")).toBeInTheDocument();
  });

  it("should show 'Toevoegen aan weekmenu' button when a meal is selected", async () => {
    mockUseAuthContext.mockReturnValue({
      ...mockAuthContextBase,
      user: {
        id: "user1",
        name: "Test User",
        email: "test@example.com",
        familyId: "fam1",
        role: "member",
      },
      isLoading: false,
    });

    mockUseMeals.mockReturnValue({
      ...mockUseMealsBase,
      meals: [
        {
          id: "meal1",
          familyId: "fam1",
          name: "Spaghetti",
          ingredients: "pasta, gehakt",
          instructions: "",
          createdBy: "user1",
          createdByName: "Test User",
          createdAt: new Date(),
        },
      ],
    });

    render(<MaaltijdenPage />);

    // Click meal to select it
    await userEvent.click(screen.getByText("Spaghetti"));

    expect(screen.getByRole("button", { name: /toevoegen aan weekmenu/i })).toBeInTheDocument();
  });

  it("should show day picker when 'Toevoegen aan weekmenu' is clicked", async () => {
    mockUseAuthContext.mockReturnValue({
      ...mockAuthContextBase,
      user: {
        id: "user1",
        name: "Test User",
        email: "test@example.com",
        familyId: "fam1",
        role: "member",
      },
      isLoading: false,
    });

    mockUseMeals.mockReturnValue({
      ...mockUseMealsBase,
      meals: [
        {
          id: "meal1",
          familyId: "fam1",
          name: "Spaghetti",
          ingredients: "pasta, gehakt",
          instructions: "",
          createdBy: "user1",
          createdByName: "Test User",
          createdAt: new Date(),
        },
      ],
    });

    render(<MaaltijdenPage />);

    // Select meal
    await userEvent.click(screen.getByText("Spaghetti"));

    // Click add to weekmenu
    await userEvent.click(screen.getByRole("button", { name: /toevoegen aan weekmenu/i }));

    // Should show day buttons
    expect(screen.getByText("Kies een dag:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ma" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Di" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zo" })).toBeInTheDocument();
  });

  it("should call saveMenu with meal data when a day is selected", async () => {
    const mockSaveMenu = vi.fn().mockResolvedValue(undefined);

    mockUseAuthContext.mockReturnValue({
      ...mockAuthContextBase,
      user: {
        id: "user1",
        name: "Test User",
        email: "test@example.com",
        familyId: "fam1",
        role: "member",
      },
      isLoading: false,
    });

    mockUseMeals.mockReturnValue({
      ...mockUseMealsBase,
      meals: [
        {
          id: "meal1",
          familyId: "fam1",
          name: "Spaghetti",
          ingredients: "pasta, gehakt",
          instructions: "",
          createdBy: "user1",
          createdByName: "Test User",
          createdAt: new Date(),
        },
      ],
    });

    mockUseWeekMenu.mockReturnValue({
      ...mockUseWeekMenuBase,
      saveMenu: mockSaveMenu,
    });

    render(<MaaltijdenPage />);

    // Select meal
    await userEvent.click(screen.getByText("Spaghetti"));

    // Open day picker
    await userEvent.click(screen.getByRole("button", { name: /toevoegen aan weekmenu/i }));

    // Pick Monday
    await userEvent.click(screen.getByRole("button", { name: "Ma" }));

    await waitFor(() => {
      expect(mockSaveMenu).toHaveBeenCalledWith(
        { ...EMPTY_DAYS, mon: "Spaghetti" },
        { ...EMPTY_INGREDIENTS, mon: "pasta, gehakt" }
      );
    });
  });

  it("should show existing weekmenu entries in day picker", async () => {
    mockUseAuthContext.mockReturnValue({
      ...mockAuthContextBase,
      user: {
        id: "user1",
        name: "Test User",
        email: "test@example.com",
        familyId: "fam1",
        role: "member",
      },
      isLoading: false,
    });

    mockUseMeals.mockReturnValue({
      ...mockUseMealsBase,
      meals: [
        {
          id: "meal1",
          familyId: "fam1",
          name: "Spaghetti",
          ingredients: "pasta",
          instructions: "",
          createdBy: "user1",
          createdByName: "Test User",
          createdAt: new Date(),
        },
      ],
    });

    mockUseWeekMenu.mockReturnValue({
      ...mockUseWeekMenuBase,
      days: { ...EMPTY_DAYS, mon: "Pizza", wed: "Stamppot" },
    });

    render(<MaaltijdenPage />);

    // Select meal
    await userEvent.click(screen.getByText("Spaghetti"));

    // Open day picker
    await userEvent.click(screen.getByRole("button", { name: /toevoegen aan weekmenu/i }));

    // Should show existing meals for days that have them
    expect(screen.getByText(/Pizza/)).toBeInTheDocument();
    expect(screen.getByText(/Stamppot/)).toBeInTheDocument();
  });
});
