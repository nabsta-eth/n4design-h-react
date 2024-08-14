import { loadEnv, UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import { visualizer } from "rollup-plugin-visualizer";

export const getProdConfig = ({ mode }: UserConfig): UserConfig => ({
  root: ".",
  build: {
    target: "esnext",
    outDir: "build",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
          // Keep main entry in its own chunk (index).
        },
      },
    },
  },
  plugins: [react(), wasm(), visualizer()],
  define: {
    "process.env": {
      ...process.env,
      ...loadEnv(mode!, process.cwd()),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis.
      define: {
        global: "globalThis",
      },
      // Enable esbuild polyfill plugins.
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
        }),
      ],
    },
  },
});

export default (config: UserConfig) => getProdConfig(config);
