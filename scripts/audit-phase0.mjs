import fs from "fs"
import path from "path"

const patterns = {
  "uppercase": /\buppercase\b/g,
  "tracking-": /\btracking-[a-z0-9-]+\b/g,
  "text-\\[": /\btext-\[[^\]]+\]/g,
  "[ACTIVE]": /\[ACTIVE\]/g,
  "text-lime": /\btext-lime\b/g,
  "text-yellow": /\btext-yellow-[0-9]+\b/g,
  "text-amber": /\btext-amber-[0-9]+\b/g,
  "font-mono": /\bfont-mono\b/g,
  "Simulate Failure": /Simulate Failure/g,
  "Cryptographic consensus": /Cryptographic consensus/gi,
  "decentralized peer consensus": /decentralized peer consensus/gi,
  "operational directives": /operational directives/gi,
  "authorization privileges": /authorization privileges/gi,
  "privacy grid": /privacy grid/gi,
  "Supabase magic link": /Supabase magic link/gi,
  "Verified ID: 11111111": /Verified ID: 11111111/gi,
}

function getAllFiles(dir, exts = [".ts", ".tsx", ".css", ".html"]) {
  let files = []
  const list = fs.readdirSync(dir)
  for (const file of list) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, exts))
    } else if (exts.some((ext) => fullPath.endsWith(ext))) {
      files.push(fullPath)
    }
  }
  return files
}

const srcDir = path.resolve(process.cwd(), "src")
const files = getAllFiles(srcDir)

const counts = {}
for (const key of Object.keys(patterns)) {
  counts[key] = 0
}

for (const file of files) {
  const content = fs.readFileSync(file, "utf8")
  for (const [key, regex] of Object.entries(patterns)) {
    const matches = content.match(regex)
    if (matches) {
      counts[key] += matches.length
    }
  }
}

console.log("=== PHASE 0 BEFORE COUNTS ===")
console.table(counts)
