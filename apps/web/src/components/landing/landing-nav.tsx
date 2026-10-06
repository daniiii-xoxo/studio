"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { User, Menu, X, Home, Info, Phone, ChevronRight } from "lucide-react";

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

  // Close mobile menu whenever pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Handle ESC key, body scroll lock, and window resize
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

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
    { href: "/", label: "Home", icon: Home },
    { href: "/about", label: "About Us", icon: Info },
    { href: "/contact", label: "Contact Us", icon: Phone },
  ];

  const showSubTabs = Boolean(
    subTabs && (subTabs.isDocked !== undefined ? subTabs.isDocked : isScrolledDown)
  );

  return (
    <>
      {/* Mobile Backdrop Overlay - closes menu on tap outside */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <header
        className={`fixed top-0 left-0 right-0 z-50 flex justify-center px-4 sm:px-6 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-transform ${showSubTabs
          ? "pt-3 sm:pt-4"
          : isShrunk
            ? "pt-2 sm:pt-2.5"
            : "pt-3.5 sm:pt-5"
          }`}
      >
        {showSubTabs && subTabs ? (
          /* Standalone Dark Glass Sub-Tabs Pill */
          <div className="inline-flex max-w-[calc(100vw-2rem)] overflow-x-auto no-scrollbar items-center justify-start sm:justify-center gap-1.5 sm:gap-2 p-1.5 rounded-full bg-slate-950/85 backdrop-blur-xl backdrop-saturate-150 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.3)] animate-in fade-in zoom-in-95 duration-300">
            {subTabs.items.map((tab) => {
              const isTabActive = subTabs.activeId === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => subTabs.onSelect(tab.id)}
                  className={`px-4 sm:px-7 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold tracking-wide transition-all duration-300 whitespace-nowrap cursor-pointer ${isTabActive
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
          /* Main Navigation Bar */
          <nav
            className={`w-full transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-[max-width,padding,background-color,box-shadow,border-radius] ${mobileMenuOpen
              ? "max-w-sm sm:max-w-md rounded-2xl sm:rounded-3xl p-4 bg-slate-950/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.25)] border border-white/20 animate-in fade-in zoom-in-95 duration-200"
              : isShrunk
                ? "max-w-3xl sm:max-w-4xl rounded-full py-1.5 px-4 sm:px-6 bg-black/25 dark:bg-black/35 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15)] border border-white/20 dark:border-white/10 scale-[0.985]"
                : "max-w-5xl rounded-full py-2 px-4 sm:py-2.5 sm:px-8 bg-black/15 dark:bg-black/25 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.15)] border border-white/20 dark:border-white/10 scale-100"
              }`}
          >
            {mobileMenuOpen ? (
              /* Mobile Open Menu Layout (User-friendly Card, not oval egg) */
              <div className="flex flex-col gap-3">
                {/* Mobile Header Row */}
                <div className="flex items-center justify-between">
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 group active:scale-95 transition-transform"
                    aria-label="Home"
                  >
                    <div className="relative w-8 h-8">
                      <Image
                        src="/church-logo.png"
                        alt="Church Logo"
                        fill
                        className="object-contain"
                        priority
                      />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-bold text-white tracking-tight leading-tight">
                        COG Dasmariñas
                      </span>
                      <span className="text-[10px] text-blue-300 font-medium tracking-wide">
                        Main Sanctuary
                      </span>
                    </div>
                  </Link>

                  {/* Clean Close Button */}
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-white flex items-center justify-center transition-all border border-white/15"
                    aria-label="Close Navigation Menu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Subtle Divider */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />

                {/* Mobile Navigation Links */}
                <div className="flex flex-col gap-1">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = activePath === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                          ? "bg-blue-600/25 text-white font-semibold border border-blue-400/30 shadow-xs"
                          : "text-slate-300 hover:text-white hover:bg-white/10 active:bg-white/15"
                          }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isActive
                            ? "bg-blue-500/30 text-blue-300"
                            : "bg-white/10 text-white/70"
                            }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="flex-1">{link.label}</span>
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${isActive ? "text-blue-300 translate-x-0.5" : "text-white/30"
                            }`}
                        />
                      </Link>
                    );
                  })}
                </div>

                {/* Member / Staff Login CTA */}
                <div className="pt-2 border-t border-white/10">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all shadow-lg active:scale-[0.98] ${activePath === "/login"
                      ? "bg-primary text-white ring-2 ring-primary/40 shadow-primary/30"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-900/40"
                      }`}
                  >
                    <User className="w-4 h-4" />
                    <span> Login</span>
                  </Link>
                </div>
              </div>
            ) : (
              /* Closed Navbar (Desktop Bar & Mobile Floating Pill) */
              <div className="flex items-center justify-between">
                {/* Brand Logo */}
                <Link
                  href="/"
                  className="flex items-center group transition-transform active:scale-95"
                  aria-label="Home"
                >
                  <div
                    className={`relative transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${isShrunk
                      ? "w-8 h-8 sm:w-9 sm:h-9"
                      : "w-8 h-8 sm:w-10 sm:h-10"
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
                        className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${isActive
                          ? "text-white font-semibold bg-white/20 shadow-xs"
                          : "text-white/80 hover:text-white hover:bg-white/15"
                          }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>

                {/* Right Actions: Login Button & Mobile Hamburger Toggle */}
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 shadow-sm ${activePath === "/login"
                      ? "bg-primary text-white ring-2 ring-primary/30"
                      : "bg-slate-900 text-white hover:bg-primary dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 active:scale-95"
                      }`}
                    title="Go to Login"
                  >
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Login</span>
                  </Link>

                  {/* Mobile Hamburger Toggle Button */}
                  <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="md:hidden p-1.5 rounded-full text-white/90 hover:text-white hover:bg-white/15 active:scale-90 transition-all"
                    aria-label="Open Navigation Menu"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </nav>
        )}
      </header>
    </>
  );
}

