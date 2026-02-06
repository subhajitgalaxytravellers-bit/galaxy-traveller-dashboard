import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import NavUserMenu from "./NavUserMenu";


export function NavUser({ user }) {
  if (!user) return null; // <-- move AFTER hooks

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div className="flex items-center gap-4 p-5 h-16 justify-evenly border-t border-gray-200 dark:border-gray-700">
      {/* Avatar + user info */}
      <div className="flex items-center gap-4">
        <Avatar className="w-11 h-11 ring-2 rounded-md ring-gray-200 dark:ring-gray-700">
          <AvatarImage
            className="w-11 h-11 rounded-md"
            src={user.profileImg}
            alt={user.name}
          />
          <AvatarFallback className="bg-gray-100 dark:bg-gray-800 rounded-md text-gray-700 dark:text-gray-300 font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col max-w-[125px]">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {user.name}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {user.email}
          </span>
        </div>
      </div>

      {/* Dropdown trigger */}
      <NavUserMenu user={user} />
    </div>
  );
}
