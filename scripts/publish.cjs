// @ts-check
const fs = require('node:fs')
const path = require('node:path')
const { execSync } = require('node:child_process')

const DATA_FILE = path.join(__dirname, '..', 'public', 'data', 'projects.json')

console.log('====================================================')
console.log('       Project Gantt Tracker - Publish to Web')
console.log('====================================================\n')

// 1. Check Git availability
try {
  execSync('git --version', { stdio: 'pipe' })
} catch {
  console.error('[ERROR] Git is not installed or not found in system PATH.')
  process.exit(1)
}

// 2. Validate projects.json
if (!fs.existsSync(DATA_FILE)) {
  console.error(`[ERROR] Missing projects database file: ${DATA_FILE}`)
  process.exit(1)
}

let data
try {
  const content = fs.readFileSync(DATA_FILE, 'utf8')
  data = JSON.parse(content)
  if (!data || !Array.isArray(data.projects)) {
    throw new Error('Root property "projects" must be an array.')
  }
  console.log(`[OK] projects.json validated successfully (${data.projects.length} projects).`)
} catch (err) {
  console.error('[ERROR] Failed to validate public/data/projects.json:')
  console.error(err.message)
  process.exit(1)
}

// 3. Check for any git changes
let statusOutput = ''
try {
  statusOutput = execSync('git status --porcelain', { encoding: 'utf8' }).trim()
} catch (err) {
  console.error('[ERROR] Failed to get git status:', err.message)
  process.exit(1)
}

// Check if we have unpushed commits
let unpushed = ''
try {
  unpushed = execSync('git log @{u}..HEAD --oneline', { encoding: 'utf8', stdio: 'pipe' }).trim()
} catch {
  // If no upstream is set yet or error, proceed
}

if (!statusOutput && !unpushed) {
  console.log('\nNo project changes to publish.')
  console.log('Everything is already up-to-date with your GitHub repository.\n')
  process.exit(0)
}

// 4. Update lastUpdated timestamp if there were working changes
const now = new Date()
const isoTimestamp = now.toISOString()
if (statusOutput) {
  data.lastUpdated = isoTimestamp
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8')
  console.log(`[OK] Updated lastUpdated timestamp: ${isoTimestamp}`)
}

// 5. Format commit date time string: YYYY-MM-DD HH:mm:ss
const pad = (n) => String(n).padStart(2, '0')
const commitDateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
const commitMessage = `Update project progress - ${commitDateStr}`

// 6. Git add, commit, push
try {
  if (statusOutput) {
    console.log(`[...] Staging files: git add -A`)
    execSync('git add -A', { stdio: 'inherit' })

    console.log(`[...] Creating commit: "${commitMessage}"`)
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' })
  }

  console.log(`[...] Pushing to GitHub repository...`)
  execSync('git push', { stdio: 'inherit' })

  console.log('\n====================================================')
  console.log(' SUCCESS: Latest project updates published!')
  console.log(' GitHub Actions will now automatically update your')
  console.log(' live GitHub Pages website.')
  console.log('====================================================\n')
} catch (err) {
  console.error('\n[ERROR] Git push failed:')
  console.error(err.message)
  process.exit(1)
}
