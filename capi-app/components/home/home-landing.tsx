"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export function HomeLanding() {
  return (
    <div className="coffee-bg min-h-screen text-[var(--coffee-ink)]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-sm font-semibold tracking-[0.2em] text-[var(--coffee-dark)]"
        >
          CAPI
        </motion.div>
        <nav className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/auth/login"
              className="coffee-btn-outline rounded-lg px-4 py-2 text-sm transition-colors"
            >
              Iniciar sesión
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/auth/register"
              className="coffee-btn-primary rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              Crear cuenta
            </Link>
          </motion.div>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-16">
        <motion.section
          className="coffee-card w-full max-w-2xl px-8 py-12 text-center"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.08 } },
            hidden: {},
          }}
        >
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mb-3 text-xs uppercase tracking-[0.28em] text-[var(--coffee-muted)]"
          >
            Bienvenido
          </motion.p>
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl font-semibold leading-tight sm:text-5xl"
          >
            Aprende y crece con claridad
          </motion.h1>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-6 max-w-xl text-base text-[var(--coffee-muted)]"
          >
            Regístrate con tu correo, organiza tu entorno de trabajo y accede al panel con una
            experiencia cálida y profesional.
          </motion.p>
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-10 h-1 w-24 rounded-full bg-[var(--coffee-accent)]"
          />
        </motion.section>

        <motion.div
          className="mt-12 grid w-full max-w-3xl gap-4 sm:grid-cols-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          {[
            { t: "Acceso seguro", d: "Sesión con JWT y cookies httpOnly." },
            { t: "Tu espacio", d: "Crea o únete a entornos de trabajo con código." },
            { t: "Simple", d: "Sin OAuth corporativo ni dominios bloqueados." },
          ].map((item, i) => (
            <motion.div
              key={item.t}
              className="coffee-card-muted rounded-xl p-4 text-left"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.06, duration: 0.35 }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <p className="text-sm font-semibold text-[var(--coffee-dark)]">{item.t}</p>
              <p className="mt-1 text-xs text-[var(--coffee-muted)]">{item.d}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
