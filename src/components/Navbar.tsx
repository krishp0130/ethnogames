"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="w-full border-b border-white/[0.06] bg-black/60 backdrop-blur-xl sticky top-0 z-50 pt-[env(safe-area-inset-top,0px)]">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 min-h-14 sm:h-16 flex flex-wrap sm:flex-nowrap items-center justify-between gap-y-2 gap-x-2 py-2 sm:py-0">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group min-w-0 shrink">
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-shadow">
            <span className="text-white font-black text-sm sm:text-base">E</span>
          </div>
          <span className="text-white font-bold text-base sm:text-xl tracking-tight truncate">
            Ethno<span className="text-amber-400">games</span>
          </span>
        </Link>

        <div className="flex items-center justify-end gap-0.5 sm:gap-1 w-full sm:w-auto sm:justify-end">
          <NavLink href="/" current={pathname}>
            Home
          </NavLink>
          <NavLink href="/mendicot" current={pathname}>
            <span className="sm:hidden">Rules</span>
            <span className="hidden sm:inline">Mendicot</span>
          </NavLink>
          <NavLink href="/mendicot/play" current={pathname} highlight>
            <span className="sm:hidden">Play</span>
            <span className="hidden sm:inline">Play Now</span>
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  current,
  children,
  highlight,
}: {
  href: string;
  current: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  const isActive = current === href;

  if (highlight) {
    return (
      <Link
        href={href}
        className="ml-0.5 sm:ml-2 px-3 py-2.5 sm:px-4 sm:py-2 min-h-[44px] min-w-[44px] sm:min-w-0 inline-flex items-center justify-center rounded-lg text-xs sm:text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30"
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`
        px-2.5 sm:px-4 py-2.5 sm:py-2 min-h-[44px] min-w-[44px] sm:min-w-0 inline-flex items-center justify-center rounded-lg text-xs sm:text-sm font-medium transition-colors
        ${isActive
          ? "bg-white/10 text-white"
          : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
        }
      `}
    >
      {children}
    </Link>
  );
}
