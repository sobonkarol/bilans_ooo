export type DashboardMenuIcon =
  | "mainBalance"
  | "income"
  | "expenses"
  | "subscriptions"
  | "history"
  | "forecasts"
  | "settings";

export type DashboardMenuItem = {
  id: string;
  href: `/dashboard${string}`;
  label: string;
  icon: DashboardMenuIcon;
};

export const DASHBOARD_MENU_ITEMS: readonly DashboardMenuItem[] = [
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
];

export function getDashboardMenuItemByHref(href: string): DashboardMenuItem | undefined {
  return DASHBOARD_MENU_ITEMS.find((item) => item.href === href);
}

export function assertDashboardMenuIntegrity(items: readonly DashboardMenuItem[] = DASHBOARD_MENU_ITEMS): void {
  const ids = new Set<string>();
  const hrefs = new Set<string>();

  for (const item of items) {
    if (!item.label.trim()) {
      throw new Error(`Dashboard menu contains empty label for id: ${item.id}`);
    }
    if (ids.has(item.id)) {
      throw new Error(`Dashboard menu contains duplicated id: ${item.id}`);
    }
    if (hrefs.has(item.href)) {
      throw new Error(`Dashboard menu contains duplicated href: ${item.href}`);
    }

    ids.add(item.id);
    hrefs.add(item.href);
  }
}

if (process.env.NODE_ENV !== "production") {
  assertDashboardMenuIntegrity();
}