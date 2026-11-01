import { z } from "zod"

export const uuidPattern =
  /^[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}$|^temp-[a-zA-Z0-9_-]+$/

export const uuidField = z.string().regex(uuidPattern, "Invalid UUID")
export const idField = uuidField

export const isoDateTime = z.string().datetime({ offset: true })

