// components/PermButton.jsx
import React from "react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";

export default function PermButton({
  model,
  action,
  onClick,
  children,
  hideIfNoPerm = true,
  ...btnProps
}) {
  const { can } = usePermissions();
  const allowed = can(model, action);

  if (!allowed && hideIfNoPerm) return null;

  const handle = (e) => {
    if (!allowed) {
      toast.error(`You don’t have permission to ${action} ${model}.`);
      return;
    }
    onClick?.(e);
  };

  return (
    <Button onClick={handle} {...btnProps}>
      {children}
    </Button>
  );
}
