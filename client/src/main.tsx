import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import Login from "./pages/Login";
import BracketView from "./pages/BracketView";
import DisputesView from "./pages/DisputesView";
import MatchSubmit from "./pages/MatchSubmit";
import Settings from "./pages/Settings";
import Rules from "./pages/Rules";
import AdminPanel from "./pages/AdminPanel";
import ResetPassword from "./pages/ResetPassword";

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/login", element: <Login /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "/bracket", element: <BracketView /> },
  { path: "/disputes", element: <DisputesView /> },
  { path: "/submit/:matchId", element: <MatchSubmit /> },
  { path: "/settings", element: <Settings /> },
  { path: "/rules", element: <Rules /> },
  { path: "/admin", element: <AdminPanel /> },
]);

createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
);

