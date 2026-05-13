"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

const FLOATING_CARDS = [
  { suit: "♠", rank: "A", x: "10%", y: "20%", rotate: -15, delay: 0 },
  { suit: "♥", rank: "K", x: "85%", y: "15%", rotate: 12, delay: 0.2 },
  { suit: "♦", rank: "Q", x: "75%", y: "70%", rotate: -8, delay: 0.4 },
  { suit: "♣", rank: "J", x: "15%", y: "75%", rotate: 20, delay: 0.6 },
  { suit: "♥", rank: "10", x: "50%", y: "10%", rotate: -5, delay: 0.3 },
  { suit: "♠", rank: "7", x: "90%", y: "45%", rotate: 15, delay: 0.5 },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative flex-1 flex items-center justify-center overflow-hidden px-4 sm:px-6 py-16 sm:py-24">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.08),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(239,68,68,0.06),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.06),transparent_50%)]" />
        </div>

        {/* Floating cards background */}
        {FLOATING_CARDS.map((c, i) => (
          <motion.div
            key={i}
            className="absolute pointer-events-none select-none"
            style={{ left: c.x, top: c.y }}
            initial={{ opacity: 0, scale: 0.5, rotate: c.rotate - 20 }}
            animate={{
              opacity: 0.32,
              scale: 1,
              rotate: c.rotate,
              y: [0, -12, 0],
            }}
            transition={{
              opacity: { delay: c.delay, duration: 1 },
              scale: { delay: c.delay, duration: 1 },
              rotate: { delay: c.delay, duration: 1 },
              y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: c.delay },
            }}
          >
            <div className="w-20 h-28 rounded-xl border border-white/25 bg-white/95 shadow-2xl shadow-black/40 flex flex-col items-center justify-center gap-0.5 backdrop-blur-sm">
              <span className="text-[10px] font-bold leading-none text-zinc-500">
                {c.rank}
              </span>
              <span
                className={
                  c.suit === "♥" || c.suit === "♦"
                    ? "text-4xl font-bold leading-none text-red-600"
                    : "text-4xl font-bold leading-none text-zinc-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.5)]"
                }
              >
                {c.suit}
              </span>
            </div>
          </motion.div>
        ))}

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/[0.08] rounded-full px-4 py-1.5 mb-8">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm text-zinc-400">Now live — Mendicot</span>
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.1] mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Play the card games{" "}
            <span className="text-gradient">you grew up with</span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Traditional card games from around the world, brought online.
            Create a room, invite your friends and family, and play together
            in real time — no downloads, no sign-ups.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Link
              href="/mendicot/play"
              className="group relative w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg rounded-2xl shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Playing
              <span className="ml-2 inline-block group-hover:translate-x-1 transition-transform">
                →
              </span>
            </Link>
            <Link
              href="/mendicot"
              className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center px-8 py-4 bg-white/[0.06] border border-white/[0.1] text-white font-semibold text-lg rounded-2xl hover:bg-white/[0.1] transition-all"
            >
              Learn Mendicot
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative px-4 sm:px-6 py-16 sm:py-24 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Built for the way you play
            </h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">
              Real-time multiplayer, beautiful animations, and faithful rules
              — everything you need for game night.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon="🃏"
              title="Authentic Rules"
              description="Every game is implemented with faithful rules, including trump selection (hukum), trick-taking, and Mendikot scoring."
              delay={0}
            />
            <FeatureCard
              icon="⚡"
              title="Real-Time Multiplayer"
              description="Create a room, share the code, and play together instantly. Socket-powered for zero-lag gameplay."
              delay={0.1}
            />
            <FeatureCard
              icon="🤖"
              title="Play with Bots"
              description="Not enough players? Fill empty seats with AI opponents that play smart, strategic hands."
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* Game Showcase */}
      <section className="relative px-4 sm:px-6 py-16 sm:py-24 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Games</h2>
            <p className="text-zinc-400 text-lg">
              Starting with classics. More coming soon.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <GameCard
              name="Mendicot"
              origin="India"
              players="4 players"
              description="A thrilling trick-taking game where capturing Tens is everything. Set trump on the fly and outwit your opponents."
              href="/mendicot"
              available
            />
            <GameCard
              name="Rummy"
              origin="Global"
              players="2–6 players"
              description="Form sets and runs to be the first to go out. A timeless classic played in countless variations."
              href="#"
            />
            <GameCard
              name="Teen Patti"
              origin="India"
              players="3–6 players"
              description="The Indian poker. Bet, bluff, and read your opponents in this fast-paced game of nerve."
              href="#"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <span className="text-white font-black text-xs">E</span>
            </div>
            <span className="text-zinc-500 text-sm">Ethnogames</span>
          </div>
          <p className="text-zinc-600 text-sm">
            Bringing traditional games online
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: string;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      className="group p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
    >
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

function GameCard({
  name,
  origin,
  players,
  description,
  href,
  available,
}: {
  name: string;
  origin: string;
  players: string;
  description: string;
  href: string;
  available?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <Link
        href={href}
        className={`
          group block p-6 rounded-2xl border transition-all h-full
          ${available
            ? "bg-gradient-to-br from-amber-500/[0.08] to-orange-500/[0.04] border-amber-500/20 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10"
            : "bg-white/[0.02] border-white/[0.06] opacity-60 cursor-not-allowed"
          }
        `}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold">{name}</h3>
            <p className="text-sm text-zinc-500">{origin}</p>
          </div>
          {available ? (
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">
              Live
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-zinc-800 text-zinc-500 text-xs font-medium rounded-full">
              Coming Soon
            </span>
          )}
        </div>
        <p className="text-zinc-400 text-sm leading-relaxed mb-4">
          {description}
        </p>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {players}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
