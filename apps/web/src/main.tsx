import * as Sentry from "@sentry/react";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import "./index.css";

// pages imports for routes
import Home from "./page/website/Home";
import Layout from "./components/layout/Layout";
import Error from "./page/error/Error";
import About from "./page/website/About";
import Login from "./page/website/Login";
import Signup from "./page/website/Signup";
import Slots from "./page/website/Slots/Slots";
import Courses from "./page/website/Courses/Courses";
import Dashboard from "./page/website/dashboard/Dashboard";
import SingleCoursePage from "./page/website/Courses/CoursesDetails";
import ProtectedRoute from "./routes/ProtectedRoutes";
import RequireSubscription from "./routes/RequireSubscription";
import DashboardLayout from "./components/layout/DashboardLayout";
import Checkout from "./page/website/Slots/Checkout";
import DashboardError from "./page/error/DashboardError";
import Subscribe from "./page/website/dashboard/Subscribe";
import ForgotPasswordForm from "./page/ForgotPassword";
import UpdatePasswordForm from "./page/UpdatePassword";
import ProfileComponent from "./page/website/dashboard/Profile";
import MonthlyPayment from "./page/website/Slots/MonthlyPayment";
import Legal from "./page/website/Legal";
import RoadmapGuide from "./page/website/dashboard/RoadmapGuide";
import CreateFarmGroup from "./page/website/dashboard/CreateFarmGroup";
import FarmRecordsView from "./page/website/dashboard/FarmRecordsView";
import KinDetails from "./page/website/dashboard/KinDetails";
import OtherPayments from "./page/website/dashboard/OtherPayments";
import MushroomVillage from "./page/website/dashboard/MushroomVillage";
import BackendUpload from "./page/website/dashboard/BackendUpload";
import CompoundReferrals from "./page/website/dashboard/CompoundReferrals";
import FarmManagement from "./page/group-farm/FarmManagement";
import GreenCardCommunity from "./page/website/dashboard/GreenCardCommunity";
import { Analytics } from "@vercel/analytics/react";

Sentry.init({
  dsn: "https://b74e0d2a3ed4c6b73902514350956ee3@o4511001958416384.ingest.de.sentry.io/4511001967722576",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  release: "agroheal@0.0.0",
  tracePropagationTargets: ["localhost", /^https:\/\/agroheal\.solutions/],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  sendDefaultPii: true,
});

const route = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <Error />,
    children: [
      { index: true, element: <Home /> },
      { path: "about", element: <About /> },
      { path: "login", element: <Login /> },
      { path: "signup", element: <Signup /> },
      { path: "legal", element: <Legal /> },
      { path: "forgot-password", element: <ForgotPasswordForm /> },
      { path: "reset-password", element: <UpdatePasswordForm /> },
    ],
  },

  // Farm management route (direct access)
  {
    path: "/:farmSlug",
    element: <FarmManagement />,
  },

  // Only login protection
  {
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/subscribe", element: <Subscribe /> },
      { path: "/dashboard/green-card", element: <GreenCardCommunity /> },

      // dashboard area requires both a session (ProtectedRoute, above) and
      // an active subscription — RequireSubscription redirects to /subscribe
      // otherwise, so courses/checkout/farm tools/etc. are all paywalled.
      {
        path: "/dashboard",
        element: (
          <RequireSubscription>
            <Outlet />
          </RequireSubscription>
        ),
        errorElement: <DashboardError />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: "slots", element: <Slots /> },
          { path: "checkout", element: <Checkout /> },
          { path: "courses", element: <Courses /> },
          { path: "courses/:slug", element: <SingleCoursePage /> },
          { path: "profile", element: <ProfileComponent /> },
          { path: "slots-subscription", element: <MonthlyPayment /> },
          // { path: "withdrawals", element: <Withdrawals /> }, // Hidden for now
          { path: "group-farm-accounts", element: <FarmRecordsView /> },
          { path: "create-farm-group", element: <CreateFarmGroup /> },
          { path: "farm-admin", element: <FarmRecordsView /> },
          { path: "roadmap-guide", element: <RoadmapGuide /> },
          { path: "other-payments", element: <OtherPayments /> },
          { path: "mushroom-village", element: <MushroomVillage /> },
          { path: "compound-referrals", element: <CompoundReferrals /> },
          { path: "kin", element: <KinDetails /> },
          { path: "legal", element: <Legal /> },
        ],
      },
    ],
  },
]);

// RouterProvider setup
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={route} />
    <Analytics />
  </StrictMode>,
);
