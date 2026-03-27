import { describe, expect, it } from "vitest";

import {
  assertDashboardMenuIntegrity,
  DASHBOARD_MENU_ITEMS,
  getDashboardMenuItemByHref,
  type DashboardMenuItem,
} from "@/lib/dashboard-menu";

describe("dashboard-menu", () => {
  it("ma poprawną, stabilną listę pozycji menu", () => {
    expect(DASHBOARD_MENU_ITEMS).toEqual([
      { id: "main", href: "/dashboard", label: "Główny bilans", icon: "mainBalance" },
      { id: "income", href: "/dashboard/wplywy", label: "Wpływy", icon: "income" },
      { id: "expenses", href: "/dashboard/wydatki", label: "Wydatki", icon: "expenses" },
      {
        id: "subscriptions",
        href: "/dashboard/subskrypcje",
        label: "Subskrypcje",
        icon: "subscriptions",
      },
      {
        id: "history",
        href: "/dashboard/historia",
        label: "Poprzednie miesiące/lata",
        icon: "history",
      },
      { id: "forecasts", href: "/dashboard/prognozy", label: "Prognozy", icon: "forecasts" },
      {
        id: "settings",
        href: "/dashboard/ustawienia",
        label: "Ustawienia profilu",
        icon: "settings",
      },
    ]);
  });

  it("zawiera unikalne id oraz ścieżki", () => {
    const ids = DASHBOARD_MENU_ITEMS.map((item) => item.id);
    const hrefs = DASHBOARD_MENU_ITEMS.map((item) => item.href);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("zawiera polskie znaki tam, gdzie oczekiwane", () => {
    const main = getDashboardMenuItemByHref("/dashboard");
    const income = getDashboardMenuItemByHref("/dashboard/wplywy");
    const history = getDashboardMenuItemByHref("/dashboard/historia");

    expect(main?.label).toContain("ł");
    expect(income?.label).toContain("ł");
    expect(history?.label).toContain("ą");
  });

  it("helper zwraca undefined dla nieznanej ścieżki", () => {
    expect(getDashboardMenuItemByHref("/dashboard/nie-istnieje")).toBeUndefined();
  });

  it("walidator wykrywa duplikaty", () => {
    const brokenItems: DashboardMenuItem[] = [
      { id: "main", href: "/dashboard", label: "Główny bilans", icon: "mainBalance" },
      { id: "main", href: "/dashboard/wplywy", label: "Wpływy", icon: "income" },
    ];

    expect(() => assertDashboardMenuIntegrity(brokenItems)).toThrow("duplicated id");
  });
});