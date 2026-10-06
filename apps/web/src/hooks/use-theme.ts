"use client";

import { useState, useEffect, useCallback } from "react";

export type ThemeMode = "light" | "dark" | "system";

export const THEME_KEY = "cog_app_theme";
export const THEME_EVENT = "cog-theme-changed";

export function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getSavedTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  try {
    const saved = localStorage.getItem(THEME_KEY) || localStorage.getItem("theme");
    if (saved === "light" || saved === "dark" || saved === "system") {
      return saved;
    }
  } catch {}
  return "light";
}

export function applyThemeToDOM(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const resolved = theme === "system" ? getSystemTheme() : theme;

  if (resolved === "dark") {
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
  }

  root.dataset.theme = resolved;
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [isLoaded, setIsLoaded] = useState(false);

  const updateTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    const resolved = newTheme === "system" ? getSystemTheme() : newTheme;
    setResolvedTheme(resolved);
    applyThemeToDOM(newTheme);

    try {
      localStorage.setItem(THEME_KEY, newTheme);
      localStorage.setItem("theme", newTheme);
    } catch {}

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent<ThemeMode>(THEME_EVENT, { detail: newTheme })
      );
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    updateTheme(nextTheme);
  }, [resolvedTheme, updateTheme]);

  useEffect(() => {
    const saved = getSavedTheme();
    setThemeState(saved);
    const resolved = saved === "system" ? getSystemTheme() : saved;
    setResolvedTheme(resolved);
    applyThemeToDOM(saved);
    setIsLoaded(true);

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<ThemeMode>;
      if (customEvent.detail) {
        setThemeState(customEvent.detail);
        const nextResolved =
          customEvent.detail === "system" ? getSystemTheme() : customEvent.detail;
        setResolvedTheme(nextResolved);
        applyThemeToDOM(customEvent.detail);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_KEY || e.key === "theme") {
        if (e.newValue === "light" || e.newValue === "dark" || e.newValue === "system") {
          setThemeState(e.newValue);
          const nextResolved =
            e.newValue === "system" ? getSystemTheme() : e.newValue;
          setResolvedTheme(nextResolved);
          applyThemeToDOM(e.newValue);
        }
      }
    };

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (getSavedTheme() === "system") {
        const sys = getSystemTheme();
        setResolvedTheme(sys);
        applyThemeToDOM("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    window.addEventListener(THEME_EVENT, handleCustomChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemChange);
      window.removeEventListener(THEME_EVENT, handleCustomChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return {
    theme,
    resolvedTheme,
    isDark: resolvedTheme === "dark",
    setTheme: updateTheme,
    toggleTheme,
    isLoaded,
  };
}
