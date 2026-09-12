import { useLocation, useRouteError } from "react-router-dom";
import { useEffect } from "react";
import Lottie from "lottie-react";
import NoDataFound from "../../assets/Icon/searching.json";

const DashboardError = () => {
  const location = useLocation();
  const error: any = useRouteError();

  useEffect(() => {
    console.error(
      "Dashboard error caught:",
      error,
      "at path:",
      location.pathname,
    );
  }, [error, location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="text-center max-w-md">
        <Lottie
          animationData={NoDataFound}
          width={250}
          height={250}
          loop={true}
        />
        <h1 className="mb-2 text-4xl font-bold">
          {error?.status === 404 ? "404" : "Error"}
        </h1>
        <p className="mb-3 text-lg font-medium text-green-900">
          {error?.status === 404
            ? "Oops! Page not found"
            : "An unexpected error occurred while loading this view"}
        </p>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl text-left overflow-auto max-h-40 font-mono">
            <p className="font-bold mb-1">Diagnostic Detail:</p>
            <p>{error?.message || error?.statusText || String(error)}</p>
          </div>
        )}
        <div className="flex items-center justify-center gap-3 mt-2">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors shadow-xs"
          >
            Reload Page
          </button>
          <a
            href="/dashboard"
            className="px-4 py-2 rounded-xl bg-gray-100 text-gray-800 font-semibold text-xs hover:bg-gray-200 transition-colors"
          >
            Return to Overview
          </a>
        </div>
      </div>
    </div>
  );
};

export default DashboardError;
