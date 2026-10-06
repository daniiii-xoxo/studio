"use client";

import React from "react";
import { useTheme } from "@/hooks/use-theme";
import { Sun, Moon, Laptop, Check } from "lucide-react";
import { Switch } from "@studio/ui";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "card" | "compact" | "button";
}

export function ThemeToggle({
  className,
  variant = "card",
}: ThemeToggleProps) {
  const { theme, resolvedTheme, isDark, setTheme, toggleTheme } = useTheme();

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          "relative p-2 rounded-xl border border-border/70 bg-white dark:bg-card text-foreground hover:bg-muted/50 transition-colors shadow-2xs flex items-center justify-center cursor-pointer",
          className
        )}
        aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {isDark ? (
          <Sun className="h-4 w-4 text-amber-400 animate-in spin-in-90 duration-300" />
        ) : (
          <Moon className="h-4 w-4 text-slate-700 dark:text-slate-300 animate-in spin-in-90 duration-300" />
        )}
      </button>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* ── Top Header & Active Theme Pill ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar/10 text-sidebar dark:text-sky-400 flex items-center justify-center shrink-0 border border-sidebar/20">
            {isDark ? (
              <Moon className="h-5 w-5 text-sky-400" />
            ) : (
              <Sun className="h-5 w-5 text-amber-500" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold font-headline text-foreground">
                Color Theme
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border",
                  isDark
                    ? "bg-sky-950/60 text-sky-300 border-sky-800/60"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                )}
              >
                {isDark ? "Dark Mode Active" : "Light Mode Active"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Switch between clear high-contrast light mode and comfortable eye-friendly dark mode.
            </p>
          </div>
        </div>

        {/* Quick Toggle Switch */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto pt-1 sm:pt-0">
          <span className="text-xs font-semibold text-muted-foreground">Dark Mode</span>
          <Switch
            checked={isDark}
            onCheckedChange={toggleTheme}
            aria-label="Toggle Dark Mode"
            className="cursor-pointer"
          />
        </div>
      </div>

      {/* ── Visual Theme Selector Buttons ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Light Mode Card */}
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 group shadow-2xs",
            !isDark
              ? "border-sidebar bg-sidebar/5 dark:bg-sidebar/10 shadow-sm ring-2 ring-sidebar/20"
              : "border-border/70 bg-white dark:bg-card hover:border-sidebar/40 hover:bg-muted/30"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">
                <Sun className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Light Mode</p>
                <p className="text-[11px] text-muted-foreground">Crisp clean contrast</p>
              </div>
            </div>
            {!isDark && (
              <span className="h-5 w-5 rounded-full bg-sidebar text-white flex items-center justify-center">
                <Check className="h-3 w-3 stroke-[3]" />
              </span>
            )}
          </div>
          {/* Mini Mockup Preview */}
          <div className="h-10 rounded-xl bg-slate-100 border border-slate-200/80 p-2 flex items-center gap-2">
            <div className="h-2 w-12 rounded bg-slate-300" />
            <div className="h-2 w-16 rounded bg-slate-200" />
            <div className="ml-auto h-5 px-2 rounded bg-sidebar text-[9px] text-white flex items-center font-bold">
              Button
            </div>
          </div>
        </button>

        {/* Dark Mode Card */}
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 group shadow-2xs",
            isDark
              ? "border-sidebar bg-sidebar/10 shadow-sm ring-2 ring-sidebar/40"
              : "border-border/70 bg-white dark:bg-card hover:border-sidebar/40 hover:bg-muted/30"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-950 text-sky-400">
                <Moon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Dark Mode</p>
                <p className="text-[11px] text-muted-foreground">Comfortable in low light</p>
              </div>
            </div>
            {isDark && (
              <span className="h-5 w-5 rounded-full bg-sidebar text-white flex items-center justify-center">
                <Check className="h-3 w-3 stroke-[3]" />
              </span>
            )}
          </div>
          {/* Mini Mockup Preview */}
          <div className="h-10 rounded-xl bg-slate-900 border border-slate-800 p-2 flex items-center gap-2">
            <div className="h-2 w-12 rounded bg-slate-700" />
            <div className="h-2 w-16 rounded bg-slate-800" />
            <div className="ml-auto h-5 px-2 rounded bg-sky-600 text-[9px] text-white flex items-center font-bold">
              Button
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
