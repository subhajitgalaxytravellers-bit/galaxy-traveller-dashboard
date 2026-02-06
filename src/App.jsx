// App.jsx (refactored)
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import MainLayout from "./layout/main";
import Dashboard from "./pages/main/Dashboard";
import NotFound from "./pages/NotFound";
import Users from "./pages/main/Users";
import RoleSettings from "./pages/main/Role";
import ContentFormPage from "./pages/dynamic/ContentFormPage";
import DynamicTable from "./pages/dynamic/DynamicTable";
import RoleEditPanel from "./components/roles/RoleEditPanel";
import AuthPage from "./pages/auth/auth";

// ✅ single source for auth helpers
import { getToken, isTokenExpired, clearAuth } from "./lib/config";
import ImageManager from "./pages/main/Image";
import SingleFormPage from "./pages/dynamic/SingleFormPage";
import PermRoute from "./components/guard/PermRoute";
import CreatorRequestsPage from "./pages/main/CreatorRequest";
import SettingsPage from "./pages/main/Setting";
import FlyersPage from "./pages/main/Flyer";
import PoliciesPage from "./pages/main/Terms&Policies";
import CouponsPage from "./pages/main/Coupons";

/** Protects private routes */
function RequireAuth() {
  const token = getToken();
  const location = useLocation();

  // no token or expired → purge + go to /auth
  if (!token || isTokenExpired(token)) {
    clearAuth();
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

/** Prevents visiting /auth if already logged in */
function PublicOnlyRoute({ children }) {
  const token = getToken();

  // no token → allow auth page
  if (!token) return children;

  // stale token → clear and allow auth page
  if (isTokenExpired(token)) {
    clearAuth();
    return children;
  }

  // valid token → send to app
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* PUBLIC: Auth */}
      <Route
        path="/auth"
        element={
          <PublicOnlyRoute>
            <AuthPage />
          </PublicOnlyRoute>
        }
      />

      {/* PROTECTED */}
      <Route element={<RequireAuth />}>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route element={<PermRoute model="users" action="read" />}>
            <Route path="users" element={<Users />} />
          </Route>
          <Route element={<PermRoute model="flyers" action="read" />}>
            <Route path="flyers" element={<FlyersPage />} />
          </Route>
          <Route element={<PermRoute model="policy" action="read" />}>
            <Route path="policy" element={<PoliciesPage />} />
          </Route>
          <Route element={<PermRoute model="coupon" action="read" />}>
            <Route path="coupons" element={<CouponsPage />} />
          </Route>
          <Route element={<PermRoute model="settings" action="read" />}>
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route element={<PermRoute model="creatorRequest" action="read" />}>
            <Route path="creatorRequests" element={<CreatorRequestsPage />} />
          </Route>

          <Route element={<PermRoute model="roles" action="read" />}>
            <Route path="roles" element={<RoleSettings />} />
            <Route path="roles/new" element={<RoleEditPanel />} />
            <Route path="roles/:id/edit" element={<RoleEditPanel />} />
          </Route>
          {/* Dynamic content (auto-infer model/action) */}
          <Route element={<PermRoute />}>
            <Route path="content/:modelKey" element={<DynamicTable />} />{" "}
            {/* read */}
            <Route
              path="content/:modelKey/create"
              element={<ContentFormPage />}
            />{" "}
            {/* create */}
            <Route
              path="content/:modelKey/:id"
              element={<ContentFormPage />}
            />{" "}
            {/* update */}
          </Route>
          <Route element={<PermRoute action="read" />}>
            <Route path="single/:modelKey" element={<SingleFormPage />} />
          </Route>
          {/* Public-ish tools that you don’t want to guard by perms */}
          <Route element={<PermRoute action="read" model="images" />}>
            <Route path="images" element={<ImageManager />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
