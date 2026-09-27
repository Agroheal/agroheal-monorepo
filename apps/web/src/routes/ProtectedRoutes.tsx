import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

import { useEffect, useState } from "react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const location = useLocation();
  const [timedOut, setTimedOut] = useState(false);

  // Component-level safety guard: never keep user stuck on spinner for >4.5s
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 4500);
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading && !timedOut) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  // sessions
  if (!session) {
    const redirectTarget = location.pathname + location.search;
    return <Navigate to={`/signin?redirect=${encodeURIComponent(redirectTarget)}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
