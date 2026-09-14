import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/stock")({ component: StockLayout });

function StockLayout() {
  return <Outlet />;
}
