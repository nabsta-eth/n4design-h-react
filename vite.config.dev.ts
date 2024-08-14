import { defineConfig, UserConfig } from "vite";
import { getProdConfig } from "./vite.config";

// Config for debugging builds locally.
export default (userConfig: UserConfig) => {
  const config = getProdConfig(userConfig);
  return defineConfig({
    ...config,
    build: {
      ...config.build,
      minify: false,
      sourcemap: true,
    },
    optimizeDeps: {
      ...config.optimizeDeps,
      esbuildOptions: {
        ...config.optimizeDeps?.esbuildOptions,
        minify: false,
        sourcemap: true,
        minifySyntax: false,
      },
    },
  });
};
