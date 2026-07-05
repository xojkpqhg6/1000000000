import { defineConfig } from "vite";

export default defineConfig({
  // Relative Pfade – funktioniert auf GitHub Pages im Unterordner
  // (username.github.io/repo-name/) ohne den Repo-Namen zu kennen.
  base: "./",
  // Vorgegebenen Port (z. B. aus PORT-Env des Preview-Tools) übernehmen,
  // sonst der klassische Vite-Default 5173.
  server: { port: process.env.PORT ? Number(process.env.PORT) : 5173 },
});
