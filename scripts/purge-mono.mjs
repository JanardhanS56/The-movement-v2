import fs from "fs"
import path from "path"

function getAllFiles(dir) {
  let files = []
  const list = fs.readdirSync(dir)
  for (const file of list) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      files = files.concat(getAllFiles(fullPath))
    } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      files.push(fullPath)
    }
  }
  return files
}

const files = getAllFiles(path.resolve(process.cwd(), "src"))
let totalReplacements = 0

for (const file of files) {
  const content = fs.readFileSync(file, "utf8")
  if (content.includes("font-mono")) {
    const updated = content.replace(/\bfont-mono\b/g, "tabular-nums")
    fs.writeFileSync(file, updated, "utf8")
    totalReplacements++
    console.log(`Purged font-mono from: ${path.relative(process.cwd(), file)}`)
  }
}

console.log(`\nCompleted: Purged font-mono from ${totalReplacements} files.`)
