import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

import AdminLayout from "@/components/layout/AdminLayout";
import AdminProtectedRoute from "@/routes/AdminProtectedRoute";
import AdminError from "@/routes/AdminError";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import MembersPage from "@/pages/MembersPage";
import PaymentsPage from "@/pages/PaymentsPage";
import FarmAssignmentsPage from "@/pages/FarmAssignmentsPage";
import SettingsPage from "@/pages/SettingsPage";

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <AdminProtectedRoute />,
    errorElement: <AdminError />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "members", element: <MembersPage /> },
          { path: "payments", element: <PaymentsPage /> },
          { path: "farm-assignments", element: <FarmAssignmentsPage /> },
          { path: "settings", element: <SettingsPage /> },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
