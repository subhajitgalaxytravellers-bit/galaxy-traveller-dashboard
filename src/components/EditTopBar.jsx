import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, Save, Settings } from "lucide-react";
import { IconChevronLeft } from "@tabler/icons-react";

import React from "react";

const EditTopBar = ({ isNew, saving, save, navigate }) => {
  const handleBack = React.useCallback(() => {
    if (typeof navigate === "function") navigate("/roles");
  }, [navigate]);

  const handleSave = React.useCallback(() => {
    if (typeof save === "function") save();
  }, [save]);

  return (
    <div className=" h-[4rem] ">
      {/* Top bar */}
      <div
        className="sticky top-0 z-30 h-full flex items-center gap-2 px-4 md:px-6 bg-gray-50 dark:bg-gray-900 py-3
                border-b border-black/5 dark:border-white/10"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          className="gap-1"
        >
          <IconChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>

        <div className="min-w-0 flex-1 ml-1">
          <div className="text-sm md:text-base font-semibold truncate">
            {isNew ? "Create Role" : "Edit Role"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="gap-1"
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">
              {saving ? "Publishing…" : "Publish"}
            </span>
          </Button>

          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                Project Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigator.clipboard?.writeText(id || "")}
              >
                Copy Role ID
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate(`/settings/roles/${id}/duplicate`)}
              >
                Duplicate Role
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => navigate(`/settings/roles/${id}/edit?delete=1`)}
              >
                Delete Role
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}
        </div>
      </div>
    </div>
  );
};

export default EditTopBar;
