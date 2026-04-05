import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";

export function AppShell() {
  return (
    <div className="min-h-screen bg-background">
      <main className="bottom-nav-safe">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
