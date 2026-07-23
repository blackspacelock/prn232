import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/Landing";
import { LoginPage } from "./pages/Login";
import { RegisterPage } from "./pages/Register";
import { DashboardPage } from "./pages/Dashboard";
import { RoadmapsPage } from "./pages/Roadmaps";
import { RoadmapCanvasPage, SharedRoadmapCanvasPage } from "./pages/RoadmapCanvas";
import { MentorPage } from "./pages/Mentor";
import { SkillGapPage } from "./pages/SkillGap";
import { MarketPulsePage } from "./pages/MarketPulse";
import { PortfolioPage } from "./pages/Portfolio";
import { PublicPortfolioPage } from "./pages/PublicPortfolio";
import { SettingsPage } from "./pages/Settings";
import { AdminCareerRolesPage } from "./pages/admin/CareerRoles";
import { AdminRoadmapTemplatesPage } from "./pages/admin/RoadmapTemplates";
import { AdminNodeLibraryPage } from "./pages/admin/NodeLibrary";
import { AdminTechnicalSkillsPage } from "./pages/admin/TechnicalSkills";
import { AdminLearningResourcesPage } from "./pages/admin/LearningResources";
import { AdminJobTrendsPage } from "./pages/admin/JobTrends";
import { AdminDashboardPage } from "./pages/admin/Dashboard";
import { AdminUsersPage } from "./pages/admin/Users";
import { AdminSystemConfigPage } from "./pages/admin/SystemConfig";
import { AdminReportsPage } from "./pages/admin/Reports";
import { NodeProgressReferencePage } from "./pages/reference/NodeProgressReference";
import { UIReferencePage } from "./pages/reference/UIReference";
import { CareerRolesPage } from "./pages/catalog/CareerRoles";
import { CareerRoleDetailPage } from "./pages/catalog/CareerRoleDetail";
import { CareerRoadmapDetailPage } from "./pages/catalog/CareerRoadmapDetail";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import {
  AuthCareerRoleDetailRedirect,
  AuthCareerRolesRedirect,
  AuthRoadmapRedirect,
  PublicLegacyRoadmapRedirect,
} from "./components/CatalogRouteRedirects";

export const router = createBrowserRouter([
  { path: "/", Component: LandingPage },
  { path: "/login", Component: LoginPage },
  { path: "/register", Component: RegisterPage },
  { path: "/portfolio/:username", Component: PublicPortfolioPage },
  { path: "/reference/node-progress", Component: NodeProgressReferencePage },
  { path: "/reference/ui", Component: UIReferencePage },
  // Public catalog routes.
  { path: "/explore/career-roles", Component: CareerRolesPage },
  { path: "/explore/career-roles/:id", Component: CareerRoleDetailPage },
  { path: "/explore/roadmaps/:id", Component: CareerRoadmapDetailPage },
  { path: "/career-roadmap/:id", Component: PublicLegacyRoadmapRedirect },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/dashboard", Component: DashboardPage },
      { path: "/roadmaps", Component: RoadmapsPage },
      { path: "/roadmap/:id", Component: RoadmapCanvasPage },
      { path: "/shared-roadmap/:id", Component: SharedRoadmapCanvasPage },
      { path: "/mentor", Component: MentorPage },
      { path: "/skill-gap", Component: SkillGapPage },
      { path: "/market", Component: MarketPulsePage },
      { path: "/portfolio", Component: PortfolioPage },
      { path: "/settings", Component: SettingsPage },
      // Authenticated catalog routes.
      { path: "/career-roles", Component: CareerRolesPage },
      { path: "/career-roles/:id", Component: CareerRoleDetailPage },
      { path: "/roadmaps/:id", Component: CareerRoadmapDetailPage },
      // Legacy authenticated aliases redirect to canonical app-style catalog paths.
      { path: "/app/career-roles", Component: AuthCareerRolesRedirect },
      { path: "/app/career-roles/:id", Component: AuthCareerRoleDetailRedirect },
      { path: "/app/roadmaps/:id", Component: AuthRoadmapRedirect },
      { path: "/browse/career-roles", Component: AuthCareerRolesRedirect },
      { path: "/browse/career-roles/:id", Component: AuthCareerRoleDetailRedirect },
      { path: "/browse/career-roadmap/:id", Component: AuthRoadmapRedirect },
    ],
  },
  {
    element: <AdminRoute />,
    children: [
      { path: "/admin", Component: AdminDashboardPage },
      { path: "/admin/users", Component: AdminUsersPage },
      { path: "/admin/career-roles", Component: AdminCareerRolesPage },
      { path: "/admin/roadmaps", Component: AdminRoadmapTemplatesPage },
      { path: "/admin/nodes", Component: AdminNodeLibraryPage },
      { path: "/admin/technical-skills", Component: AdminTechnicalSkillsPage },
      { path: "/admin/learning-resources", Component: AdminLearningResourcesPage },
      { path: "/admin/job-trends", Component: AdminJobTrendsPage },
      { path: "/admin/config", Component: AdminSystemConfigPage },
      { path: "/admin/reports", Component: AdminReportsPage },
    ],
  },
]);
