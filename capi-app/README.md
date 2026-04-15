# 🌊 FlowLogix - Plataforma de Onboarding Interactivo

FlowLogix es una plataforma moderna de onboarding para empleados nuevos. Utiliza Next.js 14+ (App Router), TypeScript y TailwindCSS para entregar experiencias interactivas de aprendizaje gamificadas.

[![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4+-purple.svg)](https://tailwindcss.com/)

## 🎯 Descripción del Proyecto

Plataforma MVP para onboarding interactivo:
- **Dashboard** personalizado por empleado
- **Módulos learning** con quizzes y progreso
- **Paths** de aprendizaje adaptativos
- **API** serverless para progreso/auth
- **Escalable** a IA/RAG futuro

## 📁 Estructura de Carpetas

```
capi-app/
├── app/                    # Rutas (App Router)
│   ├── api/               # API endpoints (auth, users, onboarding)
│   ├── auth/              # Login/Register
│   ├── dashboard/         # Dashboard (layout + pages)
│   ├── learning/          # [module]/, paths/
│   └── onboarding/        # Flow inicial
├── components/            # React components por feature
│   ├── ui/                # Atómicos (button, card, modal)
│   ├── dashboard/         # Sidebar, header, metrics
│   ├── learning/          # Progress-bar, module-card, quiz
│   └── ai/                # Chat-widget (futuro)
├── lib/                   # Utils (auth, db, config)
├── data/                  # Mock JSON (users, modules, progress)
├── types/                 # TypeScript types
├── public/images/         # Assets
├── tailwind.config.ts     # Tailwind
├── postcss.config.mjs     # Tailwind 4
└── ... configs existentes
```

**Propósitos clave:**
- **app/**: Server-side rendering, API routes.
- **components/ui/**: Reutilizables, estilo Shadcn/UI.
- **lib/**: Lógica business, no UI.
- **data/**: Mock para desarrollo rápido → DB real.
- **types/**: Tipos estrictos, escalable.

## ⚙️ Instalación y Uso

```bash
cd capi-app
npm install
npm run dev  # http://localhost:3000
```

Build/Deploy:
```bash
npm run build
npm run start
```

## 🗂️ Convenciones del Proyecto

- **Naming**: kebab-case folders, PascalCase components.
- **Components**: `Component.tsx` siempre.
- **Types**: `types/*.ts` centralizados.
- **API**: `app/api/[feature]/route.ts`.
- **No inline styles** - Tailwind classes.
- **Hooks**: `use[Name]Hook.ts` en lib/.

## 🌿 GitFlow (Equipo de 3 devs)

- **main**: Producción (solo merges de develop).
- **develop**: Integración estable.
- **feature/xyz**: Features nuevas (`git checkout -b feature/onboarding-flow`).
- **hotfix/abc**: Fixes urgentes.

**Workflow:**
```
1. git checkout develop
2. git pull origin develop
3. git checkout -b feature/[nombre]
4. Commit atómicamente: git commit -m 'feat: add login page'
5. git push origin feature/[nombre]
6. PR a develop → Review → Merge
7. Release: PR develop → main
```

**Commitizen:** `git cz` para conventional commits.

## 🚀 Crear Nueva Feature

1. `git checkout -b feature/[nombre-desc]`
2. Crear página en `app/[feature]/page.tsx`
3. Componentes en `components/[feature]/`
4. Types en `types/[name].ts`
5. Mock data si aplica
6. Tests: `__tests__/[feature].test.tsx`
7. PR + Review

**Ejemplo: Nuevo módulo learning**
```
app/learning/intro/page.tsx
components/learning/intro-video.tsx
types/intro-module.ts
data/intro.json
```

## 🏗️ Buenas Prácticas (Equipo)

- **Code Review**: Siempre 2 approvals.
- **ESLint/Prettier**: Auto-fix pre-commit.
- **TypeScript**: Strict mode, no `any`.
- **Performance**: useMemo/useCallback en lists.
- **Accessibility**: aria-labels, keyboard nav.
- **Mobile-first**: Tailwind responsive.
- **Testing**: Jest + React Testing Library.
- **Docs**: JSDoc en utils/lib.

## 📈 Escalabilidad Futura

- **DB**: Drizzle/Postgres.
- **Auth**: NextAuth/Lucia.
- **IA**: OpenAI API en `/api/ai/`.
- **RAG**: Vector DB para docs empresa.
- **State**: Zustand/Jotai.

## 🤝 Contribuir

1. Fork → Clone
2. `npm i`
3. Branch `feature/xyz`
4. PR a `develop`

¡Gracias por contribuir a FlowLogix! 🚀
