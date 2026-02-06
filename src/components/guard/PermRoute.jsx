// components/PermRoute.jsx
import React, { useMemo } from "react";
import { Outlet, useLocation, useParams } from "react-router-dom";
import { usePermissions } from "@/hooks/use-permissions";
import AccessDenied from "@/components/AccessDenied";

/**
 * Props:
 * - model?: string  // explicit modelKey (e.g. "blog")
 * - action?: 'read'|'create'|'update'|'delete' // explicit action
 * - title?: string  // optional custom title for denied page
 * - message?: string // optional custom message for denied page
 *
 * If model/action are not provided, we auto-infer from the current route:
 * - /content/:modelKey           -> read
 * - /content/:modelKey/create    -> create
 * - /content/:modelKey/:id       -> update
 * - /single/:modelKey            -> update (treat single as editable singleton)
 */
export default function PermRoute(props) {
  const { can, loading, isAdmin } = usePermissions();
  const location = useLocation();
  const params = useParams();

  const { model: propModel, action: propAction, title, message } = props;

  // --- Auto inference from URL when not provided explicitly ---
  const { model, action } = useMemo(() => {
    if (propModel && propAction) {
      return { model: propModel, action: propAction };
    }

    // patterns we care about:
    // /content/:modelKey
    // /content/:modelKey/create
    // /content/:modelKey/:id
    // /single/:modelKey
    const path = location.pathname;

    // modelKey from params if available:
    const modelKey = params.modelKey;

    if (path.startsWith("/content/")) {
      if (path.endsWith("/create")) {
        return { model: modelKey, action: "create" };
      }
      // if there is an :id segment (not "create") => update
      // crude check: last segment & not the modelKey itself
      const parts = path.split("/").filter(Boolean);
      const last = parts[parts.length - 1];
      if (last && last !== modelKey && last !== "content") {
        return { model: modelKey, action: "update" };
      }
      // default list view
      return { model: modelKey, action: "read" };
    }

    if (path.startsWith("/single/")) {
      // Single pages are essentially a view/editor for a singleton
      // ✅ Require read permission to open
      return { model: modelKey, action: "read" };
    }

    // Default: allow (no check) — useful for dashboard/not-found, etc.
    return { model: null, action: null };
  }, [propModel, propAction, location.pathname, params.modelKey]);

  if (loading) return null; // or a spinner

  // If no model/action detected, just render (e.g., Dashboard, NotFound)
  if (!model || !action) {
    return <Outlet />;
  }

  // Admin override already handled inside usePermissions.can(); but if you want:
  if (!isAdmin && !can(model, action)) {
    return (
      <AccessDenied
        title={title || "Access Denied"}
        message={
          message ||
          `You don’t have permission to ${action} “${model}”. Contact your administrator if you think this is a mistake.`
        }
      />
    );
  }

  return <Outlet />;
}
