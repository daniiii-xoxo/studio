"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Users,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  Target,
  Compass,
  CheckCircle2,
  Clock,
  BookOpen,
  Church,
  ScrollText,
  MapPin,
} from "lucide-react";
import { LandingNav } from "@/components/landing/landing-nav";

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState<"history" | "beliefs" | "services">("history");
  const [isDocked, setIsDocked] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const el = document.getElementById("about-subtabs-hero");
      if (el) {
        const rect = el.getBoundingClientRect();
        // Morph only when the bottom of top navbar touches the subtabs bar (~75px from top)
        const isTouching = rect.top <= 75;
        setIsDocked(isTouching);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col selection:bg-primary selection:text-white">
      {/* Floating Pill Navigation Header */}
      <LandingNav
        currentPath="/about"
        subTabs={{
          items: [
            { id: "history", label: "Church History" },
            { id: "beliefs", label: "What We Believe" },
            { id: "services", label: "Services" },
          ],
          activeId: activeTab,
          onSelect: (id) => setActiveTab(id as "history" | "beliefs" | "services"),
          isDocked,
        }}
      />

      {/* Header Banner */}
      <section className="relative pt-24 sm:pt-28 pb-5 sm:pb-6 px-4 sm:px-6 overflow-hidden bg-slate-950 text-white">
        {/* Background Ambient Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/cog-bg8.jfif"
            alt="COG Dasmariñas"
            fill
            className="object-cover opacity-75 scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950/40 to-slate-950/75" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center pt-5 sm:pt-8">
          {/* Main Headline - High Visibility */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-tight mb-3 sm:mb-4">
            <span className="text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] block mb-1">
              Loving God, Serving People,
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-sky-200 to-indigo-200 drop-shadow-sm">
              Transforming Communities
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-200/90 max-w-3xl mx-auto leading-relaxed mb-10 sm:mb-12 drop-shadow">
            We are a vibrant, Christ-centered family committed to making disciples, raising godly leaders, and shining God&apos;s love in Cavite and beyond.
          </p>

          {/* Glass Type Navigation Buttons Bar */}
          <div
            id="about-subtabs-hero"
            className={`inline-flex transition-all duration-300 ${isDocked ? "opacity-0 pointer-events-none scale-95" : "opacity-100 scale-100"
              }`}
          >
            <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 p-1.5 rounded-2xl sm:rounded-full bg-white/10 backdrop-blur-xl backdrop-saturate-150 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37),inset_0_1px_1px_rgba(255,255,255,0.3)]">
              <button
                onClick={() => setActiveTab("history")}
                className={`px-5 sm:px-7 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold tracking-wide transition-all duration-300 cursor-pointer ${activeTab === "history"
                    ? "bg-white text-slate-950 shadow-md scale-102"
                    : "text-white/90 hover:text-white hover:bg-white/15"
                  }`}
              >
                Church History
              </button>

              <button
                onClick={() => setActiveTab("beliefs")}
                className={`px-5 sm:px-7 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold tracking-wide transition-all duration-300 cursor-pointer ${activeTab === "beliefs"
                    ? "bg-white text-slate-950 shadow-md scale-102"
                    : "text-white/90 hover:text-white hover:bg-white/15"
                  }`}
              >
                What We Believe
              </button>

              <button
                onClick={() => setActiveTab("services")}
                className={`px-5 sm:px-7 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold tracking-wide transition-all duration-300 cursor-pointer ${activeTab === "services"
                    ? "bg-white text-slate-950 shadow-md scale-102"
                    : "text-white/90 hover:text-white hover:bg-white/15"
                  }`}
              >
                Services
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* DYNAMIC CONTENT SECTIONS (Driven by the 3 Glass Buttons)     */}
      {/* ============================================================ */}

      {/* 1. TAB: CHURCH HISTORY */}
      {activeTab === "history" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <section className="relative pt-14 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden border-t border-slate-200/80 dark:border-slate-800">
            {/* Background Ambient Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-80 bg-gradient-to-b from-blue-500/8 via-indigo-500/5 to-transparent blur-3xl pointer-events-none" />

            <div className="relative max-w-6xl mx-auto">
              {/* Header Title */}
              <div className="text-center sm:text-left mb-8 sm:mb-10">
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white uppercase leading-tight">
                  OUR CHURCH <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 dark:from-blue-400 dark:via-indigo-300 dark:to-sky-300">HISTORY</span>
                </h2>
              </div>

              {/* Historical Chapter 1: 1990 */}
              <div className="mb-12 sm:mb-16 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] p-6 sm:p-8 transition-all">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
                  {/* Left: Story Narrative */}
                  <div className="lg:col-span-7 flex flex-col sm:flex-row gap-5 sm:gap-6 items-start">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-lg shadow-blue-500/25">
                      1990
                    </div>
                    <div className="space-y-3.5 flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                        Risen Lord Christian Fellowship (RCLF)
                      </h3>

                      <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                        In the early 1990s, <strong className="text-slate-900 dark:text-white font-semibold">Anthony Velasco</strong> was invited by a pastor to join Bible studies in <span className="text-blue-600 dark:text-blue-400 font-medium">Brgy. Salitran 4, Dasmariñas</span>, in the province of Cavite.
                      </p>
                      <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                        By the second Sunday of <strong className="text-slate-900 dark:text-white font-semibold">August 1990</strong>, their commitment grew into a church called <strong className="text-slate-900 dark:text-white font-semibold">Risen Lord Christian Fellowship (RCLF)</strong>, initiated by three people along with Anthony, <strong className="text-slate-900 dark:text-white font-semibold">Georgeanna Luat</strong> (Anthony&apos;s fiancée at that time), and a pastor.
                      </p>
                    </div>
                  </div>

                  {/* Right: Museum Showcase Photo Frame */}
                  <div className="lg:col-span-5">
                    <div className="group relative rounded-2xl p-2.5 sm:p-3 bg-gradient-to-b from-slate-200/80 via-slate-100 to-slate-200/80 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 border border-slate-300/80 dark:border-slate-700 shadow-xl transition-all duration-300">
                      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-950">
                        <Image
                          src="/worship-place-1.jpg"
                          alt="First Worship Place in Salitran, 1990"
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          priority
                        />
                        <div className="absolute inset-0 ring-1 ring-inset ring-black/15 rounded-xl pointer-events-none" />
                      </div>

                      <div className="pt-3 pb-1 px-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                            First Worship Place in Salitran, 1990
                          </span>
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs">
                          Historical Archive
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Historical Chapter 2: 1994 - 2008 */}
              <div className="mb-12 sm:mb-16 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] p-6 sm:p-8 transition-all">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
                  {/* Left: Story Narrative */}
                  <div className="lg:col-span-7 flex flex-col sm:flex-row gap-5 sm:gap-6 items-start">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-600 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-lg shadow-indigo-500/25">
                      2006
                    </div>
                    <div className="space-y-4 flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                        Growth, Vision & The COG Dasmariñas Sanctuary
                      </h3>

                      <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                        In 1994, the Lord impressed upon the church that its worship center be located at the Dasmariñas downtown. Salitran wasn&apos;t at all strategic for reaching more souls for Jesus. Despite the challenge of a higher rental fee, the church pushed through. The following Sunday, the <em>Security Bank Days</em> (as many would call it) came to birth. In the same year, the church became affiliated with Word for the World Christian Fellowship.
                      </p>

                      <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                        After three years, the church&apos;s name became <strong>Word International Ministries (WIM)</strong>. In 1998, it moved to a 1,600 square meter UMC warehouse beside DLSU Medical Center Dasmariñas and was converted into a worship center.
                      </p>

                      <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                        Then in 2000, the Lord envisioned Himself to Ptr. Anthony in a dream saying <em>&ldquo;I will bless you&rdquo;</em>. He imparted this gift to the church which initiated the plan to start building the church&apos;s own sanctuary.
                      </p>

                      <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                        To fulfill this, the church had to move to Marilag Subdivision along Aguinaldo Highway before December 2002 to avoid renewing contract with the UMC warehouse for another five years. As God&apos;s favor was truly upon the church, it was able to move to Marilag in time. It was also in 2002 when the church became <strong>Church of God Dasmariñas, World Missions of the Philippines</strong> with 1,500 members. In 2006, the church sanctuary was completely finished and continued to become a witness to numerous ministries. Then in 2008, the COG Jabez was built through the collected funds from a concert.
                      </p>
                    </div>
                  </div>

                  {/* Right: Museum Showcase Photo Frame */}
                  <div className="lg:col-span-5">
                    <div className="group relative rounded-2xl p-2.5 sm:p-3 bg-gradient-to-b from-slate-200/80 via-slate-100 to-slate-200/80 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 border border-slate-300/80 dark:border-slate-700 shadow-xl transition-all duration-300">
                      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-950">
                        <Image
                          src="/worship-place-2.jpg"
                          alt="COG Dasmariñas, 2006"
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          priority
                        />
                        <div className="absolute inset-0 ring-1 ring-inset ring-black/15 rounded-xl pointer-events-none" />
                      </div>

                      <div className="pt-3 pb-1 px-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                            COG Dasmariñas, 2006
                          </span>
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs">
                          Historical Archive
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Historical Chapter 3: 2010 - Present */}
              <div className="mb-12 sm:mb-16 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] p-6 sm:p-8 transition-all">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
                  {/* Left: Story Narrative */}
                  <div className="lg:col-span-7 flex flex-col sm:flex-row gap-5 sm:gap-6 items-start">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-600 to-blue-700 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-lg shadow-sky-500/25">
                      2019
                    </div>
                    <div className="space-y-4 flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                        The Vision of the Jar & Generation Blessing Building
                      </h3>

                      <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                        Then came the annual Prayer &amp; Fasting during year 2010, where Ptr. Anthony saw a vision. In the vision, he saw the Lord Jesus Christ approach him at the back of the COG Jabez sanctuary where the fasting was held. At that moment, he fell on his knees in awe of His presence. Suddenly, he turned into a jar. Then, he began seeing the scene between the Lord and himself as a jar. Then the Lord put His heavenly money into the jar. Ptr. Anthony said and claimed, <em>&ldquo;For the church!&rdquo;</em> Then afterwards, he woke up from his trance.
                      </p>

                      <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                        After the vision, Ptr. Anthony heeded the call of the Lord to build the <strong>Generation Blessing Building</strong>, also known as the <strong>GenBless Building</strong>, a five-storey building that will accommodate the increasing population of the church and to provide the needs of its members.
                      </p>
                    </div>
                  </div>

                  {/* Right: Museum Showcase Photo Frame */}
                  <div className="lg:col-span-5">
                    <div className="group relative rounded-2xl p-2.5 sm:p-3 bg-gradient-to-b from-slate-200/80 via-slate-100 to-slate-200/80 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 border border-slate-300/80 dark:border-slate-700 shadow-xl transition-all duration-300">
                      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-950">
                        <Image
                          src="/worship-place-3.jpg"
                          alt="Generation Blessing Building, 2019"
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          priority
                        />
                        <div className="absolute inset-0 ring-1 ring-inset ring-black/15 rounded-xl pointer-events-none" />
                      </div>

                      <div className="pt-3 pb-1 px-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                            Generation Blessing Building, 2019
                          </span>
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs">
                          Historical Archive
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Present Day & Satellites Vision Card */}
              <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-white/90 dark:from-slate-900/90 dark:via-blue-950/40 dark:to-slate-900/90 backdrop-blur-md border border-blue-200/80 dark:border-blue-900/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-all">
                <div className="space-y-4">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600" />
                    Expanding Satellites & Born-Again Pilipinas
                  </h3>

                  <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                    In 2013, another satellite church was established by God&apos;s grace. Previously known as <strong>COG Lalaan</strong>, it was renamed to <strong>COG Silang</strong> and was transferred to Premiere Plaza, Silang, Cavite. Then in 2014, <strong>COG FCIE</strong> was renamed to <strong>COG General Trias</strong> and is now located inside Metro South Subdivision, General Trias, Cavite.
                  </p>

                  <p className="text-base sm:text-lg text-slate-700 dark:text-slate-200 font-medium leading-relaxed pt-2 border-t border-blue-200/60 dark:border-slate-800">
                    Today, the Lord has continued to bless and enlarge the church. With <strong className="text-blue-600 dark:text-blue-400 font-bold">almost 15,000 strong members</strong> and <strong className="text-indigo-600 dark:text-indigo-400 font-bold">3,700 dedicated workers</strong> ready to fulfill the vision of turning Dasmariñas into a born-again city&hellip; and eventually turning our country into <strong className="text-slate-950 dark:text-white font-extrabold">Born-Again Pilipinas</strong>.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* 2. TAB: WHAT WE BELIEVE */}
      {activeTab === "beliefs" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <section className="relative pt-14 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden border-t border-slate-200/80 dark:border-slate-800">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-80 bg-gradient-to-b from-blue-500/8 via-indigo-500/5 to-transparent blur-3xl pointer-events-none" />

            <div className="relative max-w-6xl mx-auto space-y-16 sm:space-y-24">

              {/* ============================================================ */}
              {/* 1. VISION & MISSION SECTION                                  */}
              {/* ============================================================ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {/* Vision Card */}
                <div className="relative p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-all flex flex-col justify-between">
                  <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-start">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/25">
                      <Target className="w-7 h-7" />
                    </div>
                    <div className="space-y-3 flex-1">
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white uppercase">
                        VISION
                      </h2>
                      <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                        The men and women of Church of God Dasmariñas aspire to transform Dasmariñas and its neighboring communities into a born-again city in our lifetime.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mission Card */}
                <div className="relative p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-all flex flex-col justify-between">
                  <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-start">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/25">
                      <Compass className="w-7 h-7" />
                    </div>
                    <div className="space-y-3 flex-1">
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white uppercase">
                        MISSION
                      </h2>
                      <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                        To realize this vision, the Church of God shall take every opportunity an occasion to evangelize and minister to every lost soul in the name of Jesus Christ.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================================================ */}
              {/* 2. DECLARATION OF FAITH SECTION                             */}
              {/* ============================================================ */}
              <div className="space-y-8">
                <div className="text-center sm:text-left">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 dark:text-white uppercase mb-4">
                    DECLARATION OF <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 dark:from-blue-400 dark:via-indigo-300 dark:to-sky-300">FAITH</span>
                  </h2>
                  <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                    The Church of God believes the whole Bible to be completely and equally inspired and that it is the written Word of God. The Church of God has adopted the following Declaration of Faith as its standard and official expression of its doctrine.
                  </p>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 text-xs font-bold uppercase tracking-wider">
                    We Believe:
                  </div>
                </div>

                {/* 15 Doctrinal Statements Grid */}
                <div className="grid gap-3.5 sm:gap-4">
                  {[
                    "In the verbal inspiration of the Bible.",
                    "In one God eternally existing in three persons; namely, the Father, Son, and Holy Ghost.",
                    "That Jesus Christ is the only begotten Son of the Father, conceived of the Holy Ghost, and born of the Virgin Mary. That Jesus was crucified, buried, and raised from the dead.",
                    "That He ascended to heaven and is today at the right hand of the Father as the Intercessor.",
                    "That all have sinned and come short of the glory of God and that repentance is commanded of God for all and necessary for forgiveness of sins.",
                    "That justification, regeneration, and the new birth are wrought by faith in the blood of Jesus Christ.",
                    "In sanctification subsequent to the new birth, through faith in the blood of Christ; through the Word, and by the Holy Ghost.",
                    "Holiness to be God’s standard of living for His people.",
                    "In the baptism with the Holy Ghost subsequent to a clean heart.",
                    "In speaking with other tongues as the Spirit gives utterance and that it is the initial evidence of the baptism of the Holy Ghost.",
                    "In water baptism by immersion, and all who repent should be baptized in the name of the Father, and of the Son, and of the Holy Ghost.",
                    "Divine healing is provided for all in the atonement.",
                    "In the Lord’s Supper and washing of the saints’ feet.",
                    "In the premillennial second coming of Jesus. First, to resurrect the righteous dead and to catch away the living saints to Him in the air. Second, to reign on the earth a thousand years.",
                    "In the bodily resurrection; eternal life for the righteous, and eternal punishment for the wicked.",
                  ].map((statement, idx) => (
                    <div
                      key={idx}
                      className="group flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-blue-500/40 transition-all"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {String(idx + 1).padStart(2, "0")}
                      </div>
                      <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed flex-1 pt-0.5">
                        {statement}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ============================================================ */}
              {/* 3. CORE VALUES SECTION                                       */}
              {/* ============================================================ */}
              <div className="space-y-8">
                <div className="text-center sm:text-left">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 dark:text-white uppercase mb-4">
                    CORE <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 dark:from-blue-400 dark:via-indigo-300 dark:to-sky-300">VALUES</span>
                  </h2>
                  <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                    To set the right heart for the ministry, the workers of Church of God are guided by the following ten core values.
                  </p>
                </div>

                {/* 10 Core Values Grid */}
                <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
                  {[
                    { intro: "The foundation of our ministry is", value: "CHARACTER" },
                    { intro: "The nature of our ministry is", value: "SERVICE" },
                    { intro: "The motive of our ministry is", value: "LOVE" },
                    { intro: "The measure of our ministry is", value: "SACRIFICE" },
                    { intro: "The authority of our ministry is", value: "SUBMISSION" },
                    { intro: "The purpose of our ministry is to", value: "GLORIFY GOD" },
                    { intro: "The tools of our ministry are", value: "WORD OF GOD and PRAYER" },
                    { intro: "The privilege of our ministry is", value: "GROWTH" },
                    { intro: "The power of our ministry is the", value: "HOLY SPIRIT" },
                    { intro: "The model of our ministry is", value: "JESUS CHRIST" },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-lg hover:border-blue-500/40 transition-all flex flex-col justify-between"
                    >
                      <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mb-1.5">
                        {item.intro}
                      </span>
                      <div className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-2">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300">
                          {item.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </section>
        </div>
      )}

      {/* 3. TAB: SERVICES */}
      {activeTab === "services" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <section className="relative pt-14 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden border-t border-slate-200/80 dark:border-slate-800">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-80 bg-gradient-to-b from-blue-500/8 via-indigo-500/5 to-transparent blur-3xl pointer-events-none" />

            <div className="relative max-w-6xl mx-auto space-y-16 sm:space-y-20">

              {/* ============================================================ */}
              {/* 1. SUNDAY SERVICES (8 GATHERINGS)                            */}
              {/* ============================================================ */}
              <div>
                <div className="text-center sm:text-left mb-8 sm:mb-10">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 dark:text-white uppercase mb-3">
                    SUNDAY <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 dark:from-blue-400 dark:via-indigo-300 dark:to-sky-300">SERVICES</span>
                  </h2>
                  <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                    Join our weekly Sunday worship experiences at the COG Dasmariñas Main Sanctuary and online live streams.
                  </p>
                </div>

                {/* 8 Sunday Services Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                  {[
                    { num: "1st Service", time: "5:30 AM – 6:45 AM", sub: "Dawn Worship & Praise" },
                    { num: "2nd Service", time: "7:30 AM – 8:45 AM", sub: "Morning Celebration" },
                    { num: "3rd Service", time: "9:30 AM – 10:45 AM", sub: "Main Sunday Worship" },
                    { num: "4th Service", time: "11:30 AM – 12:45 PM", sub: "Midday Celebration" },
                    { num: "5th Service", time: "1:30 PM – 2:45 PM", sub: "Afternoon Gathering" },
                    { num: "6th Service", time: "3:30 PM – 4:45 PM", sub: "Afternoon Praise" },
                    { num: "7th Service", time: "5:30 PM – 6:45 PM", sub: "Evening Worship" },
                    { num: "8th Service", time: "7:30 PM – 8:45 PM", sub: "Night Celebration" },
                  ].map((srv, idx) => (
                    <div
                      key={idx}
                      className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl hover:border-blue-500/40 transition-all text-center group flex flex-col justify-between"
                    >
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 text-xs font-bold uppercase tracking-wider mb-3">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{srv.num}</span>
                        </div>
                        <div className="text-lg sm:text-xl md:text-2xl lg:text-lg xl:text-xl font-black text-slate-950 dark:text-white tracking-tight mb-1.5 whitespace-nowrap">
                          {srv.time}
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                        {srv.sub}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ============================================================ */}
              {/* 2. MIDWEEK & SPECIAL GATHERINGS                              */}
              {/* ============================================================ */}
              <div>
                <div className="text-center sm:text-left mb-8 sm:mb-10">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 dark:text-white uppercase mb-3">
                    SPECIAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 dark:from-blue-400 dark:via-indigo-300 dark:to-sky-300">GATHERINGS</span>
                  </h2>
                  <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                    Encounter God throughout the week through our revival, salvation, and empowerment nights.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                  {/* Tuesday - Revival Night */}
                  <div className="p-6 sm:p-7 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-sm mb-4 shadow-md shadow-blue-500/25">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        Every Tuesday
                      </span>
                      <h3 className="text-xl font-bold text-slate-950 dark:text-white mt-1 mb-2">
                        Revival Night
                      </h3>
                      <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
                        7:30 PM
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        Weekly breakthrough prayer, revival fire, uplifting praise, and spiritual renewal for all believers.
                      </p>
                    </div>
                  </div>

                  {/* Wednesday - Salvation Night */}
                  <div className="p-6 sm:p-7 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-600 text-white flex items-center justify-center font-bold text-sm mb-4 shadow-md shadow-indigo-500/25">
                        <Church className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Every Wednesday
                      </span>
                      <h3 className="text-xl font-bold text-slate-950 dark:text-white mt-1 mb-2">
                        Salvation Night
                      </h3>
                      <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
                        7:00 PM
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        Midweek service dedicated to gospel proclamation, healing, pastoral prayer, and salvation encounters.
                      </p>
                    </div>
                  </div>

                  {/* Saturday - Empowered Night */}
                  <div className="p-6 sm:p-7 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-600 to-blue-700 text-white flex items-center justify-center font-bold text-sm mb-4 shadow-md shadow-sky-500/25">
                        <Users className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                        Every Saturday
                      </span>
                      <h3 className="text-xl font-bold text-slate-950 dark:text-white mt-1 mb-2">
                        Empowered Night
                      </h3>
                      <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
                        5:30 PM
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        Dynamic youth gathering, passionate worship, discipleship preaching, and community empowerment.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </section>
        </div>
      )}

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <p>© {new Date().getFullYear()} Church of God Dasmariñas. All rights reserved.</p>
      </footer>
    </div>
  );
}
