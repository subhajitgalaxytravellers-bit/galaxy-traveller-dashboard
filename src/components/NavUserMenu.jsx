import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  IconDotsVertical,
  IconMoon,
  IconSun,
  IconDeviceDesktop,
  IconLogout,
  IconHierarchy3,
  IconPencil,
} from "@tabler/icons-react";
import { useTheme } from "../hooks/use-theme";
import { ConfirmationDialog } from "./dialogs/ConfirmationDialog";
import { useState } from "react";
import ExportDialog from "./dialogs/ExportDialog";
import UserDialog from "./users/CreateUserDialog";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

function NavUserMenu({ user }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const { data: roles = [] } = useQuery({
    queryKey: ["roles", "for-user-dialog"],
    queryFn: async () => {
      const { data } = await api().get("/api/roles");
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const handleLogout = () => {
    // remove tokens from local storage
    localStorage.removeItem("user_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("admin_token");

    // optionally redirect
    window.location.href = "/login";
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-1 rounded-md hover:bg-white/20 outline-none dark:hover:bg-gray-800"
            aria-label="User options"
          >
            <IconDotsVertical className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-52 border border-gray-100 dark:border-gray-700"
        >
          {/* Theme submenu */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2">
              <IconSun className="h-4 w-4" />
              <span>Theme</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="border-gray-100 dark:border-gray-700">
              <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                <DropdownMenuRadioItem
                  value="light"
                  className="flex items-center gap-2"
                >
                  <IconSun className="h-4 w-4" /> Light
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="dark"
                  className="flex items-center gap-2"
                >
                  <IconMoon className="h-4 w-4" /> Dark
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="system"
                  className="flex items-center gap-2"
                >
                  <IconDeviceDesktop className="h-4 w-4" /> System
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuItem
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
          >
            <IconPencil className="h-4 w-4" />
            Edit Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 text-red-600"
          >
            <IconLogout className="h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        title="Logout Confirmation"
        description="Are you sure you want to logout? You will need to login again to access your account."
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={handleLogout}
      />
      <UserDialog
        userCard
        open={editOpen}
        onOpenChange={setEditOpen}
        onEdited={() => setEditOpen(false)}
        user={user}
        roles={roles}
      />
    </>
  );
}

export default NavUserMenu;
