import { z } from "zod"

const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
const uuidField = z.string().regex(uuidPattern, "Invalid UUID")

export const CheckInSchema = z.object({
  id: uuidField,
  movement_id: uuidField,
  user_id: uuidField,
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  checked_in_at: z.string().datetime(),
})
export type CheckIn = z.infer<typeof CheckInSchema>

export const CreateCheckInSchema = z.object({
  movement_id: uuidField,
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
})
export type CreateCheckInInput = z.infer<typeof CreateCheckInSchema>

export const AggregatedCheckInPointSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  intensity: z.number().min(0).max(1),
})
export type AggregatedCheckInPoint = z.infer<typeof AggregatedCheckInPointSchema>
