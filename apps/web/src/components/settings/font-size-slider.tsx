"use client";

import React from "react";
import { useFontSize, FONT_PRESETS } from "@/hooks/use-font-size";
import { Slider, Button } from "@studio/ui";
import { Type, RotateCcw, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface FontSizeSliderProps {
  className?: string;
  showPreview?: boolean;
}

export function FontSizeSlider({
  className,
  showPreview = true,
}: FontSizeSliderProps) {
  const { scale, currentIndex, setByIndex, setPreset, resetToDefault, currentPresetLabel } =
    useFontSize();

  const handleSliderChange = (vals: number[]) => {
    if (vals.length > 0) {
      setByIndex(vals[0]);
    }
  };

  const currentPx = Math.round(16 * scale);

  return (
    <div className={cn("space-y-6", className)}>
      {/* ── Top Header & Current Value Pill ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar/10 text-sidebar dark:text-sky-400 flex items-center justify-center shrink-0 border border-sidebar/20">
            <Type className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <label
                htmlFor="font-size-slider-input"
                className="text-sm sm:text-base font-bold font-headline text-foreground cursor-pointer"
              >
                Font Size
              </label>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-sidebar/10 text-sidebar dark:bg-sky-950/60 dark:text-sky-300 border border-sidebar/20">
                {currentPresetLabel} ({currentPx}px)
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Adjust text size across the entire application (default: 16px).
            </p>
          </div>
        </div>

        {currentIndex !== 1 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resetToDefault}
            className="self-start sm:self-auto h-8 px-3 rounded-lg text-xs font-semibold gap-1.5 border-border/80 hover:bg-muted/50 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Reset to Default (16px)</span>
          </Button>
        )}
      </div>

      {/* ── The Slider Track & Thumb ── */}
      <div className="bg-slate-50/80 dark:bg-muted/30 rounded-2xl border border-border/60 p-5 sm:p-6 space-y-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Smaller (14px)</span>
            <span className="text-[11px] font-bold uppercase tracking-wider">Larger (20px)</span>
          </div>

          <div className="py-2 px-1">
            <Slider
              id="font-size-slider-input"
              value={[currentIndex]}
              min={0}
              max={3}
              step={1}
              onValueChange={handleSliderChange}
              aria-label="Font Size Slider"
              className="cursor-pointer"
            />
          </div>

          {/* Preset tick markers below slider */}
          <div className="grid grid-cols-4 text-center pt-1 text-xs">
            <button
              type="button"
              onClick={() => setPreset("small")}
              className={cn(
                "flex flex-col items-start text-left cursor-pointer transition-colors group",
                currentIndex === 0
                  ? "text-sidebar dark:text-sky-400 font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="text-xs font-semibold">Small (14px)</span>
            </button>

            <button
              type="button"
              onClick={() => setPreset("default")}
              className={cn(
                "flex flex-col items-center cursor-pointer transition-colors group",
                currentIndex === 1
                  ? "text-sidebar dark:text-sky-400 font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="text-xs font-semibold">Default (16px)</span>
            </button>

            <button
              type="button"
              onClick={() => setPreset("large")}
              className={cn(
                "flex flex-col items-center cursor-pointer transition-colors group",
                currentIndex === 2
                  ? "text-sidebar dark:text-sky-400 font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="text-xs font-semibold">Large (18px)</span>
            </button>

            <button
              type="button"
              onClick={() => setPreset("xlarge")}
              className={cn(
                "flex flex-col items-end text-right cursor-pointer transition-colors group",
                currentIndex === 3
                  ? "text-sidebar dark:text-sky-400 font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="text-xs font-semibold">Extra Large (20px)</span>
            </button>
          </div>
        </div>

        {/* ── Preset Buttons for Quick Selection ── */}
        <div className="pt-2 border-t border-border/50">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
            Quick Presets
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FONT_PRESETS.map((preset, idx) => {
              const isSelected = currentIndex === idx;
              const px = Math.round(16 * preset.scale);
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setPreset(preset.id)}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-2xs",
                    isSelected
                      ? "border-sidebar bg-sidebar text-white shadow-xs dark:bg-sidebar"
                      : "border-border/70 bg-white dark:bg-card text-foreground hover:border-sidebar/40 hover:bg-muted/40"
                  )}
                >
                  <span>{preset.label} <span className="opacity-75 font-normal">({px}px)</span></span>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Live Interactive Preview Box ── */}
      {showPreview && (
        <div className="rounded-2xl border border-border/60 bg-white dark:bg-card p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sidebar dark:text-sky-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Live Text Preview
              </h4>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              Size: {currentPresetLabel} ({currentPx}px)
            </span>
          </div>

          <div className="p-4 rounded-xl border border-border/50 bg-muted/[0.15] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xl font-bold font-headline text-foreground leading-tight">
                Church of God Dasmariñas
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                Active System
              </span>
            </div>

            <p className="text-sm text-foreground/90 leading-relaxed">
              This is a live preview of how body text, titles, forms, navigation labels, and
              tables appear across the web app. As you adjust the slider above, every glyph and letter
              visibly changes size.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="text-xs text-muted-foreground">
                Navigation: Workers • Attendance • Inventory • Settings
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
