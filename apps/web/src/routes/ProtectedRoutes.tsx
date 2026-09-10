import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>
          <Spinner color="green.800" />
          <div className="text-green-800">Checking authentication...</div>
        </div>
      </div>
    );

  // sessions
  if (!session) {
    const redirectTarget = location.pathname + location.search;
    return <Navigate to={`/signin?redirect=${encodeURIComponent(redirectTarget)}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
