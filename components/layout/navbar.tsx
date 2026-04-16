"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { id: "analyze", href: "#analyze-form", label: "Analyze" },
  { id: "why-growthlens", href: "#features", label: "Why GrowthLens" },
  { id: "history", href: "#history", label: "Report History" }
] as const;

export function Navbar() {
  const [activeSection, setActiveSection] = useState<(typeof NAV_ITEMS)[number]["id"]>("analyze");

  useEffect(() => {
    const syncActiveSection = () => {
      const features = document.getElementById("features");
      const history = document.getElementById("history");

      if (!features || !history) {
        return;
      }

      const currentScroll = window.scrollY + 160;
      const bottomReached = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8;

      if (bottomReached || currentScroll >= history.offsetTop) {
        setActiveSection("history");
        return;
      }

      if (currentScroll >= features.offsetTop) {
        setActiveSection("why-growthlens");
        return;
      }

      setActiveSection("analyze");
    };

    syncActiveSection();
    window.addEventListener("scroll", syncActiveSection, { passive: true });
    window.addEventListener("resize", syncActiveSection);

    return () => {
      window.removeEventListener("scroll", syncActiveSection);
      window.removeEventListener("resize", syncActiveSection);
    };
  }, []);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-[#44484f]/15 bg-[#0a0e14]/60 backdrop-blur-xl shadow-[0px_0px_15px_rgba(129,236,255,0.05)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
        <Link href="/" className="font-headline text-2xl font-extrabold tracking-tighter text-[#81ecff]">
          GrowthLens AI
        </Link>
        <nav className="hidden items-center gap-8 font-headline text-sm font-semibold tracking-tight md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;

            return (
              <a
                key={item.id}
                href={item.href}
                className={
                  isActive
                    ? "border-b-2 border-[#81ecff] pb-1 text-[#81ecff]"
                    : "text-[#b8bcc5] transition-colors hover:text-[#f8faff]"
                }
              >
                {item.label}
              </a>
            );
          })}
        </nav>
        <a
          href="#analyze-form"
          className="rounded-full bg-gradient-to-r from-[#81ecff] to-[#00d4ec] px-6 py-2 font-label text-[10px] font-bold uppercase tracking-[0.24em] text-[#00163d] transition active:scale-95"
        >
          Get Started
        </a>
      </div>
    </header>
  );
}
