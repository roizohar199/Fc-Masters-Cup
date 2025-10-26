import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";

// Eager load critical pages
import App from "./App";
import Login from "./pages/Login";

// Lazy load secondary pages for better performance
const BracketView = lazy(() => import("./pages/BracketView"));
const DisputesView = lazy(() => import("./pages/DisputesView"));
const MatchSubmit = lazy(() => import("./pages/MatchSubmit"));
const Settings = lazy(() => import("./pages/Settings"));
const Rules = lazy(() => import("./pages/Rules"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// New tournament bracket management pages
const ManualBracketManager = lazy(() => import("./pages/admin/ManualBracketManager"));
const TournamentBracketLive = lazy(() => import("./pages/public/TournamentBracketLive"));

// Loading component
const LoadingFallback = () => (
  <div style={{
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  }}>
    <div style={{ textAlign: "center", color: "#fff" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>טוען...</div>
    </div>
  </div>
);

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/login", element: <Login /> },
  { 
    path: "/reset-password", 
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <ResetPassword />
      </Suspense>
    )
  },
  { 
    path: "/bracket", 
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <BracketView />
      </Suspense>
    )
  },
  { 
    path: "/disputes", 
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <DisputesView />
      </Suspense>
    )
  },
  { 
    path: "/submit/:matchId", 
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <MatchSubmit />
      </Suspense>
    )
  },
  { 
    path: "/settings", 
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Settings />
      </Suspense>
    )
  },
  { 
    path: "/rules", 
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Rules />
      </Suspense>
    )
  },
  { 
    path: "/admin", 
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <AdminPanel />
      </Suspense>
    )
  },
  { 
    path: "/admin/tournaments/manual", 
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <ManualBracketManager />
      </Suspense>
    )
  },
  { 
    path: "/tournaments/:id/live", 
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <TournamentBracketLive />
      </Suspense>
    )
  },
]);

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <RouterProvider router={router} />
  </ErrorBoundary>
);

