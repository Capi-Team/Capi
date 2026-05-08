# TODO - Fix Prisma validation/runtime errors

- [x] Inspeccionar schema.prisma y encontrar que User no tiene `profileBio`/`avatarUrl`.
- [x] Añadir `profileBio` y `avatarUrl` al modelo `User` con `@map` a columnas snake_case.
- [ ] Ejecutar `prisma migrate dev` o al menos `prisma db push` según corresponda.
- [ ] Ejecutar `prisma generate`.
- [ ] Reiniciar el servidor Next y verificar `/dashboard` y endpoints de workspace-ai.
- [ ] Si persisten errores, inspeccionar modelos faltantes (`conversation`, `chatMessage`, `workspaceAIConfig`) en `schema.prisma` y alinear código.

