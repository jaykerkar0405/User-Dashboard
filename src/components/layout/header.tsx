"use client";

import {
  Sun,
  User,
  Moon,
  Mail,
  LogOut,
  Shield,
  LayoutDashboard,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type Customer = {
  customer_id: number;
};

export type UserDetails = {
  role: string;
  user_id: string;
  mydawa_id: string;
  user_name: string;
  user_email: string;
};

const Header = () => {
  const { theme, setTheme } = useTheme();
  const { user, userDetails, logout, isAuthenticated } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const handleLogout = () => {
    logout();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const ProfileDropdown = () => (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative size-8 rounded-full">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userDetails
                ? getInitials(userDetails.user_name)
                : user?.user_id
                ? user.user_id.slice(0, 2).toUpperCase()
                : "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80" align="end" forceMount>
        {!userDetails ? (
          <div className="p-4 space-y-3">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ) : userDetails ? (
          <>
            <DropdownMenuLabel className="p-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="" alt="Profile" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {getInitials(userDetails.user_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-1">
                  <p className="text-base capitalize font-semibold">
                    {userDetails.user_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {userDetails.user_id}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup className="p-2">
              <div className="py-1.5">
                <div className="flex items-center space-x-2 text-sm text-foreground">
                  <Shield className="size-4" />
                  <span className="capitalize">{userDetails.role}</span>
                </div>
              </div>

              <div className="py-1.5">
                <div className="flex items-center space-x-2 text-sm text-foreground">
                  <User className="size-4" />
                  <span>ID: {userDetails.mydawa_id}</span>
                </div>
              </div>

              <div className="py-1.5">
                <div className="flex items-center space-x-2 text-sm text-foreground">
                  <Mail className="size-4" />
                  <span>{userDetails.user_email}</span>
                </div>
              </div>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="mr-2 size-4 text-foreground" />
              <span>Log out</span>
            </DropdownMenuItem>
          </>
        ) : (
          <div className="p-4">
            <p className="text-sm text-muted-foreground">
              Failed to load profile details
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6 md:px-16 xl:px-8">
        <Link href="/" className="flex gap-3 items-center">
          <Image
            width={0}
            height={0}
            alt="Icon"
            unoptimized
            src="/logo.png"
            className="size-8 rounded-sm"
          />
          <span className="text-xl">
            <span className="font-bold">EBT</span> Dashboard
          </span>
        </Link>

        <div className="flex items-center space-x-4">
          {isAuthenticated && <ProfileDropdown />}

          <Button
            size="icon"
            variant="outline"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="size-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute size-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
