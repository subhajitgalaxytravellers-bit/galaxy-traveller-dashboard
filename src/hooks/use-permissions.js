import { useMemo } from 'react';
import { useRoleId } from './use-role';
import { useCurrentUser } from './use-currentuser';

export function usePermissions() {
  const { data: me, isLoading: meLoading } = useCurrentUser();
  const roleId = me?.roleId || null;

  // fetch role only when we have an id
  const {
    data: role,
    isLoading: roleLoading,
    isError: roleError,
  } = useRoleId(roleId);

  // normalize (defensive)
  const perms = role?.permissions || {};
  const roleName = me?.roleName?.toLowerCase();
  const can = useMemo(() => {
    return (modelKey, action) => {
      if (!modelKey || !action) return false;

      // ✅ Admin override: full access
      if (roleName === 'admin' || role?.name?.toLowerCase() === 'admin') {
        return true;
      }
      const p = perms[modelKey];
      if (!p) return false;
      return !!p[action]; // action in: "create" | "read" | "update" | "delete"
    };
  }, [perms]);

  return {
    me,
    role,
    can,
    isReady: !meLoading && !roleLoading && !roleError,
    loading: meLoading || roleLoading,
    error: roleError ? 'Failed to load role' : null,
  };
}
