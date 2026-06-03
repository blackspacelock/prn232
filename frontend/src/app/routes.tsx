import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/Landing";
import { LoginPage } from "./pages/Login";
import { RegisterPage } from "./pages/Register";
import { DashboardPage } from "./pages/Dashboard";
import { RoadmapsPage } from "./pages/Roadmaps";
import { RoadmapCanvasPage } from "./pages/RoadmapCanvas";
import { MentorPage } from "./pages/Mentor";
import { SkillGapPage } from "./pages/SkillGap";
import { MarketPulsePage } from "./pages/MarketPulse";
import { PortfolioPage } from "./pages/Portfolio";
import { PublicPortfolioPage } from "./pages/PublicPortfolio";
import { SettingsPage } from "./pages/Settings";
import { AdminCareerRolesPage } from "./pages/admin/CareerRoles";
import { AdminRoadmapTemplatesPage } from "./pages/admin/RoadmapTemplates";
import { AdminNodeLibraryPage } from "./pages/admin/NodeLibrary";
import { AdminJobTrendsPage } from "./pages/admin/JobTrends";
import { NodeProgressReferencePage } from "./pages/reference/NodeProgressReference";
import { UIReferencePage } from "./pages/reference/UIReference";
import { CareerRolesPage } from "./pages/catalog/CareerRoles";
import { CareerRoleDetailPage } from "./pages/catalog/CareerRoleDetail";
import { CareerRoleRoadmapsPage } from "./pages/catalog/CareerRoleRoadmaps";
import { CareerRoadmapDetailPage } from "./pages/catalog/CareerRoadmapDetail";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";

export const router = createBrowserRouter([
  { path: "/", Component: LandingPage },
  { path: "/login", Component: LoginPage },
  { path: "/register", Component: RegisterPage },
  { path: "/portfolio/:username", Component: PublicPortfolioPage },
  { path: "/reference/node-progress", Component: NodeProgressReferencePage },
  { path: "/reference/ui", Component: UIReferencePage },
  // Public catalog routes (accessible without auth; adapt layout when logged in)
  { path: "/career-roles", Component: CareerRolesPage },
  { path: "/career-roles/:id", Component: CareerRoleDetailPage },
  { path: "/career-roles/:id/roadmaps", Component: CareerRoleRoadmapsPage },
  { path: "/roadmaps/:id", Component: CareerRoadmapDetailPage },
  { path: "/career-roadmap/:id", Component: CareerRoadmapDetailPage },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/dashboard", Component: DashboardPage },
      { path: "/roadmaps", Component: RoadmapsPage },
      { path: "/roadmap/:id", Component: RoadmapCanvasPage },
      { path: "/mentor", Component: MentorPage },
      { path: "/skill-gap", Component: SkillGapPage },
      { path: "/market", Component: MarketPulsePage },
      { path: "/portfolio", Component: PortfolioPage },
      { path: "/settings", Component: SettingsPage },
      // Authenticated catalog routes (redirects to /login if not authenticated)
      { path: "/app/career-roles", Component: CareerRolesPage },
      { path: "/app/career-roles/:id", Component: CareerRoleDetailPage },
      { path: "/app/career-roles/:id/roadmaps", Component: CareerRoleRoadmapsPage },
      { path: "/app/roadmaps/:id", Component: CareerRoadmapDetailPage },
      // Legacy browse aliases kept for existing links/history.
      { path: "/browse/career-roles", Component: CareerRolesPage },
      { path: "/browse/career-roles/:id", Component: CareerRoleDetailPage },
      { path: "/browse/career-roles/:id/roadmaps", Component: CareerRoleRoadmapsPage },
      { path: "/browse/career-roadmap/:id", Component: CareerRoadmapDetailPage },
    ],
  },
  {
    element: <AdminRoute />,
    children: [
      { path: "/admin/career-roles", Component: AdminCareerRolesPage },
      { path: "/admin/roadmaps", Component: AdminRoadmapTemplatesPage },
      { path: "/admin/nodes", Component: AdminNodeLibraryPage },
      { path: "/admin/job-trends", Component: AdminJobTrendsPage },
    ],
  },
]);
