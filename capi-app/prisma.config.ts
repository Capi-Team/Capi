import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Usa aquí tu enlace directo temporalmente o de forma definitiva para desarrollo
    // Asegúrate de que en tu .env la variable DIRECT_URL tenga el puerto 5432 en lugar del 6543
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});