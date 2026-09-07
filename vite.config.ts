import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

function localApiPlugin(): Plugin {
  const dataPath = path.resolve(import.meta.dirname, 'public/data/projects.json')

  return {
    name: 'local-api-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next()
        const parsedUrl = new URL(req.url, 'http://localhost:5173')

        if (parsedUrl.pathname === '/api/status' || parsedUrl.pathname === '/api/health') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ admin: true, mode: 'local-admin', version: '1.0.0' }))
          return
        }

        if (parsedUrl.pathname === '/api/projects') {
          if (req.method === 'GET') {
            try {
              if (!fs.existsSync(dataPath)) {
                const initial = { projects: [], lastUpdated: new Date().toISOString() }
                fs.writeFileSync(dataPath, JSON.stringify(initial, null, 2), 'utf8')
              }
              const data = fs.readFileSync(dataPath, 'utf8')
              res.setHeader('Content-Type', 'application/json')
              res.end(data)
            } catch {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Failed to read projects data' }))
            }
            return
          }

          if (req.method === 'POST') {
            let body = ''
            req.on('data', (chunk) => {
              body += chunk.toString()
            })
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body)
                if (!parsed || !Array.isArray(parsed.projects)) {
                  res.statusCode = 400
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: 'Invalid data format. Expected { projects: [...] }' }))
                  return
                }

                parsed.lastUpdated = new Date().toISOString()
                fs.writeFileSync(dataPath, JSON.stringify(parsed, null, 2), 'utf8')

                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ success: true, lastUpdated: parsed.lastUpdated }))
              } catch {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Failed to write projects data' }))
              }
            })
            return
          }
        }

        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    tailwindcss(),
    react(),
    localApiPlugin(),
  ],
})
