import Home from "../features/home/components/Home";
import { Navigate } from "react-router-dom";
import AuthService from "../services/auth.service";

export default function HomePage() {
  const currentUser = AuthService.getCurrentUser() as { role?: string; roles?: string[] } | null;
  const rawRoles = [currentUser?.role, ...(currentUser?.roles || [])].filter(
    Boolean
  ) as string[];
  const normalizedRoles = rawRoles.map((role) =>
    String(role).replace(/^ROLE_/i, "").toLowerCase()
  );

  if (normalizedRoles.includes("manager")) {
    return <Navigate to="/manager" replace />;
  }

  return <Home />;
}
