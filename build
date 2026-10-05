import { build } from 'esbuild'
import { mkdirSync, copyFileSync } from 'node:fs'

mkdirSync('dist', { recursive: true })

if (!process.env.WC_PROJECT_ID) {
  console.warn('WARNING: WC_PROJECT_ID is not set. The Trust Wallet Bitcoin connection will not work until you set it.')
}

await build({
  entryPoints: ['trust-btc.jsx'],
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  jsx: 'automatic',
  outfile: 'dist/trust-btc.js',
  define: {
    WC_PROJECT_ID: JSON.stringify(process.env.WC_PROJECT_ID || ''),
    'process.env.NODE_ENV': '"production"',
    global: 'globalThis',
  },
  logLevel: 'info',
})

copyFileSync('index.html', 'dist/index.html')
console.log('Built dist/index.html and dist/trust-btc.js')
