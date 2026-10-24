import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'

// no git here, so the "build hash" is a hash of the build time. still a real, changing number.
const now = new Date()
const hash = createHash('sha1').update(String(now.getTime())).digest('hex').slice(0, 7)

export default defineConfig({
  plugins: [react()],
  define: { __BUILD_HASH__: JSON.stringify(hash), __BUILD_TIME__: JSON.stringify(now.toISOString()) },
  build: {
    chunkSizeWarningLimit: 1200,
    sourcemap: true,
    rollupOptions: {
      output: {
        // no manual chunks: the bundler splits along the lazy imports, so react stays in the entry and three.js/r3f only load with the 3d scenes
      },
    },
  },
})
