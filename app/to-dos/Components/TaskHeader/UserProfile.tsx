"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { FaRegUser } from "react-icons/fa6";
import { LogoutButton } from "@/LogoutBtn";
import { useUserStore } from "@/app/stores/useUserStore";

export function UserProfile() {
  const [open, setOpen] = useState(false);
  const { user } = useUserStore();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="p-0 rounded-full bg-muted ring-2 ring-primary transition-all duration-200 hover:ring-4 focus:ring-4">
          <span className="flex items-center justify-center w-9 h-9 rounded-full">
            <FaRegUser className="text-[20px] text-primary" />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px] rounded-xl shadow-card bg-card border border-border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
        <DropdownMenuLabel className="text-lg text-gray-600">
          {user?.email}
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <LogoutButton />
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
