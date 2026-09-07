// @ts-check
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'public', 'data', 'projects.json');

// Ensure public/data directory exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

const server = http.createServer((req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  // Health / Status check
  if (url.pathname === '/api/status' || url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ admin: true, mode: 'local-admin', version: '1.0.0' }));
    return;
  }

  // Get projects data
  if (url.pathname === '/api/projects' && req.method === 'GET') {
    try {
      if (!fs.existsSync(DATA_FILE)) {
        const initial = { projects: [], lastUpdated: new Date().toISOString() };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf8');
      }
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    } catch (err) {
      console.error('Error reading projects:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to read projects data' }));
    }
    return;
  }

  // Save projects data
  if (url.pathname === '/api/projects' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        if (!parsed || !Array.isArray(parsed.projects)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid data format. Expected { projects: [...] }' }));
          return;
        }

        // Always stamp the lastUpdated time
        parsed.lastUpdated = new Date().toISOString();

        // Write safely to public/data/projects.json
        fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2), 'utf8');

        console.log(`[${new Date().toLocaleTimeString()}] Saved ${parsed.projects.length} projects to ${DATA_FILE}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, lastUpdated: parsed.lastUpdated }));
      } catch (err) {
        console.error('Error parsing/writing projects:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to save projects data' }));
      }
    });
    return;
  }

  // 404 for unknown endpoints
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(` Local Project Tracker API is running on port ${PORT}`);
  console.log(` Data storage: ${DATA_FILE}`);
  console.log(`===================================================`);
});
