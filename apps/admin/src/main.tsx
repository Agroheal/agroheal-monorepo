import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AutoUpdateWatcher } from "@/components/common/AutoUpdateWatcher";
import "./index.css";

// Auto-recover from stale chunks after new deployments
window.addEventListener("vite:preloadError", (event) => {
  console.warn("[AgroHeal Admin] Preload error detected. Reloading page to fetch latest deployment...", event);
  window.location.reload();
});

import AdminLayout from "@/components/layout/AdminLayout";
import AdminProtectedRoute from "@/routes/AdminProtectedRoute";
import AdminError from "@/routes/AdminError";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import MembersPage from "@/pages/MembersPage";
import PaymentsPage from "@/pages/PaymentsPage";
import FarmAssignmentsPage from "@/pages/FarmAssignmentsPage";
import TreasuryPage from "@/pages/TreasuryPage";
import SettingsPage from "@/pages/SettingsPage";
import CoreDriversPage from "@/pages/CoreDriversPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import CoursesAdminPage from "@/pages/CoursesAdminPage";
import ContentManagementPage from "@/pages/ContentManagementPage";
import AuditTrailPage from "@/pages/AuditTrailPage";
import FulfillmentHubPage from "@/pages/FulfillmentHubPage";

const router = createBrowserRouter([
  { path: "/signin", element: <LoginPage /> },
  {
    element: <AdminProtectedRoute />,
    errorElement: <AdminError />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "members", element: <MembersPage /> },
          { path: "leaderboard", element: <LeaderboardPage /> },
          { path: "fulfillment", element: <FulfillmentHubPage /> },
          { path: "farm-assignments", element: <FarmAssignmentsPage /> },
          { path: "core-drivers", element: <CoreDriversPage /> },
          { path: "payments", element: <PaymentsPage /> },
          { path: "audit", element: <AuditTrailPage /> },
          { path: "treasury", element: <TreasuryPage /> },
          { path: "content", element: <ContentManagementPage /> },
          { path: "courses", element: <CoursesAdminPage /> },
          { path: "settings", element: <SettingsPage /> },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AutoUpdateWatcher />
    <RouterProvider router={router} />
  </StrictMode>,
);
