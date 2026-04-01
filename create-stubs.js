#!/usr/bin/env node
/**
 * Create all missing stub files for Claude Code build
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BUILD_SRC = join(__dirname, 'build-src', 'src')

// Helper to create directory and file
async function createStub(path, content) {
  const fullPath = join(BUILD_SRC, path)
  await mkdir(dirname(fullPath), { recursive: true })
  await writeFile(fullPath, content, 'utf8')
  console.log(`  Created: ${path}`)
}

console.log('🔧 Creating missing stub files...\n')

// Core stubs
await createStub('stubs/bun-bundle.js', `
// Stub for bun:bundle
export function feature(name) { return false }
`)

await createStub('types/connectorText.js', `
// Stub for connector text
export const CONNECTOR_TEXT = {}
`)

await createStub('sdk/runtimeTypes.js', `
// Stub for SDK runtime types
export const RuntimeTypes = {}
`)

await createStub('sdk/toolTypes.js', `
// Stub for SDK tool types  
export const ToolTypes = {}
`)

await createStub('coreTypes.generated.js', `
// Stub for generated core types
export const CoreTypes = {}
`)

await createStub('protectedNamespace.js', `
// Stub for protected namespace
export const ProtectedNamespace = {}
export default {}
`)

// Assistant stubs
await createStub('assistant/index.js', `
// Stub for assistant
export default function Assistant() {}
`)

await createStub('bridge/peerSessions.js', `
// Stub for peer sessions
export const PeerSessions = {}
`)

// Compact stubs
await createStub('compact/cachedMicrocompact.js', `
// Stub for cached microcompact
export const CachedMicrocompact = {}
`)

await createStub('contextCollapse/index.js', `
// Stub for context collapse
export const ContextCollapse = {}
`)

await createStub('coordinator/workerAgent.js', `
// Stub for coordinator worker agent
export const WorkerAgent = {}
`)

// Commands stubs
const commands = [
  'commands/agents-platform/index.js',
  'commands/assistant/index.js',
  'commands/buddy/index.js',
  'commands/fork/index.js',
  'commands/peers/index.js',
  'commands/proactive.js',
  'commands/remoteControlServer/index.js',
  'commands/subscribe-pr.js',
  'commands/torch.js',
  'commands/workflows/index.js',
  'commands/force-snip.js'
]

for (const cmd of commands) {
  await createStub(cmd, `// Stub for ${cmd}\nexport default {}\n`)
}

console.log('\n✅ All stub files created!')
console.log('\nNow you can run: node scripts/build.mjs')
