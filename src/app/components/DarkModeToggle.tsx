"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/app/context/ThemeContext";

export default function DarkModeToggle() {
  const { dark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
      aria-label="Toggle dark mode"
    >
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
