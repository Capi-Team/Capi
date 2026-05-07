"use client";

import Link from "next/link";
import {
  motion,
  useInView,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { type MouseEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import LogoutButton from "@/app/dashboard/logout-button";
import { LandingScene } from "@/components/home/landing-scene";
import { MouseTiltCard } from "@/components/ui/mouse-tilt-card";

const featureCards = [
  { title: "Interactive lessons", body: "Visual content, quizzes, and guided simulations." },
  { title: "Progress tracking", body: "Track each user, module, and weekly objective." },
  { title: "Role-based learning", body: "Personalized paths by area, seniority, and team." },
  { title: "AI-assisted onboarding", body: "Smart recommendations and instant contextual support." },
  { title: "Real-time feedback", body: "Continuous feedback to speed up the learning curve." },
  { title: "Performance analytics", body: "Operational KPIs to improve training processes." },
] as const;

const stats = [
  { label: "Onboarding time", value: 46, suffix: "%" },
  { label: "Training costs", value: 31, suffix: "%" },
  { label: "Learning retention", value: 68, suffix: "%" },
  { label: "Operational errors", value: 52, suffix: "%" },
] as const;

const timelineSteps = [
  "Employee joins",
  "Assigned learning path",
  "Interactive modules",
  "Progress evaluation",
  "Certification/completion",
] as const;

const testimonials = [
  {
    quote:
      "We cut onboarding time by weeks with guided paths and automated role-based feedback.",
    name: "People Ops Lead",
    company: "Northline",
  },
  {
    quote:
      "New hires now start with real context and fewer operational errors from week one.",
    name: "Operations Manager",
    company: "Monolith Systems",
  },
  {
    quote: "The experience feels premium, fast, and very clear for enterprise teams.",
    name: "L&D Director",
    company: "Vertex Cloud",
  },
] as const;

type HomeLandingProps = {
  isAuthenticated: boolean;
  sessionEmail: string | null;
};

type CounterCardProps = {
  label: string;
  value: number;
  suffix: string;
};

function CounterCard({ label, value, suffix }: CounterCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { amount: 0.4, once: true });
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!isInView) {
      return;
    }
    const state = { value: 0 };
    const tween = gsap.to(state, {
      value,
      duration: 1.2,
      ease: "power3.out",
      onUpdate: () => {
        setCurrent(Math.round(state.value));
      },
    });
    return () => {
      tween.kill();
    };
  }, [isInView, value]);

  return (
    <div ref={ref} className="landing-glass rounded-2xl p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">{label}</p>
      <p className="mt-2 text-4xl font-semibold text-white">
        {current}
        {suffix}
      </p>
    </div>
  );
}

