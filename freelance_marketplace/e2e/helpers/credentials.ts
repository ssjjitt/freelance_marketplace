export const DEFAULT_PASSWORD = process.env.E2E_PASSWORD || "Qwert123_";

export const USERS = {
  customer: {
    username: process.env.E2E_CUSTOMER_USER || "customer",
    password: DEFAULT_PASSWORD,
    storageState: "playwright/.auth/customer.json",
  },
  executer: {
    username: process.env.E2E_EXECUTER_USER || "executer",
    password: DEFAULT_PASSWORD,
    storageState: "playwright/.auth/executer.json",
  },
  manager: {
    username: process.env.E2E_MANAGER_USER || "manager",
    password: DEFAULT_PASSWORD,
    storageState: "playwright/.auth/manager.json",
  },
  admin: {
    username: process.env.E2E_ADMIN_USER || "admin",
    password: DEFAULT_PASSWORD,
    storageState: "playwright/.auth/admin.json",
  },
} as const;
