"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { MotionDiv, MotionH2, MotionP } from "@/lib/motion";
import { useMotionEnabled } from "@/lib/useMediaQuery";

const RULES = [
  {
    title: "The Setup",
    content:
      "4 players in 2 partnerships sit across from each other. A standard 52-card deck is used. Cards rank Ace (high) down to 2 (low). The dealer deals 13 cards to each player in batches of 5, then 4, then 4.",
  },
  {
    title: "Playing Tricks",
    content:
      "The player to the dealer's right leads the first trick. Play proceeds counter-clockwise. You must follow the suit led if you can. If you can't follow suit, you may play any card.",
  },
  {
    title: "Setting Trump (Hukum)",
    content:
      "There is no trump suit at the start! The very first time any player cannot follow suit, the card they play sets the trump suit (called \"hukum\") for the entire hand. After trump is set, the highest trump card played to a trick wins it.",
  },
  {
    title: "Winning Tricks",
    content:
      "If trump cards were played, the highest trump wins. Otherwise, the highest card of the suit led wins. The trick winner leads the next trick.",
  },
  {
    title: "Scoring the Hand",
    content:
      "After all 13 tricks, count the Tens captured. Capture 3 or 4 Tens to win. All 4 Tens = Mendikot! Win all 13 tricks = 52-Card Mendikot! If each team has 2 Tens, the team with more tricks wins.",
  },
  {
    title: "Winning the Game",
    content:
      "Each hand won scores 1 point. First team to 5 points wins the game. The deal rotates based on which team won.",
  },
];

const CARD_EXAMPLES = [
  { suit: "♠", rank: "A", color: "text-zinc-100" },
  { suit: "♥", rank: "K", color: "text-red-500" },
  { suit: "♦", rank: "10", color: "text-red-500" },
  { suit: "♣", rank: "J", color: "text-zinc-100" },
];

export default function MendicotRulesContent() {
  const motionEnabled = useMotionEnabled();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main id="main-content">
      <section className="relative px-4 sm:px-6 pt-16 sm:pt-20 pb-12 sm:pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.08),transparent_60%)]" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6">
              <span className="text-emerald-400 text-sm font-medium">
                From India
              </span>
            </div>
            <h1 className="text-3xl sm:text-6xl font-black tracking-tight mb-4">
              Mendicot
            </h1>
            <p className="text-base sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-8 px-1">
              A beloved Indian trick-taking card game where capturing Tens is
              everything. Set the trump on the fly, form partnerships, and
              outsmart your opponents.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-zinc-500 mb-10 px-2">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                4 Players
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ~20 min per game
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                2 Teams
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-12 px-1">
              {CARD_EXAMPLES.map((c, i) => {
                const rotate = (i - 1.5) * 8;
                const cardInner = (
                  <>
                    <span className={`text-xs font-bold ${c.color}`}>
                      {c.rank}
                    </span>
                    <span className={`text-2xl ${c.color}`}>{c.suit}</span>
                  </>
                );

                if (!motionEnabled) {
                  return (
                    <div
                      key={i}
                      className="w-16 h-24 bg-white rounded-xl shadow-2xl flex flex-col items-center justify-center border border-zinc-200"
                      style={{ transform: `rotate(${rotate}deg)` }}
                    >
                      {cardInner}
                    </div>
                  );
                }

                return (
                  <MotionDiv
                    key={i}
                    className="w-16 h-24 bg-white rounded-xl shadow-2xl flex flex-col items-center justify-center border border-zinc-200"
                    initial={{ opacity: 0, y: 40, rotate: rotate - 8 }}
                    animate={{ opacity: 1, y: 0, rotate }}
                    transition={{ delay: 0.2 + i * 0.1, type: "spring", stiffness: 200 }}
                    whileHover={{ y: -8, scale: 1.05, rotate: 0, zIndex: 10 }}
                  >
                    {cardInner}
                  </MotionDiv>
                );
              })}
            </div>

            <Link
              href="/mendicot/play"
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-base sm:text-lg rounded-2xl shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Play Mendicot
              <span className="text-xl">→</span>
            </Link>
          </MotionDiv>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-16 sm:py-20 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto">
          <MotionH2
            className="text-3xl font-bold text-center mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            How to Play
          </MotionH2>
          <MotionP
            className="text-zinc-400 text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Learn the rules in 2 minutes
          </MotionP>

          <div className="space-y-6">
            {RULES.map((rule, i) => (
              <MotionDiv
                key={i}
                className="flex flex-col sm:flex-row gap-3 sm:gap-5"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm">
                  {i + 1}
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold text-lg mb-1">{rule.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {rule.content}
                  </p>
                </div>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-16 sm:py-20 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Key Concepts
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <ConceptCard
              title="Hukum (Trump)"
              description="No fixed trump! The first off-suit card played in the hand sets the trump suit for all remaining tricks."
              icon="👑"
            />
            <ConceptCard
              title="Mendikot"
              description="Capture all 4 Tens in a single hand. A rare and celebrated achievement that earns bragging rights."
              icon="🏆"
            />
            <ConceptCard
              title="52-Card Mendikot"
              description="Win every single trick in the hand. The ultimate dominance — even changes the dealer rotation."
              icon="⭐"
            />
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-16 sm:py-20 border-t border-white/[0.06]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to play?</h2>
          <p className="text-zinc-400 mb-8">
            Create a room and invite your friends, or practice against AI bots.
          </p>
          <Link
            href="/mendicot/play"
            className="inline-flex items-center justify-center gap-2 min-h-[48px] px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:scale-[1.02]"
          >
            Play Now →
          </Link>
        </div>
      </section>
      </main>
    </div>
  );
}

function ConceptCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <MotionDiv
      className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-all"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
    </MotionDiv>
  );
}
