"use client";

import Particles, { initParticlesEngine } from "@tsparticles/react";
import { useEffect, useMemo, useState } from "react";
import { loadFull } from "tsparticles";
import type { ISourceOptions } from "@tsparticles/engine";

export function MouseFireTrail() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadFull(engine);
    }).then(() => {
      setReady(true);
    });
  }, []);

  const options = useMemo<ISourceOptions>(
    () => ({
      fullScreen: false,
      fpsLimit: 120,
      detectRetina: true,
      particles: {
        number: {
          value: 0,
        },
      },
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: "trail",
          },
          resize: {
            enable: true,
          },
        },
        modes: {
          trail: {
            delay: 0.01,
            quantity: 3,
            pauseOnStop: true,
            particles: {
              color: {
                value: ["#ff5a00", "#ff8a00", "#ffd166"],
              },
              move: {
                direction: "top",
                enable: true,
                outModes: {
                  default: "destroy",
                },
                speed: {
                  min: 0.8,
                  max: 2.8,
                },
              },
              opacity: {
                value: {
                  min: 0.22,
                  max: 0.75,
                },
                animation: {
                  enable: true,
                  speed: 2.6,
                  startValue: "max",
                  destroy: "min",
                },
              },
              size: {
                value: {
                  min: 1.4,
                  max: 3.8,
                },
              },
              life: {
                count: 1,
                duration: {
                  value: {
                    min: 0.2,
                    max: 0.6,
                  },
                },
              },
            },
          },
        },
      },
      background: {
        color: "transparent",
      },
    }),
    []
  );

  if (!ready) {
    return null;
  }

  return (
    <Particles
      id="mouse-fire-trail"
      className="pointer-events-none fixed inset-0 z-40"
      options={options}
    />
  );
}
