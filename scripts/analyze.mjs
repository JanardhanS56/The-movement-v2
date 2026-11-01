import { execSync } from "child_process"

process.env.ANALYZE = "true"
execSync("npx next build", { stdio: "inherit" })
