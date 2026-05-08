"use client";
// @ts-nocheck

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import "./MagicBento.css";

const cardData = [
  { color: "#120F17", title: "Analytics", description: "Track user behavior", label: "Insights" },
  { color: "#120F17", title: "Dashboard", description: "Centralized data view", label: "Overview" },
  { color: "#120F17", title: "Collaboration", description: "Work together seamlessly", label: "Teamwork" },
  { color: "#120F17", title: "Automation", description: "Streamline workflows", label: "Efficiency" },
  { color: "#120F17", title: "Integration", description: "Connect favorite tools", label: "Connectivity" },
  { color: "#120F17", title: "Security", description: "Enterprise-grade protection", label: "Protection" },
];

export default function MagicBento({
  textAutoHide = true,
  enableBorderGlow = true,
  disableAnimations = false,
  enableTilt = false,
  glowColor = "132, 0, 255",
  enableMagnetism = false,
}: {
  textAutoHide?: boolean;
  enableBorderGlow?: boolean;
  disableAnimations?: boolean;
  enableTilt?: boolean;
  glowColor?: string;
  enableMagnetism?: boolean;
}) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!gridRef.current || disableAnimations || isMobile) return;
    const cards = Array.from(gridRef.current.querySelectorAll(".magic-bento-card")) as HTMLElement[];
    const cleanups: Array<() => void> = [];

    cards.forEach((el) => {
      const move = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const glowIntensity = 1;
        const relativeX = (x / rect.width) * 100;
        const relativeY = (y / rect.height) * 100;
        el.style.setProperty("--glow-x", `${relativeX}%`);
        el.style.setProperty("--glow-y", `${relativeY}%`);
        el.style.setProperty("--glow-intensity", `${glowIntensity}`);
        el.style.setProperty("--glow-radius", "320px");
        if (enableTilt) {
          gsap.to(el, {
            rotateX: ((y - cy) / cy) * -8,
            rotateY: ((x - cx) / cx) * 8,
            duration: 0.15,
            ease: "power2.out",
            transformPerspective: 1000,
          });
        }
        if (enableMagnetism) {
          gsap.to(el, { x: (x - cx) * 0.04, y: (y - cy) * 0.04, duration: 0.2, ease: "power2.out" });
        }
      };
      const leave = () => {
        el.style.setProperty("--glow-intensity", "0");
        gsap.to(el, { rotateX: 0, rotateY: 0, x: 0, y: 0, duration: 0.25, ease: "power2.out" });
      };
      el.addEventListener("mousemove", move);
      el.addEventListener("mouseleave", leave);
      cleanups.push(() => {
        el.removeEventListener("mousemove", move);
        el.removeEventListener("mouseleave", leave);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [disableAnimations, enableMagnetism, enableTilt, isMobile]);

  return (
    <div className="card-grid" ref={gridRef}>
      {cardData.map((card, index) => {
        const className = `magic-bento-card ${textAutoHide ? "magic-bento-card--text-autohide" : ""} ${
          enableBorderGlow ? "magic-bento-card--border-glow" : ""
        }`;
        return (
          <div
            key={index}
            className={className}
            style={{ backgroundColor: card.color, ["--glow-color" as any]: glowColor }}
          >
            <div className="magic-bento-card__header">
              <div className="magic-bento-card__label">{card.label}</div>
            </div>
            <div className="magic-bento-card__content">
              <h2 className="magic-bento-card__title">{card.title}</h2>
              <p className="magic-bento-card__description">{card.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
