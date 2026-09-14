export const ROLES = [
  "OWNER",
  "PPC",
  "STORES",
  "PURCHASE",
  "SALES",
  "QC",
  "ACCOUNTS",
  "SHOP",
  "ADMIN",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  OWNER: "Owner / GM",
  PPC: "PPC",
  STORES: "Stores",
  PURCHASE: "Purchase",
  SALES: "Sales",
  QC: "QC",
  ACCOUNTS: "Accounts",
  SHOP: "Shop supervisor",
  ADMIN: "Admin",
};

export const DEMO_PASSWORD = "Tamba@2026";

export const DEMO_USERS: { email: string; name: string; role: Role }[] = [
  { email: "owner@tambaerp.in", name: "Kavita Mehta", role: "OWNER" },
  { email: "ppc@tambaerp.in", name: "Jignesh Rana", role: "PPC" },
  { email: "stores@tambaerp.in", name: "Rakesh Solanki", role: "STORES" },
  { email: "purchase@tambaerp.in", name: "Meena Desai", role: "PURCHASE" },
  { email: "sales@tambaerp.in", name: "Farhan Qureshi", role: "SALES" },
  { email: "qc@tambaerp.in", name: "Anjali Trivedi", role: "QC" },
  { email: "accounts@tambaerp.in", name: "Suresh Iyer", role: "ACCOUNTS" },
  { email: "shop@tambaerp.in", name: "Dinesh Chauhan", role: "SHOP" },
  { email: "admin@tambaerp.in", name: "IT Admin", role: "ADMIN" },
];

export const PERMS = {
  price_edit: ["OWNER", "ACCOUNTS", "ADMIN", "PURCHASE"] as Role[],
  stock_adjust: ["OWNER", "STORES", "ADMIN"] as Role[],
  qc_release: ["OWNER", "QC", "ADMIN"] as Role[],
  booking: ["OWNER", "SHOP", "PPC", "ADMIN"] as Role[],
  jw: ["OWNER", "PPC", "STORES", "ADMIN"] as Role[],
  sales: ["OWNER", "SALES", "ADMIN", "PPC"] as Role[],
  purchase: ["OWNER", "PURCHASE", "STORES", "ADMIN"] as Role[],
  invoice: ["OWNER", "ACCOUNTS", "SALES", "ADMIN"] as Role[],
  masters: ["OWNER", "ADMIN", "PPC"] as Role[],
  view: ROLES as unknown as Role[],
};
