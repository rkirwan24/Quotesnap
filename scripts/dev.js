#!/usr/bin/env node
/**
 * dev.js — starts Next.js and prints the phone-accessible URL
 * Run with: node scripts/dev.js  (or just: npm run dev)
 */
const { execSync, spawn } = require('child_process')
const os = require('os')

function getLocalIP() {
  const nets = os.networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }
  return null
}

const ip = getLocalIP()
const port = process.env.PORT || 3000

console.log('\n  QuoteSnap dev server starting...\n')
console.log(`  Laptop:  http://localhost:${port}`)
if (ip) {
  console.log(`  Phone:   http://${ip}:${port}  ← open this on your phone`)
  console.log(`           (phone must be on the same WiFi)\n`)
}

const next = spawn(
  'npx',
  ['next', 'dev', '--hostname', '0.0.0.0', '--port', String(port)],
  { stdio: 'inherit', shell: true }
)

next.on('exit', (code) => process.exit(code ?? 0))
