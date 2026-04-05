import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { OrgProvider, useOrg } from "@/contexts/OrgContext";
import { AppShell } from "@/components/layout/AppShell";
import TodayPage from "./pages/TodayPage";
import ToursPage from "./pages/ToursPage";
import TourDetailPage from "./pages/TourDetailPage";
import ShowsPage from "./pages/ShowsPage";
import ShowDetailPage from "./pages/ShowDetailPage";
import TravelPage from "./pages/TravelPage";
import ArchivePage from "./pages/ArchivePage";
import SettingsPage from "./pages/SettingsPage";
import BandSettingsPage from "./pages/settings/BandSettingsPage";
import TeamMembersPage from "./pages/settings/TeamMembersPage";
import RolesPermissionsPage from "./pages/settings/RolesPermissionsPage";
import BillingPage from "./pages/settings/BillingPage";
import ProfilePage from "./pages/settings/ProfilePage";
import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/OnboardingPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireOrg({ children }: { children: React.ReactNode }) {
  const { currentOrg, loading, organizations } = useOrg();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    );
  }
  if (organizations.length === 0) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/today" replace />} />
      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <OnboardingPage />
          </RequireAuth>
        }
      />
      <Route
        element={
          <RequireAuth>
            <OrgProvider>
              <RequireOrg>
                <AppShell />
              </RequireOrg>
            </OrgProvider>
          </RequireAuth>
        }
      >
        <Route path="/today" element={<TodayPage />} />
        <Route path="/tours" element={<ToursPage />} />
        <Route path="/tours/:id" element={<TourDetailPage />} />
        <Route path="/shows" element={<ShowsPage />} />
        <Route path="/shows/:id" element={<ShowDetailPage />} />
        <Route path="/travel" element={<TravelPage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
