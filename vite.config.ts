// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Deploying to Vercel. Vercel's Node.js serverless runtime (unlike
  // Cloudflare Workers) supports a normal TCP Postgres driver, so the
  // vercel preset (Build Output API) is fine here — the actual bug was
  // never preset-specific, see the ssr.external note below.
  nitro: {
    preset: "vercel",
  },
  vite: {
    server: {
      watch: {
        ignored: ["**/.vercel/**", "**/.output/**"],
      },
    },
    ssr: {
      // Nitro's Rolldown SSR bundler mis-chunks better-auth's internal
      // CJS-interop helper when it inlines the package: the generated
      // ssr.mjs ends up exporting a local binding named `ssr_exports`
      // that was never actually imported into that chunk's scope
      // (SyntaxError: Export 'ssr_exports' is not defined in module,
      // thrown at request time on both the vercel and node-server
      // presets — confirmed by reproducing it locally with node-server).
      // Since the deploy target is a real Node process either way,
      // it's safe to leave better-auth unbundled and let Node resolve
      // it from node_modules at runtime instead of routing it through
      // the buggy inlining path.
      external: ["better-auth"],
    },
  },
});
