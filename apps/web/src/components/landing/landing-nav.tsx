"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { User, Menu, X } from "lucide-react";

interface LandingNavProps {
  currentPath?: string;
  subTabs?: {
    items: { id: string; label: string }[];
    activeId: string;
    onSelect: (id: string) => void;
    isDocked?: boolean;
  };
}

export function LandingNav({ currentPath, subTabs }: LandingNavProps) {
  const [isShrunk, setIsShrunk] = useState(false);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const pathname = usePathname();
  const activePath = currentPath || pathname || "/";

  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const delta = currentScrollY - lastScrollY.current;

          // Fallback scroll detection
          setIsScrolledDown(currentScrollY > 150);

          // Smooth threshold detection
          if (delta > 10 && currentScrollY > 60) {
            setIsShrunk(true);
          } else if (delta < -8 || currentScrollY <= 30) {
            setIsShrunk(false);
          }

          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });

        ticking.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact Us" },
  ];

  const showSubTabs = Boolean(
    subTabs && (subTabs.isDocked !== undefined ? subTabs.isDocked : isScrolledDown)
  );

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 flex justify-center px-4 sm:px-6 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-transform ${
        showSubTabs
          ? "pt-3 sm:pt-4"
          : isShrunk
          ? "pt-2 sm:pt-2.5"
          : "pt-4 sm:pt-5"
      }`}
    >
      {showSubTabs && subTabs ? (
        /* Standalone Dark Glass Sub-Tabs Pill (Exactly matching Image 1) */
        <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 p-1.5 rounded-full bg-slate-950/85 backdrop-blur-xl backdrop-saturate-150 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.3)] animate-in fade-in zoom-in-95 duration-300">
          {subTabs.items.map((tab) => {
            const isTabActive = subTabs.activeId === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => subTabs.onSelect(tab.id)}
                className={`px-5 sm:px-7 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold tracking-wide transition-all duration-300 cursor-pointer ${
                  isTabActive
                    ? "bg-white text-slate-950 shadow-md scale-102"
                    : "text-white/90 hover:text-white hover:bg-white/15"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      ) : (
        /* Full Navigation Bar (Home, About Us, Contact Us, Login) */
        <nav
          className={`w-full rounded-full transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-[max-width,padding,background-color,box-shadow] ${
            isShrunk
              ? "max-w-3xl sm:max-w-4xl py-1.5 px-4 sm:px-6 bg-black/20 dark:bg-black/30 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15)] border border-white/20 dark:border-white/10 scale-[0.985]"
              : "max-w-5xl py-2.5 px-6 sm:px-8 bg-black/10 dark:bg-black/20 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.15)] border border-white/20 dark:border-white/10 scale-100"
          }`}
        >
          <div className="flex items-center justify-between">
            {/* Brand Logo */}
            <Link
              href="/"
              className="flex items-center group transition-transform active:scale-95"
              aria-label="Home"
            >
              <div
                className={`relative transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                  isShrunk
                    ? "w-8 h-8 sm:w-9 sm:h-9"
                    : "w-9 h-9 sm:w-10 sm:h-10"
                }`}
              >
                <Image
                  src="/church-logo.png"
                  alt="Church Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Desktop Center Links */}
            <div className="hidden md:flex items-center gap-1 sm:gap-2 animate-in fade-in duration-300">
              {navLinks.map((link) => {
                const isActive = activePath === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
                      isActive
                        ? "text-white font-semibold bg-white/20 shadow-xs"
                        : "text-white/80 hover:text-white hover:bg-white/15"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Right Actions: Login Profile Icon & Mobile Menu Toggle */}
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 shadow-sm ${
                  activePath === "/login"
                    ? "bg-primary text-white ring-2 ring-primary/30"
                    : "bg-slate-900 text-white hover:bg-primary dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 active:scale-95"
                }`}
                title="Go to Login"
              >
                <User className="w-4 h-4" />
                <span>Login</span>
              </Link>

              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 sm:p-2 rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-colors"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 pt-3 border-t border-white/20 flex flex-col gap-1 pb-2 animate-in fade-in slide-in-from-top-2 duration-200">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-left px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                    activePath === link.href
                      ? "bg-white/20 text-white font-semibold"
                      : "text-white/80 hover:bg-white/15 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
