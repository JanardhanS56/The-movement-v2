import fs from "fs"
import path from "path"

const patterns = {
  "bg-blue-": /\bbg-blue-[a-z0-9]+/g,
  "text-blue-": /\btext-blue-[a-z0-9]+/g,
  "border-blue-": /\bborder-blue-[a-z0-9]+/g,
  "slate-": /\b(bg|text|border|ring|from|to|via|outline|fill|stroke)-slate-[0-9]+/g,
  "zinc-": /\b(bg|text|border|ring|from|to|via|outline|fill|stroke)-zinc-[0-9]+/g,
  "gray-": /\b(bg|text|border|ring|from|to|via|outline|fill|stroke)-gray-[0-9]+/g,
  "neutral-": /\b(bg|text|border|ring|from|to|via|outline|fill|stroke)-neutral-[0-9]+/g,
  "indigo-": /\b(bg|text|border|ring|from|to|via|outline|fill|stroke)-indigo-[0-9]+/g,
  "font-mono": /\bfont-mono\b/g,
  "uppercase": /\buppercase\b/g,
  "tracking-": /\btracking-[a-z0-9-]+\b/g,
  "gradient": /\b(bg-gradient-[a-z0-9-]+|from-[a-z0-9-]+|via-[a-z0-9-]+|to-[a-z0-9-]+)\b/g,
  "shadow-": /\bshadow-(sm|md|lg|xl|2xl|inner|none)\b/g,
  "rounded-": /\brounded-(none|sm|md|lg|xl|2xl|3xl|full)\b/g,
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
  // We can skip globals.css when auditing hardcoded tokens in components, but let's audit everything in src
  const content = fs.readFileSync(file, "utf8")
  for (const [key, regex] of Object.entries(patterns)) {
    const matches = content.match(regex)
    if (matches) {
      counts[key] += matches.length
    }
  }
}

console.log("=== TOKEN & CLASS AUDIT ===")
console.table(counts)
