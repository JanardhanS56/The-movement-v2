import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const SRC_DIR = join(process.cwd(), 'src')

// Extensions to scan (source and style files)
const SCANNED_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.css',
  '.json',
  '.md',
])

const BANNED_PATTERNS = [
  { name: 'Em dash (—)', regex: /\u2014/ },
  { name: 'href="#"', regex: /href\s*=\s*["']#["']/ },
  { name: 'TODO comment/text', regex: /\bTODO\b/i },
  { name: 'Lorem ipsum placeholder', regex: /\blorem\b/i },
  { name: '": any" type annotation', regex: /:\s*any\b/ },
  { name: '"as any" type cast', regex: /\bas\s+any\b/ },
  { name: 'Emoji characters', regex: /\p{Extended_Pictographic}/u },
  { name: 'Direct localStorage usage', regex: /\blocalStorage\b/ },
]

function collectFiles(dir) {
  const entries = readdirSync(dir)
  const files = []

  for (const entry of entries) {
    const fullPath = join(dir, entry)
    if (entry === 'node_modules' || entry === '.next') {
      continue
    }

    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      files.push(...collectFiles(fullPath))
    } else if (stat.isFile()) {
      if (entry.endsWith('.d.ts')) {
        continue
      }
      const dotIndex = entry.lastIndexOf('.')
      const ext = dotIndex !== -1 ? entry.slice(dotIndex).toLowerCase() : ''
      if (SCANNED_EXTENSIONS.has(ext)) {
        files.push(fullPath)
      }
    }
  }

  return files
}

function runCheck() {
  const files = collectFiles(SRC_DIR)
  let violationCount = 0

  for (const file of files) {
    const content = readFileSync(file, 'utf8')
    const lines = content.split(/\r?\n/)
    const relPath = relative(process.cwd(), file)

    lines.forEach((line, index) => {
      for (const pattern of BANNED_PATTERNS) {
        if (pattern.regex.test(line)) {
          console.error(
            `[BANNED PATTERN] ${pattern.name} found in ${relPath}:${index + 1}\n  > ${line.trim()}`
          )
          violationCount++
        }
      }
    })
  }

  if (violationCount > 0) {
    console.error(`\nCheck failed: ${violationCount} banned pattern violation(s) found in src/.\n`)
    process.exit(1)
  }

  console.log(`Check passed: 0 banned patterns found across ${files.length} files in src/.`)
}

runCheck()
