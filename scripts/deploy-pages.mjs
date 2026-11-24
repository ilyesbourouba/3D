// Publish the production build to the `gh-pages` branch (GitHub Pages: "Deploy from a branch").
// Usage: npm run deploy
// Builds into dist/, copies it into a temporary worktree of `gh-pages`, commits and pushes.
// The main branch is not touched (dist/ stays git-ignored there).
import { execSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const run = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', ...opts })
const out = (cmd, opts = {}) => execSync(cmd, { encoding: 'utf8', ...opts }).trim()

const BRANCH = 'gh-pages'
const source = out('git rev-parse --short HEAD')

console.log('▸ Building…')
run('npm run build')

const dir = mkdtempSync(join(tmpdir(), 'villa-pages-'))
rmSync(dir, { recursive: true, force: true })
try {
  out('git fetch origin', { stdio: 'pipe' })
  const remoteHas = out(`git ls-remote --heads origin ${BRANCH}`) !== ''
  if (remoteHas) run(`git worktree add -B ${BRANCH} "${dir}" origin/${BRANCH}`)
  else run(`git worktree add --orphan -b ${BRANCH} "${dir}"`)

  // replace everything with the fresh build
  for (const f of readdirSync(dir)) if (f !== '.git') rmSync(join(dir, f), { recursive: true, force: true })
  cpSync('dist', dir, { recursive: true })
  writeFileSync(join(dir, '.nojekyll'), '') // serve files as-is (no Jekyll processing)

  run('git add -A', { cwd: dir })
  if (out('git status --porcelain', { cwd: dir }) === '') {
    console.log('✓ Nothing changed since the last deployment.')
  } else {
    run(`git commit -q -m "Deploy ${source}"`, { cwd: dir })
    run(`git push -u origin ${BRANCH}`, { cwd: dir })
    console.log(`✓ Published build of ${source} to ${BRANCH}.`)
  }
} finally {
  if (existsSync(dir)) run(`git worktree remove --force "${dir}"`)
  else out('git worktree prune')
}
