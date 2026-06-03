"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import DarkModeToggle from "./DarkModeToggle";
import { Menu, X, LogOut, LayoutDashboard, Bell } from "lucide-react";

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 glass navbar-shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 dark:text-blue-400">
              Wanginfo
            </h1>
          </Link>

          <div className="hidden md:flex items-center gap-8 font-medium text-gray-700 dark:text-gray-200">
            <Link href="/" className="hover:text-blue-600 transition">
              Home
            </Link>
            <Link href="/#informations" className="hover:text-blue-600 transition">
              Events
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <DarkModeToggle />

            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  href="/notifications"
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition text-sm font-medium"
                >
                  <Bell size={16} />
                </Link>
                {profile?.role === "admin" && (
                  <Link
                    href="/dashboard_admin"
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-200 transition"
                  >
                    <LayoutDashboard size={16} /> Admin
                  </Link>
                )}
                <button
                  onClick={signOut}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition text-sm font-medium"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:inline-block primary-btn text-sm py-2 px-5"
              >
                Sign In
              </Link>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
          <div className="px-4 py-4 space-y-3">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 font-medium"
            >
              Home
            </Link>
            <Link
              href="/#informations"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 font-medium"
            >
              Events
            </Link>

            {user ? (
              <>
                <Link
                  href="/notifications"
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 font-medium"
                >
                  <Bell size={16} className="inline mr-2" />
                  Notifications
                </Link>
                {profile?.role === "admin" && (
                  <Link
                    href="/dashboard_admin"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium"
                  >
                    <LayoutDashboard size={16} className="inline mr-2" />
                    Dashboard Admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    signOut();
                    setMobileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 rounded-xl text-red-600 font-medium hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <LogOut size={16} className="inline mr-2" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block text-center primary-btn"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
