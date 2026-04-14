import Link from "next/link";

export function Navbar() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-[#44484f]/15 bg-[#0a0e14]/60 backdrop-blur-xl shadow-[0px_0px_15px_rgba(129,236,255,0.05)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
        <Link href="/" className="font-headline text-2xl font-extrabold tracking-tighter text-[#81ecff]">
          GrowthLens AI
        </Link>
        <nav className="hidden items-center gap-8 font-headline text-sm font-semibold tracking-tight md:flex">
          <a href="#features" className="border-b-2 border-[#81ecff] pb-1 text-[#81ecff]">
            Features
          </a>
          <a href="#benefits" className="text-[#b8bcc5] transition-colors hover:text-[#f8faff]">
            Benefits
          </a>
          <a href="#history" className="text-[#b8bcc5] transition-colors hover:text-[#f8faff]">
            Report History
          </a>
        </nav>
        <a href="#analyze-form" className="rounded-full bg-gradient-to-r from-[#81ecff] to-[#00d4ec] px-6 py-2 font-label text-[10px] font-bold uppercase tracking-[0.24em] text-[#00163d] transition active:scale-95">
          Get Started
        </a>
      </div>
    </header>
  );
}
