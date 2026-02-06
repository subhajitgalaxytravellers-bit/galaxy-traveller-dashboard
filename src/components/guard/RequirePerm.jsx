// components/RequirePerm.jsx
import React from 'react';
import { usePermissions } from '@/hooks/use-permissions';

export default function RequirePerm({
  model,
  action = 'read',
  children,
  fallback = null, // e.g. <div>You don't have access</div>
  loadingFallback = null,
}) {
  const { can, loading } = usePermissions();

  if (loading) return loadingFallback;
  if (!can(model, action)) return fallback;

  return <>{children}</>;
}
