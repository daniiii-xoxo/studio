"use client";

import { useState, useEffect, useCallback } from "react";

export const FONT_SCALE_KEY = "cog_app_font_scale";
export const FONT_SCALE_EVENT = "cog-font-scale-changed";

export const FONT_PRESETS = [
  { id: "small", label: "Small", scale: 0.85 },
  { id: "default", label: "Default", scale: 1.0 },
  { id: "large", label: "Large", scale: 1.15 },
  { id: "xlarge", label: "Extra Large", scale: 1.3 },
] as const;

export type FontPresetId = (typeof FONT_PRESETS)[number]["id"];

/**
 * Apply the font scale to document.documentElement
 */
export function applyFontScaleToDOM(scale: number) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--font-scale", scale.toString());
  root.dataset.fontScale = scale.toString();
}

/**
 * Read the current font scale from localStorage or DOM
 */
export function getSavedFontScale(): number {
  if (typeof window === "undefined") return 1.0;
  try {
    const saved = localStorage.getItem(FONT_SCALE_KEY) || localStorage.getItem("app_font_scale");
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0.7 && parsed <= 1.6) {
        return parsed;
      }
    }
  } catch {}
  return 1.0;
}

export function useFontSize() {
  const [scale, setScaleState] = useState<number>(1.0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const currentScale = getSavedFontScale();
    setScaleState(currentScale);
    applyFontScaleToDOM(currentScale);
    setIsLoaded(true);

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      if (typeof customEvent.detail === "number") {
        setScaleState(customEvent.detail);
        applyFontScaleToDOM(customEvent.detail);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === FONT_SCALE_KEY || e.key === "app_font_scale") {
        if (e.newValue) {
          const parsed = parseFloat(e.newValue);
          if (!isNaN(parsed)) {
            setScaleState(parsed);
            applyFontScaleToDOM(parsed);
          }
        }
      }
    };

    window.addEventListener(FONT_SCALE_EVENT, handleCustomChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(FONT_SCALE_EVENT, handleCustomChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const setScale = useCallback((newScale: number) => {
    const clamped = Math.round(Math.min(Math.max(newScale, 0.75), 1.4) * 100) / 100;
    setScaleState(clamped);
    applyFontScaleToDOM(clamped);
    try {
      localStorage.setItem(FONT_SCALE_KEY, clamped.toString());
      localStorage.setItem("app_font_scale", clamped.toString());
    } catch {}

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent<number>(FONT_SCALE_EVENT, { detail: clamped })
      );
    }
  }, []);

  const setPreset = useCallback(
    (presetId: FontPresetId) => {
      const preset = FONT_PRESETS.find((p) => p.id === presetId);
      if (preset) {
        setScale(preset.scale);
      }
    },
    [setScale]
  );

  const setByIndex = useCallback(
    (index: number) => {
      const clampedIndex = Math.max(0, Math.min(index, FONT_PRESETS.length - 1));
      setScale(FONT_PRESETS[clampedIndex].scale);
    },
    [setScale]
  );

  const resetToDefault = useCallback(() => {
    setScale(1.0);
  }, [setScale]);

  // Find nearest preset
  let nearestIndex = 1;
  let minDiff = Infinity;
  FONT_PRESETS.forEach((preset, idx) => {
    const diff = Math.abs(preset.scale - scale);
    if (diff < minDiff) {
      minDiff = diff;
      nearestIndex = idx;
    }
  });

  const currentPresetLabel = FONT_PRESETS[nearestIndex].label;

  return {
    scale,
    currentIndex: nearestIndex,
    setScale,
    setPreset,
    setByIndex,
    resetToDefault,
    isLoaded,
    currentPresetLabel,
    presets: FONT_PRESETS,
  };
}
