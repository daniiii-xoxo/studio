"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  ChevronLeft,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Radio,
  Youtube,
  Tv,
} from "lucide-react";
import { LandingNav } from "@/components/landing/landing-nav";

export default function LandingPage() {
  // Background Media Slider State (0: Image Slideshow, 1: Video)
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showCenterFeedback, setShowCenterFeedback] = useState(false);
  
  // Hero Background Images Auto-Slideshow (crossfades smoothly every 3.5 seconds)
  const heroBackgrounds = [
    "/cog-bg1.jpg",
    "/cog-bg2.jpg",
    "/cog-bg3.jfif",
    "/cog-bg4.jfif",
    "/cog-bg5.jfif",
    "/cog-bg6.jfif",
    "/cog-bg7.jfif",
  ];
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  // Auto-cycle background images every 3.5 seconds when on Slide 0
  useEffect(() => {
    if (currentSlide !== 0 || heroBackgrounds.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % heroBackgrounds.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [currentSlide, heroBackgrounds.length]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const feedbackTimeout = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = 2; // Slide 0 = Image Slideshow, Slide 1 = Video

  // When switching to Slide 1, start fresh from 0:00 and autoplay
  useEffect(() => {
    if (videoRef.current) {
      if (currentSlide === 1) {
        videoRef.current.currentTime = 0; // Restart from the beginning!
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [currentSlide]);

  // Toggle Play/Pause on Center Click
  const togglePlay = () => {
    if (videoRef.current) {
      setShowCenterFeedback(true);
      if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);

      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
        // Hide feedback after 1.2s when playing
        feedbackTimeout.current = setTimeout(() => {
          setShowCenterFeedback(false);
        }, 1200);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Audio Toggle: seamlessly un-mutes / mutes without restarting video
  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering video click
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
      if (!nextMuted && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const handleNextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = (currentSlide + 1) % totalSlides;
    setCurrentSlide(next);
  };

  const handlePrevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prev = (currentSlide - 1 + totalSlides) % totalSlides;
    setCurrentSlide(prev);
  };

  // Live Stream & Church Events Data (From official @cogdasma YouTube Channel)
  const liveServices = [
    {
      id: "live-1",
      title: "7:30 PM ONLINE SERVICE | ENDGAME",
      subtitle: "Sunday Evening Service • 1.3K views • Streamed 23h ago",
      date: "Sun. October 4, 2026",
      time: "7:30PM GMT+8",
      location: "COG Dasmariñas YouTube Live",
      badge: "ONLINE SERVICE",
      duration: "1:40:11",
      isLive: true,
      image: "/live-thumb-1.png",
      youtubeUrl: "https://www.youtube.com/@cogdasma/live",
    },
    {
      id: "live-2",
      title: "Walang Olats Sa Prayer | Bro. Allan Barabat",
      subtitle: "Sunday Service • 1.4K views • Streamed 8d ago",
      date: "Sun. September 27, 2026",
      time: "1:30PM GMT+8",
      location: "COG Dasmariñas YouTube Live",
      badge: "SUNDAY SERVICE",
      duration: "1:49:31",
      isLive: false,
      image: "/live-thumb-2.png",
      youtubeUrl: "https://www.youtube.com/@cogdasma",
    },
    {
      id: "live-3",
      title: "9:30 AM ONLINE SERVICE | Walang Olats Sa Prayer",
      subtitle: "Mid-Morning Service • 2.5K views • Streamed 8d ago",
      date: "Sun. September 27, 2026",
      time: "9:30AM GMT+8",
      location: "COG Dasmariñas YouTube Live",
      badge: "SUNDAY SERVICE",
      duration: "1:46:05",
      isLive: false,
      image: "/live-thumb-3.png",
      youtubeUrl: "https://www.youtube.com/@cogdasma",
    },
    {
      id: "live-4",
      title: "REVIVAL NIGHT - BREAK OUT",
      subtitle: "Special Revival Gathering • 5.1K views • Streamed 12d ago",
      date: "Wed. September 23, 2026",
      time: "7:00PM GMT+8",
      location: "COG Dasmariñas Sanctuary",
      badge: "REVIVAL NIGHT",
      duration: "1:59:00",
      isLive: false,
      image: "/live-thumb-4.png",
      youtubeUrl: "https://www.youtube.com/@cogdasma",
    },
    {
      id: "live-5",
      title: "The Blessing | Ps. AJ Velasco",
      subtitle: "Worship & Word Service • 4.6K views • Streamed 2w ago",
      date: "Sun. September 20, 2026",
      time: "9:30AM GMT+8",
      location: "COG Dasmariñas YouTube Live",
      badge: "SUNDAY SERVICE",
      duration: "1:42:16",
      isLive: false,
      image: "/live-thumb-5.png",
      youtubeUrl: "https://www.youtube.com/@cogdasma",
    },
    {
      id: "live-6",
      title: "MISSION IMPOSSIBLE | Ptr. Gary Yalung",
      subtitle: "36th Anniversary Celebration • 2K views • Streamed 3w ago",
      date: "Sun. September 13, 2026",
      time: "9:30AM GMT+8",
      location: "COG Dasmariñas Arena",
      badge: "ANNIVERSARY SERVICE",
      duration: "1:38:16",
      isLive: false,
      image: "/live-thumb-6.png",
      youtubeUrl: "https://www.youtube.com/@cogdasma",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col selection:bg-primary selection:text-white">
      {/* Floating Pill Navigation Header */}
      <LandingNav currentPath="/" />

      {/* 1. HERO / HOME SECTION (Full 100vh viewport coverage) */}
      <section
        id="home"
        className="relative h-screen min-h-screen w-full flex items-center justify-center pt-16 px-4 sm:px-6 overflow-hidden select-none bg-black"
      >
        {/* ============================================================ */}
        {/* BACKGROUND MEDIA SLIDER                                      */}
        {/* ============================================================ */}
        
        {/* Slide 0: High-Res Church Image Carousel (Cross-fades automatically) */}
        <div
          className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${
            currentSlide === 0 ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          {heroBackgrounds.map((bgUrl, index) => (
            <div
              key={bgUrl}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                currentBgIndex === index ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <Image
                src={bgUrl}
                alt={`COG Dasmariñas Building ${index + 1}`}
                fill
                className="object-cover scale-105 transition-transform duration-10000 ease-out"
                priority={index === 0}
                quality={95}
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/55 to-slate-950/90 pointer-events-none" />
          <div className="absolute inset-0 shadow-[inset_0_0_120px_60px_rgba(0,0,0,0.6)] pointer-events-none" />
        </div>

        {/* Slide 1: Pristine Full-Screen Church Video (Direct MP4) */}
        <div
          onClick={togglePlay}
          className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out bg-black overflow-hidden cursor-pointer ${
            currentSlide === 1 ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <video
            ref={videoRef}
            src="/cog-video.mp4"
            autoPlay
            loop
            playsInline
            muted={isMuted}
            preload="auto"
            className="w-full h-full object-cover object-center min-w-[100vw] min-h-[100vh]"
          />
          {/* Subtle soft gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/60 pointer-events-none" />

          {/* ============================================================ */}
          {/* CENTER PLAY / PAUSE BUTTON OVERLAY (Appears on click & pause) */}
          {/* ============================================================ */}
          <div
            className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-300 ${
              !isPlaying || showCenterFeedback
                ? "opacity-100 scale-100"
                : "opacity-0 scale-90"
            }`}
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/65 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-[0_10px_30px_rgba(0,0,0,0.6)] transition-transform transform hover:scale-105">
              {isPlaying ? (
                <Pause className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-md" />
              ) : (
                <Play className="w-6 h-6 sm:w-7 sm:h-7 text-white fill-white ml-1 drop-shadow-md" />
              )}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SLIDER NAVIGATION BUTTONS (Right & Left Circular Controls)   */}
        {/* ============================================================ */}
        
        {/* Right Next Button */}
        <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-30">
          <button
            onClick={handleNextSlide}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/60 hover:bg-black/85 active:scale-95 text-white backdrop-blur-md border border-white/25 flex items-center justify-center shadow-[0_8px_25px_rgba(0,0,0,0.5)] transition-all duration-200 hover:scale-110 group cursor-pointer"
            title="Next Background"
            aria-label="Next Background Slide"
          >
            <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Left Previous Button */}
        <div className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-30">
          <button
            onClick={handlePrevSlide}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/60 hover:bg-black/85 active:scale-95 text-white backdrop-blur-md border border-white/25 flex items-center justify-center shadow-[0_8px_25px_rgba(0,0,0,0.5)] transition-all duration-200 hover:scale-110 group cursor-pointer"
            title="Previous Background"
            aria-label="Previous Background Slide"
          >
            <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Audio Toggle (Lower Right Corner on Slide 1) */}
        {currentSlide === 1 && (
          <div className="absolute bottom-16 sm:bottom-20 right-6 sm:right-10 z-30 animate-in fade-in zoom-in-95 duration-300">
            <button
              onClick={toggleAudio}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full backdrop-blur-md border shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${
                isMuted
                  ? "bg-black/60 hover:bg-black/80 text-white/80 border-white/20"
                  : "bg-blue-600/80 hover:bg-blue-600 text-white border-blue-400/50 ring-2 ring-blue-500/30"
              }`}
              title={isMuted ? "Unmute Video Audio" : "Mute Video Audio"}
              aria-label="Audio Controls"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-semibold pr-1">Muted</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-white animate-pulse" />
                  <span className="text-xs font-semibold pr-1">Audio On</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Carousel Pagination Dots */}
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentSlide(0);
            }}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              currentSlide === 0 ? "w-8 h-2.5 bg-white shadow-md" : "w-2.5 h-2.5 bg-white/40 hover:bg-white/70"
            }`}
            aria-label="Slide 1 Photo"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentSlide(1);
            }}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              currentSlide === 1 ? "w-8 h-2.5 bg-white shadow-md" : "w-2.5 h-2.5 bg-white/40 hover:bg-white/70"
            }`}
            aria-label="Slide 2 Video"
          />
        </div>

        {/* ============================================================ */}
        {/* HERO CONTENT (Visible on Slide 0, smoothly hides on Slide 1) */}
        {/* ============================================================ */}
        <div
          className={`relative z-10 max-w-6xl mx-auto text-center flex flex-col items-center px-2 transition-all duration-700 ease-in-out ${
            currentSlide === 0
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-8 pointer-events-none"
          }`}
        >
          {/* Main Church Logo */}
          <div className="relative w-32 h-32 sm:w-44 sm:h-44 md:w-48 md:h-48 mb-5 sm:mb-6 drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)]">
            <Image
              src="/church-logo.png"
              alt="COG Logo"
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Heading Title - Single Row on Desktop */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[4.15rem] font-black text-white tracking-tight leading-none mb-4 drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] md:whitespace-nowrap">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-sky-200 to-indigo-200">COG Dasmariñas</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-slate-100/90 max-w-3xl font-normal mb-8 sm:mb-12 leading-relaxed drop-shadow">
            Empowering ministry leaders, workers, and members to serve with excellence. Streamline schedules, events, attendance, and church operations in one place.
          </p>

          {/* Quick Highlight Cards - Refined Glassmorphism Type */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 w-full max-w-xl sm:max-w-2xl">
            <div className="group bg-white/10 dark:bg-white/[0.07] backdrop-blur-xl backdrop-saturate-150 border border-white/25 hover:border-white/45 py-2.5 px-3 sm:py-3.5 sm:px-4 rounded-xl sm:rounded-2xl text-center shadow-[0_8px_32px_0_rgba(0,0,0,0.37),inset_0_1px_1px_0_rgba(255,255,255,0.4)] hover:bg-white/15 transform hover:-translate-y-0.5 transition-all duration-300">
              <div className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-sm mb-0.5">4+</div>
              <div className="text-[10px] sm:text-xs text-white/80 font-medium tracking-wide">Sunday Services</div>
            </div>
            <div className="group bg-white/10 dark:bg-white/[0.07] backdrop-blur-xl backdrop-saturate-150 border border-white/25 hover:border-white/45 py-2.5 px-3 sm:py-3.5 sm:px-4 rounded-xl sm:rounded-2xl text-center shadow-[0_8px_32px_0_rgba(0,0,0,0.37),inset_0_1px_1px_0_rgba(255,255,255,0.4)] hover:bg-white/15 transform hover:-translate-y-0.5 transition-all duration-300">
              <div className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-sm mb-0.5">20+</div>
              <div className="text-[10px] sm:text-xs text-white/80 font-medium tracking-wide">Active Ministries</div>
            </div>
            <div className="group bg-white/10 dark:bg-white/[0.07] backdrop-blur-xl backdrop-saturate-150 border border-white/25 hover:border-white/45 py-2.5 px-3 sm:py-3.5 sm:px-4 rounded-xl sm:rounded-2xl text-center shadow-[0_8px_32px_0_rgba(0,0,0,0.37),inset_0_1px_1px_0_rgba(255,255,255,0.4)] hover:bg-white/15 transform hover:-translate-y-0.5 transition-all duration-300">
              <div className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-sm mb-0.5">100%</div>
              <div className="text-[10px] sm:text-xs text-white/80 font-medium tracking-wide">Christ-Centered</div>
            </div>
            <div className="group bg-white/10 dark:bg-white/[0.07] backdrop-blur-xl backdrop-saturate-150 border border-white/25 hover:border-white/45 py-2.5 px-3 sm:py-3.5 sm:px-4 rounded-xl sm:rounded-2xl text-center shadow-[0_8px_32px_0_rgba(0,0,0,0.37),inset_0_1px_1px_0_rgba(255,255,255,0.4)] hover:bg-white/15 transform hover:-translate-y-0.5 transition-all duration-300">
              <div className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-sm mb-0.5">24/7</div>
              <div className="text-[10px] sm:text-xs text-white/80 font-medium tracking-wide">Community & Care</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. HAPPENING AT OUR CHURCH / LIVE STREAM SECTION            */}
      {/* ============================================================ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-xs font-semibold mb-3">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>OFFICIAL YOUTUBE STREAMS & EVENTS</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                Livestreams
              </h2>
              <p className="mt-2 text-base text-slate-600 dark:text-slate-400 max-w-2xl">
                Stay connected with Church of God Dasmariñas online. Watch our live Sunday services, midweek gatherings, and youth worship sessions.
              </p>
            </div>

            <a
              href="https://www.youtube.com/@cogdasma"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-md transition-all active:scale-95 shrink-0 self-start md:self-auto"
            >
              <Youtube className="w-4 h-4" />
              <span>Visit @cogdasma on YouTube</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Cards Grid Layout (Matching User Image) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {liveServices.map((service) => (
              <div
                key={service.id}
                className="group flex flex-col bg-slate-50/80 dark:bg-slate-800/40 rounded-3xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xl transition-all duration-300"
              >
                {/* Top Image Banner */}
                <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-950 mb-5">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  
                  {/* Dark subtle vignette on image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

                  {/* Top Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${
                        service.isLive
                          ? "bg-red-600 text-white"
                          : "bg-slate-900/80 text-white border border-white/20"
                      }`}
                    >
                      {service.isLive && (
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      )}
                      {service.badge}
                    </span>
                  </div>

                  {/* Duration Badge in lower right */}
                  <div className="absolute bottom-2.5 right-2.5 z-10">
                    <span className="px-2 py-0.5 rounded-md bg-black/80 text-white text-[11px] font-mono font-semibold tracking-wide shadow-sm">
                      {service.duration}
                    </span>
                  </div>

                  {/* Play Button Overlay on Hover */}
                  <a
                    href={service.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                    aria-label={`Watch ${service.title}`}
                  >
                    <div className="w-14 h-14 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 fill-white ml-0.5" />
                    </div>
                  </a>
                </div>

                {/* Card Content (Typography & Meta matching user image) */}
                <div className="flex-1 flex flex-col justify-between px-2 pb-2">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors leading-snug mb-1">
                      {service.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mb-4">
                      {service.subtitle}
                    </p>
                  </div>

                  {/* Metadata with Icons */}
                  <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-medium">{service.date}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-medium">{service.time}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-medium truncate">{service.location}</span>
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="mt-5 pt-3">
                    <a
                      href={service.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
                    >
                      <Youtube className="w-4 h-4 text-red-600" />
                      <span>Watch Stream on YouTube</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 ml-auto" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <p>© {new Date().getFullYear()} Church of God Dasmariñas. All rights reserved.</p>
      </footer>
    </div>
  );
}
