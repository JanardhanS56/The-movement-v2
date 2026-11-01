import { z } from "zod"
import { uuidField, isoDateTime } from "./common"

export const TaskStatusSchema = z.enum([
  "open",
  "in_progress",
  "pending_verification",
  "completed",
  "cancelled",
])
export type TaskStatus = z.infer<typeof TaskStatusSchema>

export const TaskSchema = z.object({
  id: uuidField,
  movement_id: uuidField,
  title: z.string().min(5).max(120),
  description: z.string().max(2000).nullable().optional(),
  reward_points: z.number().int().min(0).max(10000),
  required_volunteers: z.number().int().min(1).max(100),
  required_skills: z.array(z.string()).default([]).nullable().optional(),
  status: TaskStatusSchema,
  created_by: uuidField,
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  created_at: isoDateTime,
  updated_at: isoDateTime.nullable().optional(),
})
export type Task = z.infer<typeof TaskSchema>

export const CreateTaskSchema = z.object({
  movement_id: uuidField.optional().default("00000000-0000-4000-8000-000000000001"),
  title: z.string().min(5).max(120),
  description: z.string().max(2000).nullable().optional(),
  reward_points: z.number().int().min(0).max(10000).default(50),
  required_volunteers: z.number().int().min(1).max(100).default(1),
  required_skills: z.array(z.string()).default([]).nullable().optional(),
})
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>

export const TaskClaimStatusSchema = z.enum([
  "in_progress",
  "pending_verification",
  "verified",
  "rejected",
  "withdrawn",
])
export type TaskClaimStatus = z.infer<typeof TaskClaimStatusSchema>

export const ClaimTaskSchema = z.object({
  task_id: uuidField,
  note: z.string().max(500).optional(),
})
export type ClaimTaskInput = z.infer<typeof ClaimTaskSchema>

export const TaskClaimSchema = z.object({
  id: uuidField,
  task_id: uuidField,
  claimed_by: uuidField,
  status: TaskClaimStatusSchema,
  note: z.string().max(500).nullable().optional(),
  proof_url: z.string().nullable().optional(),
  claimed_at: isoDateTime,
  completed_at: isoDateTime.nullable().optional(),
  verified_at: isoDateTime.nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})
export type TaskClaim = z.infer<typeof TaskClaimSchema>
