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
let updatedFiles = 0

for (const file of files) {
  let content = fs.readFileSync(file, "utf8")
  const original = content

  // Replace emerald with lime tokens
  content = content
    .replace(/bg-emerald-500\/[0-9]+/g, "bg-lime/20")
    .replace(/border-emerald-500\/[0-9]+/g, "border-lime/40")
    .replace(/border-l-emerald-500(\/[0-9]+)?/g, "border-l-lime")
    .replace(/text-emerald-400/g, "text-lime")
    .replace(/text-emerald-500/g, "text-lime")

  // Replace amber with sun tokens
  content = content
    .replace(/bg-amber-500\/[0-9]+/g, "bg-sun/20")
    .replace(/border-amber-500\/[0-9]+/g, "border-sun/40")
    .replace(/border-l-amber-500(\/[0-9]+)?/g, "border-l-sun")
    .replace(/text-amber-400/g, "text-sun")
    .replace(/text-amber-500/g, "text-sun")

  if (content !== original) {
    fs.writeFileSync(file, content, "utf8")
    updatedFiles++
    console.log(`Replaced colors in: ${path.relative(process.cwd(), file)}`)
  }
}

console.log(`\nReplaced colors across ${updatedFiles} files.`)
