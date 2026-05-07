"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { MouseTiltCard } from "@/components/ui/mouse-tilt-card";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({ eyebrow, title, description, children, footer }: AuthShellProps) {
  return (
    <main className="landing-root flex min-h-screen items-center p-4 sm:p-6">
      <div className="mx-auto grid w-full max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-[#070707] shadow-[0_30px_100px_rgba(0,0,0,0.55)] lg:grid-cols-2">
        <section className="order-2 p-6 sm:p-10 lg:order-1 lg:p-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mx-auto w-full max-w-xl"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">{eyebrow}</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight text-white sm:text-5xl">{title}</h1>
            <p className="mt-3 max-w-lg text-sm text-zinc-400 sm:text-base">{description}</p>
            <MouseTiltCard className="landing-glass mt-8 rounded-2xl p-5 sm:p-7">
              {children}
            </MouseTiltCard>
            <div className="mt-6 text-sm text-zinc-400">{footer}</div>
          </motion.div>
        </section>

        <section className="relative order-1 min-h-[20rem] overflow-hidden border-b border-white/10 bg-black lg:order-2 lg:min-h-full lg:border-b-0 lg:border-l">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_28%,rgba(0,0,0,0)_62%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.03)_0%,rgba(0,0,0,0)_45%)]" />
        </section>
      </div>
    </main>
  );
}
