import Link from "next/link";

export default function Home() {
  return (
    <div className="magic-sky min-h-screen text-[#f8f3e7]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="text-sm font-semibold tracking-[0.2em] text-[#ffe1a1]">FLOWLOGIX</div>
        <nav className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="rounded-md border border-[#efc26f]/40 px-4 py-2 text-sm text-[#fff6df] transition hover:bg-[#ffffff1a]"
          >
            Inicio de sesión
          </Link>
          <Link
            href="/auth/register"
            className="rounded-md bg-[#f3ad3c] px-4 py-2 text-sm font-medium text-[#1f2d4d] transition hover:bg-[#f0a52c]"
          >
            Register
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-6 py-16">
        <section className="magic-glow w-full max-w-2xl rounded-2xl border border-[#f1cf87]/30 bg-[#fff8eb]/95 px-8 py-12 text-center text-[#1f2d4d] shadow-[0_20px_80px_rgba(7,17,48,0.3)]">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[#b67e20]">Bienvenido</p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">FlowLogix</h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-[#405173]">
            Onboarding empresarial con una experiencia suave, cercana y segura. Una interfaz
            inspirada en tonos calidos, cielo azul rey y destellos sutiles.
          </p>
          <div className="mx-auto mt-8 h-1 w-24 rounded-full bg-[#f3ad3c]" />
        </section>
      </main>
    </div>
  );
}