export function HomeLanding({ isAuthenticated, sessionEmail }: HomeLandingProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLElement>(null);
  const storyInnerRef = useRef<HTMLDivElement>(null);
  const [sceneProgress, setSceneProgress] = useState(0);
  const storyPanels = useMemo(
    () => [
      "AI onboarding copilot",
      "Adaptive role-based modules",
      "Precision analytics and mastery",
    ],
    []
  );
  const { scrollY } = useScroll();
  const isSunAtTop = sceneProgress < 0.1;

  useMotionValueEvent(scrollY, "change", (latest) => {
    const target = Math.min(Math.max(latest / 900, 0), 1);
    setSceneProgress((prev) => prev + (target - prev) * 0.14);
  });

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({
      autoRaf: false,
      smoothWheel: true,
      duration: 1.1,
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = window.requestAnimationFrame(raf);
    };
    rafId = window.requestAnimationFrame(raf);

    const panelItems = storyInnerRef.current?.querySelectorAll<HTMLElement>("[data-story-item]") ?? [];
    const context = gsap.context(() => {
      gsap.fromTo(
        panelItems,
        { y: 30, opacity: 0.35 },
        {
          y: -30,
          opacity: 1,
          stagger: 0.3,
          ease: "none",
          scrollTrigger: {
            trigger: storyRef.current,
            start: "top top",
            end: "+=1600",
            scrub: true,
            pin: storyInnerRef.current,
            anticipatePin: 1,
          },
        }
      );
    }, pageRef);

    return () => {
      context.revert();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      window.cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <div ref={pageRef} className="landing-root relative min-h-screen text-white">
      <div className="pointer-events-none fixed -top-[28vh] inset-x-[-28vw] z-0 h-[150vh] opacity-85">
        <LandingScene progress={sceneProgress} />
      </div>
      <header
        className={`landing-nav fixed left-0 right-0 top-0 z-50 px-4 transition-all duration-300 ${
          isSunAtTop ? "pt-3" : "pt-4"
        }`}
      >
        <div
          className={`mx-auto mt-2 flex w-fit max-w-7xl items-center justify-center rounded-2xl px-4 py-2 transition-all duration-300 ${
            isSunAtTop
              ? "border border-transparent bg-transparent backdrop-blur-0"
              : "border border-white/15 bg-black/30 backdrop-blur-xl"
          }`}
        >
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-full px-3 py-1 text-xs font-semibold tracking-[0.26em] ${
              isSunAtTop ? "text-zinc-900" : "text-zinc-100"
            }`}
          >
            CAPI
          </motion.div>
          <nav className={`hidden items-center transition-all duration-300 md:flex ${isSunAtTop ? "ml-2 gap-0.5" : "ml-3 gap-1"}`}>
            <Link
              href="#features"
              className={`rounded-full px-4 py-2 text-sm transition ${
                isSunAtTop
                  ? "text-zinc-900 hover:text-zinc-700"
                  : "text-zinc-200 hover:bg-white/12 hover:text-white"
              }`}
            >
              Features
            </Link>
            <Link
              href="#timeline"
              className={`rounded-full px-4 py-2 text-sm transition ${
                isSunAtTop
                  ? "text-zinc-900 hover:text-zinc-700"
                  : "text-zinc-200 hover:bg-white/12 hover:text-white"
              }`}
            >
              Timeline
            </Link>
            <Link
              href="#preview"
              className={`rounded-full px-4 py-2 text-sm transition ${
                isSunAtTop
                  ? "text-zinc-900 hover:text-zinc-700"
                  : "text-zinc-200 hover:bg-white/12 hover:text-white"
              }`}
            >
              Dashboard
            </Link>
          </nav>
          <div className={`ml-2 flex items-center transition-all duration-300 ${isSunAtTop ? "gap-0.5" : "gap-1"}`}>
            {isAuthenticated ? (
              <>
                <MagneticButton href="/dashboard" label="Workspace" />
                <LogoutButton />
              </>
            ) : (
              <>
                <MagneticButton href="/auth/login" label="Sign in" />
                <MagneticButton href="/auth/register" label="Get Started" primary />
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 px-6 pb-20 pt-32">
        <section className="relative mx-auto min-h-[88vh] w-full max-w-7xl rounded-3xl border border-white/10">
          <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_20%_35%,rgba(0,0,0,0.15)_0%,rgba(0,0,0,0.7)_55%,rgba(0,0,0,0.88)_100%)]" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="relative z-10 flex min-h-[88vh] items-center p-8 sm:p-12 lg:max-w-3xl lg:p-16"
          >
            <div className="space-y-8">
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-300">Employee Onboarding Platform</p>
              <h1 className="text-5xl font-semibold leading-[0.9] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Faster onboarding.
                <br />
                Smarter training.
                <br />
                Fewer mistakes.
              </h1>
              <p className="max-w-2xl text-base text-zinc-200 sm:text-lg">
                Interactive learning for new employees that reduces onboarding time, improves learning
                quality, and minimizes operational errors with AI-driven guidance.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <MagneticButton
                  href={isAuthenticated ? "/dashboard" : "/auth/register"}
                  label="Get Started"
                  primary
                />
                <MagneticButton href="#features" label="Learn More" />
              </div>
              {sessionEmail ? (
                <p className="text-sm text-zinc-300">
                  Signed in as <span className="font-medium text-zinc-100">{sessionEmail}</span>
                </p>
              ) : null}
            </div>
          </motion.div>
        </section>

        <section id="features" className="mx-auto mt-20 w-full max-w-7xl">
          <h2 className="text-3xl font-semibold sm:text-4xl">Modern enterprise training features</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((feature, index) => (
              <MagneticSurface key={feature.title} delay={index * 0.06}>
                <p className="text-lg font-medium text-white">{feature.title}</p>
                <p className="mt-2 text-sm text-zinc-300">{feature.body}</p>
              </MagneticSurface>
            ))}
          </div>
        </section>

        <section ref={storyRef} className="mx-auto mt-28 min-h-[220vh] w-full max-w-7xl">
          <div ref={storyInnerRef} className="grid min-h-screen items-center gap-8">
            <div className="space-y-5">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">3D Scroll Experience</p>
              <h3 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Scroll-driven onboarding storytelling
              </h3>
              <p className="max-w-xl text-zinc-300">
                Pinned sections with progressive transitions that explain the full journey of
                corporate learning.
              </p>
              <div className="space-y-3">
                {storyPanels.map((panel) => (
                  <div
                    key={panel}
                    data-story-item
                    className="landing-glass rounded-xl px-4 py-3 text-sm text-zinc-200"
                  >
                    {panel}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-20 w-full max-w-7xl">
          <h3 className="text-3xl font-semibold sm:text-4xl">Impact metrics</h3>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item) => (
              <CounterCard key={item.label} label={item.label} value={item.value} suffix={item.suffix} />
            ))}
          </div>
        </section>

        <section id="timeline" className="mx-auto mt-24 w-full max-w-7xl">
          <h3 className="text-3xl font-semibold sm:text-4xl">Interactive onboarding timeline</h3>
          <div className="mt-8 grid gap-3 md:grid-cols-5">
            {timelineSteps.map((step, index) => (
              <motion.article
                key={step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ delay: index * 0.08, duration: 0.42 }}
                className="landing-glass rounded-2xl p-4"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Step {index + 1}</p>
                <p className="mt-2 text-sm text-zinc-200">{step}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-24 w-full max-w-7xl">
          <h3 className="text-3xl font-semibold sm:text-4xl">What teams say</h3>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {testimonials.map((item, index) => (
              <MagneticSurface key={item.name} delay={index * 0.08}>
                <p className="text-sm text-zinc-300">{item.quote}</p>
                <p className="mt-5 text-sm font-medium text-white">{item.name}</p>
                <p className="text-xs text-zinc-500">{item.company}</p>
              </MagneticSurface>
            ))}
          </div>
        </section>

        <section id="preview" className="mx-auto mt-24 w-full max-w-7xl">
          <h3 className="text-3xl font-semibold sm:text-4xl">Dashboard preview</h3>
          <div className="landing-glass mt-8 rounded-2xl p-6">
            <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Learning progress</p>
                  <div className="mt-3 h-2 rounded-full bg-zinc-800">
                    <div className="h-2 w-[74%] rounded-full bg-white" />
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Active modules</p>
                  <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                    <li className="rounded-lg bg-zinc-800/60 px-3 py-2">Safety and Compliance</li>
                    <li className="rounded-lg bg-zinc-800/60 px-3 py-2">Platform Fundamentals</li>
                    <li className="rounded-lg bg-zinc-800/60 px-3 py-2">Role SOP Simulator</li>
                  </ul>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Notifications</p>
                <div className="mt-3 space-y-2 text-sm text-zinc-300">
                  <p className="rounded-lg bg-zinc-800/60 px-3 py-2">AI suggested next module for Ana</p>
                  <p className="rounded-lg bg-zinc-800/60 px-3 py-2">2 learners reached certification stage</p>
                  <p className="rounded-lg bg-zinc-800/60 px-3 py-2">Retention score increased this week</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto mt-24 w-full max-w-7xl border-t border-white/10 px-6 py-10 text-sm text-zinc-400">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p>CAPI Platform</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="transition hover:text-white">Navigation</Link>
            <Link href="#" className="transition hover:text-white">Social</Link>
            <Link href="#" className="transition hover:text-white">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

type MagneticButtonProps = {
  href: string;
  label: string;
  primary?: boolean;
};

type MagneticSurfaceProps = {
  children: ReactNode;
  delay?: number;
};

function MagneticSurface({ children, delay = 0 }: MagneticSurfaceProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay, duration: 0.45 }}
      className="group"
    >
      <MouseTiltCard className="landing-glass rounded-2xl p-6">{children}</MouseTiltCard>
    </motion.div>
  );
}

function MagneticButton({ href, label, primary = false }: MagneticButtonProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  function onMove(event: MouseEvent<HTMLAnchorElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) * 0.14;
    const y = (event.clientY - rect.top - rect.height / 2) * 0.14;
    setOffset({ x, y });
  }

  function onLeave() {
    setOffset({ x: 0, y: 0 });
  }

  return (
    <motion.div animate={{ x: offset.x, y: offset.y }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
      <Link
        href={href}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className={primary ? "landing-btn-primary rounded-full px-6 py-3 text-sm font-medium" : "landing-btn-muted rounded-full px-6 py-3 text-sm font-medium"}
      >
        {label}
      </Link>
    </motion.div>
  );
}
