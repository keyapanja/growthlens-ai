import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/6 bg-background/70 backdrop-blur-xl">
      <div className="section-shell flex items-center justify-between py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-white">
          GrowthLens AI
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-white/60 md:flex">
          <a href="#features" className="transition hover:text-white">
            Features
          </a>
          <a href="#benefits" className="transition hover:text-white">
            Benefits
          </a>
          <a href="#history" className="transition hover:text-white">
            Report history
          </a>
        </nav>
      </div>
    </header>
  );
}
