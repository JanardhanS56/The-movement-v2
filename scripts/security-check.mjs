import { readFileSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { execSync as exec } from 'node:child_process'

// Forbidden file patterns that must NEVER be tracked in git
const FORBIDDEN_FILE_PATTERNS = [
  /^\.env$/i,
  /^\.env\.(local|production|development|test)$/i,
  /\.pem$/i,
  /\.key$/i,
  /\.pfx$/i,
  /id_rsa/i,
  /id_ed25519/i,
  /service-account.*\.json$/i,
]

// High-risk secret patterns inside source code
const SECRET_SIGNATURES = [
  {
    name: 'Supabase Service Role JWT',
    regex: /eyJhbGciOi[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g,
    validator: (match, content) => {
      // Allow placeholder tokens or example strings in doc/seed files if explicitly labeled dummy
      if (content.includes('REPLACE_ME') || content.includes('your-project.supabase.co')) return false
      return match.length > 80
    },
  },
  {
    name: 'Exposed Database Connection URI with Password',
    regex: /postgres(?:ql)?:\/\/[^:]+:[^@\s'"]+@[^/\s'"]+\/[^\s'"]+/gi,
    validator: (match) => {
      // Skip template placeholders like [user]:[password]
      if (match.includes('[password]') || match.includes('user:password@')) return false
      return true
    },
  },
  {
    name: 'Hardcoded Supabase Service Role Key Assignment',
    regex: /(?:SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE_KEY)\s*[:=]\s*["'][A-Za-z0-9-_]{20,}["']/i,
  },
  {
    name: 'Private Key Header',
    regex: /-----BEGIN\s+(?:RSA|EC|DSA|OPENSSH|PGP)?\s*PRIVATE\s+KEY-----/i,
  },
  {
    name: 'GitHub Personal Access Token',
    regex: /gh[pousr]_[A-Za-z0-9_]{36,255}/,
  },
  {
    name: 'AWS Access Key ID',
    regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/,
  },
  {
    name: 'Generic API Key / Secret Hardcoded String',
    regex: /(?:api[_-]?key|secret[_-]?key|access[_-]?token)\s*[:=]\s*["'][A-Za-z0-9+/=_-]{24,}["']/i,
    validator: (match) => {
      if (match.includes('your_') || match.includes('replace_') || match.includes('NEXT_PUBLIC_')) return false
      return true
    },
  },
]

// Allowed exceptions / safe files
const ALLOWED_EXCEPTIONS = [
  '.env.example',
  'package-lock.json',
  'scripts/security-check.mjs',
]

function getTrackedFiles() {
  try {
    const stdout = exec('git ls-files', { encoding: 'utf8' })
    return stdout.split(/\r?\n/).filter(Boolean)
  } catch {
    console.warn('Warning: Not a git repository or git command failed. Skipping git ls-files.')
    return []
  }
}

function runSecurityAudit() {
  console.log('🔒 Starting Security & Secret Exposure Audit...\n')
  const trackedFiles = getTrackedFiles()
  let violationCount = 0

  // 1. Check for committed forbidden files (.env, private keys, certificates)
  console.log('1. Checking for forbidden sensitive files tracked in git...')
  for (const file of trackedFiles) {
    if (ALLOWED_EXCEPTIONS.includes(file)) continue

    const baseName = file.split('/').pop() || file
    for (const pattern of FORBIDDEN_FILE_PATTERNS) {
      if (pattern.test(baseName)) {
        console.error(`❌ CRITICAL SECURITY ERROR: Sensitive file tracked in git repository: ${file}`)
        console.error('   Fix: git rm --cached ' + file + ' && add it to .gitignore\n')
        violationCount++
      }
    }
  }

  // 2. Scan tracked file contents for leaked secrets, API keys, and connection strings
  console.log('2. Scanning tracked codebase for secret credentials and tokens...')
  for (const file of trackedFiles) {
    if (ALLOWED_EXCEPTIONS.includes(file)) continue
    if (file.startsWith('.next/') || file.startsWith('node_modules/')) continue

    // Skip binary files and images
    const ext = file.split('.').pop()?.toLowerCase()
    if (['png', 'jpg', 'jpeg', 'ico', 'svg', 'webp', 'woff', 'woff2', 'gz', 'tar'].includes(ext || '')) {
      continue
    }

    if (!existsSync(file)) continue

    const content = readFileSync(file, 'utf8')
    const lines = content.split(/\r?\n/)

    lines.forEach((line, lineIndex) => {
      for (const sig of SECRET_SIGNATURES) {
        if (sig.regex.test(line)) {
          // If regex is global, reset lastIndex
          sig.regex.lastIndex = 0
          const match = line.match(sig.regex)?.[0] || ''

          if (sig.validator && !sig.validator(match, content)) {
            continue
          }

          // Redact most of the matched secret in the console log
          const redacted = match.length > 8 ? `${match.slice(0, 4)}...${match.slice(-4)}` : '***'
          console.error(
            `❌ LEAK DETECTED: [${sig.name}] in ${file}:${lineIndex + 1}`
          )
          console.error(`   Found potential secret: ${redacted}`)
          console.error(`   Line content: ${line.trim().slice(0, 80)}...\n`)
          violationCount++
        }
      }
    })
  }

  if (violationCount > 0) {
    console.error(`\n🚨 SECURITY CHECK FAILED: Found ${violationCount} security violation(s).`)
    console.error('Commit/Push aborted. Remove the exposed credentials or sensitive files before continuing.\n')
    process.exit(1)
  }

  console.log(`✅ Security check passed: 0 exposed secrets or forbidden files found across ${trackedFiles.length} tracked files.\n`)
}

runSecurityAudit()
