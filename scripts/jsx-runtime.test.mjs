import process from 'node:process'
import { createServer } from 'vite'

const server = await createServer({
  logLevel: 'silent',
  server: { middlewareMode: true },
})
const transformed = await server.transformRequest('/src/main.jsx')
const usesAutomaticRuntime = /(?:react_jsx-dev-runtime|jsxDEV)/.test(transformed?.code || '')

if (!usesAutomaticRuntime) {
  console.error('JSX runtime check failed: Vite is compiling JSX without React automatic runtime support.')
} else {
  console.log('JSX runtime check passed.')
}

void server.close()
process.exit(usesAutomaticRuntime ? 0 : 1)
