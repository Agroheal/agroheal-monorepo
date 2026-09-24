import { createBrowserRouter, Outlet, Navigate } from "react-router-dom";

// Page & Layout Imports
import Home from "@/page/website/Home";
import Layout from "@/components/layout/Layout";
import Error from "@/page/error/Error";
import About from "@/page/website/About";
import HowItWorks from "@/page/website/HowItWorks";
import Careers from "@/page/website/Careers";
import Login from "@/page/website/Login";
import Signup from "@/page/website/Signup";
import BuySlots from "@/page/website/Slots/BuySlots";
import MyFarmSlots from "@/page/website/Slots/MyFarmSlots";
import Courses from "@/page/website/Courses/Courses";
import Dashboard from "@/page/website/dashboard/Dashboard";
import SingleCoursePage from "@/page/website/Courses/CoursesDetails";
import ProtectedRoute from "./ProtectedRoutes";
import RequireSubscription from "./RequireSubscription";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Checkout from "@/page/website/Slots/Checkout";
import DashboardError from "@/page/error/DashboardError";
import Subscribe from "@/page/website/dashboard/Subscribe";
import ForgotPasswordForm from "@/page/ForgotPassword";
import UpdatePasswordForm from "@/page/UpdatePassword";
import ProfileComponent from "@/page/website/dashboard/Profile";
import Legal from "@/page/website/Legal";
import RoadmapGuide from "@/page/website/dashboard/RoadmapGuide";
import CreateFarmGroup from "@/page/website/dashboard/CreateFarmGroup";
import FarmRecordsView from "@/page/website/dashboard/FarmRecordsView";
import KinDetails from "@/page/website/dashboard/KinDetails";
import OtherPayments from "@/page/website/dashboard/OtherPayments";
import MushroomVillage from "@/page/website/dashboard/MushroomVillage";
import CompoundReferrals from "@/page/website/dashboard/CompoundReferrals";
import FarmManagement from "@/page/group-farm/FarmManagement";
import GreenCardCommunity from "@/page/website/dashboard/GreenCardCommunity";
import VerifyCard from "@/page/website/VerifyCard";
import TransactionLedger from "@/page/website/dashboard/TransactionLedger";
import ConsumerNetwork from "@/page/website/dashboard/ConsumerNetwork";
import ProducerNetwork from "@/page/website/dashboard/ProducerNetwork";
import KnowledgeBase from "@/page/website/dashboard/KnowledgeBase";
import CustomerService from "@/page/website/dashboard/CustomerService";

import CoursesBridge from "@/page/website/CoursesBridge";
import FarmSlotsBridge from "@/page/website/FarmSlotsBridge";
import AffiliateBridge from "@/page/website/AffiliateBridge";

export const appRouter = createBrowserRouter([
  // Public Marketing & Informational Routes
  {
    path: "/",
    element: <Layout />,
    errorElement: <Error />,
    children: [
      { index: true, element: <Home /> },
      { path: "about", element: <About /> },
      { path: "how-it-works", element: <HowItWorks /> },
      { path: "courses", element: <CoursesBridge /> },
      { path: "farm-slots", element: <FarmSlotsBridge /> },
      { path: "slots", element: <FarmSlotsBridge /> },
      { path: "affiliate", element: <AffiliateBridge /> },
      { path: "careers", element: <Careers /> },
      { path: "legal", element: <Legal /> },
      { path: "privacy", element: <Legal /> },
      { path: "terms", element: <Legal /> },
      { path: "signin", element: <Login /> },
      { path: "signup", element: <Signup /> },
      { path: "forgot-password", element: <ForgotPasswordForm /> },
      { path: "reset-password", element: <UpdatePasswordForm /> },
      { path: "verify-card/:memberId", element: <VerifyCard /> },
    ],
  },

  // Farm Management Route (Session Protected)
  {
    path: "/:farmSlug",
    element: (
      <ProtectedRoute>
        <FarmManagement />
      </ProtectedRoute>
    ),
  },

  // Member Portal & Dashboard Routes (Session Protected)
  {
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/subscribe", element: <Subscribe /> },
      {
        path: "/dashboard/green-card",
        element: <Navigate to="/dashboard/profile/green-card" replace />,
      },

      // Core dashboard area is accessible to all registered members (both subscribed
      // and unsubscribed). Unsubscribed members can track their referral link, organogram,
      // and accumulating wallet earnings. Specific paid features (courses, farm tools, green card)
      // are individually paywalled with RequireSubscription.
      {
        path: "/dashboard",
        element: <Outlet />,
        errorElement: <DashboardError />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: "transactions", element: <TransactionLedger /> },
          { path: "wallet", element: <Navigate to="/dashboard/transactions" replace /> },

          // Farm Operations (strict nested domain structure)
          {
            path: "farm-operations",
            element: (
              <Navigate to="/dashboard/farm-operations/buy-slots" replace />
            ),
          },
          { path: "farm-operations/buy-slots", element: <BuySlots /> },
          { path: "farm-operations/my-slots", element: <MyFarmSlots /> },

          // My Network (strict nested domain structure)
          { path: "my-network", element: <CompoundReferrals /> },
          { path: "my-network/producer", element: <ProducerNetwork /> },
          { path: "my-network/consumer", element: <ConsumerNetwork /> },

          // Profile & Green Card (strict nested domain structure)
          { path: "profile", element: <ProfileComponent /> },
          {
            path: "profile/green-card",
            element: (
              <RequireSubscription>
                <GreenCardCommunity />
              </RequireSubscription>
            ),
          },

          { path: "checkout", element: <Checkout /> },
          {
            path: "courses",
            element: (
              <RequireSubscription>
                <Courses />
              </RequireSubscription>
            ),
          },
          {
            path: "courses/:slug",
            element: (
              <RequireSubscription>
                <SingleCoursePage />
              </RequireSubscription>
            ),
          },
          {
            path: "group-farm-accounts",
            element: (
              <RequireSubscription>
                <FarmRecordsView />
              </RequireSubscription>
            ),
          },
          { path: "create-farm-group", element: <CreateFarmGroup /> },
          { path: "farm-admin", element: <FarmRecordsView /> },
          { path: "roadmap-guide", element: <RoadmapGuide /> },
          { path: "other-payments", element: <OtherPayments /> },
          { path: "mushroom-village", element: <MushroomVillage /> },
          { path: "kin", element: <KinDetails /> },
          { path: "legal", element: <Legal /> },
          { path: "help/knowledge-base", element: <KnowledgeBase /> },
          { path: "help/customer-service", element: <CustomerService /> },
        ],
      },
    ],
  },
]);

export default appRouter;
