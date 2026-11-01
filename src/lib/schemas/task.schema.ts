import { z } from "zod"
import { uuidField } from "./common"

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
  description: z.string().max(2000).optional(),
  reward_points: z.number().int().min(0).max(10000),
  required_volunteers: z.number().int().min(1).max(100),
  required_skills: z.array(z.string()).default([]).optional(),
  status: TaskStatusSchema,
  created_by: uuidField,
  metadata: z.record(z.string(), z.unknown()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
})
export type Task = z.infer<typeof TaskSchema>

export const CreateTaskSchema = z.object({
  movement_id: uuidField,
  title: z.string().min(5).max(120),
  description: z.string().max(2000).optional(),
  reward_points: z.number().int().min(0).max(10000).default(50),
  required_volunteers: z.number().int().min(1).max(100).default(1),
  required_skills: z.array(z.string()).default([]).optional(),
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
  claimed_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable().optional(),
  verified_at: z.string().datetime().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})
export type TaskClaim = z.infer<typeof TaskClaimSchema>
