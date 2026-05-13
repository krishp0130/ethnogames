"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="w-full border-b border-white/[0.06] bg-black/60 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-shadow">
            <span className="text-white font-black text-base">E</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">
            Ethno<span className="text-amber-400">games</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <NavLink href="/" current={pathname}>Home</NavLink>
          <NavLink href="/mendicot" current={pathname}>Mendicot</NavLink>
          <NavLink href="/mendicot/play" current={pathname} highlight>
            Play Now
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
        className="ml-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30"
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`
        px-4 py-2 rounded-lg text-sm font-medium transition-colors
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
