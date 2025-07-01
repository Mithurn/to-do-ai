"use client";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { FiSun, FiMoon } from "react-icons/fi";

export default function ClientDarkModeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  useEffect(() => setMounted(true), []);

  return (
    <div className="fixed top-4 right-6 z-50">
      <button
        type="button"
        aria-label="Toggle dark mode"
        title="Toggle dark mode"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="bg-white/10 border border-white/20 text-white p-2 rounded-full backdrop-blur hover:bg-white/20 transition flex items-center justify-center shadow-lg group"
      >
        {mounted && theme === "dark" ? (
          <FiSun className="text-xl" />
        ) : (
          <FiMoon className="text-xl" />
        )}
        <span className="absolute opacity-0 group-hover:opacity-100 bg-black text-white text-xs rounded px-2 py-1 ml-10 transition-opacity pointer-events-none">Toggle dark mode</span>
      </button>
    </div>
  );
} 