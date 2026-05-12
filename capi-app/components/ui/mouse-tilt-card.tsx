"use client";

import type { CSSProperties, MouseEvent, ReactNode } from "react";
import type { MotionProps } from "framer-motion";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";

type MouseTiltCardProps = {
  children: ReactNode;
  intensity?: number;
  className?: string;
  style?: CSSProperties;
  onMouseMove?: (event: MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (event: MouseEvent<HTMLDivElement>) => void;
} & Omit<MotionProps, "children">;


export function MouseTiltCard({
  children,
  className,
  intensity = 12,
  onMouseMove,
  onMouseLeave,
  style,
  ...rest
}: MouseTiltCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useSpring(y, { stiffness: 260, damping: 24, mass: 0.8 });
  const ry = useSpring(x, { stiffness: 260, damping: 24, mass: 0.8 });
  const transform = useMotionTemplate`perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;

  function onMove(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    x.set((px - 0.5) * intensity);
    y.set((0.5 - py) * intensity);
  }

  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      {...rest}
      style={{ ...style, transformStyle: "preserve-3d", transform }}
      className={className}
      onMouseMove={(event) => {
        onMove(event);
        onMouseMove?.(event);
      }}
      onMouseLeave={(event) => {
        onLeave();
        onMouseLeave?.(event);
      }}
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      {children}
    </motion.div>
  );
}

