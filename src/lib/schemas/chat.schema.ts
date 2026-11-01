import { z } from "zod"
import { ALLOWED_REACTION_KEYS } from "../constants/chat"

export const MessageStatusSchema = z.enum(["sending", "sent", "failed", "removed"])
export type MessageStatus = z.infer<typeof MessageStatusSchema>

export const ReactionKeySchema = z.enum(ALLOWED_REACTION_KEYS)

export const ReportReasonSchema = z.enum([
  "harassment",
  "spam",
  "private_information",
  "dangerous_content",
  "other",
])

const uuidRegex =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

export const ReactionsMapSchema = z
  .record(z.string(), z.array(z.string().regex(uuidRegex, "Invalid user UUID")))
  .refine(
    (rec) =>
      Object.keys(rec).every((k) =>
        (ALLOWED_REACTION_KEYS as readonly string[]).includes(k)
      ),
    { message: "Invalid reaction key: must be one of the allowed keys" }
  )

export const MessageSchema = z.object({
  id: z.string().regex(uuidRegex, "Invalid UUID"),
  roomId: z.string().min(1, "Room ID is required"),
  authorId: z.string().regex(uuidRegex, "Invalid author UUID"),
  text: z.string().trim().min(1, "Message text cannot be empty").max(500, "Maximum 500 characters"),
  createdAt: z.string().datetime({ offset: true }),
  status: MessageStatusSchema,
  replyToId: z.string().regex(uuidRegex, "Invalid reply UUID").optional().nullable(),
  mentions: z.array(z.string().regex(uuidRegex, "Invalid mention UUID")),
  reactions: ReactionsMapSchema,
  taskRef: z.string().regex(uuidRegex, "Invalid task UUID").optional().nullable(),
  isDemo: z.boolean().default(true),
})

export type Message = z.infer<typeof MessageSchema>

export const CreateMessageInputSchema = z.object({
  roomId: z.string().min(1),
  text: z.string().trim().min(1).max(500),
  replyToId: z.string().regex(uuidRegex).optional().nullable(),
  taskRef: z.string().regex(uuidRegex).optional().nullable(),
})

export type CreateMessageInput = z.infer<typeof CreateMessageInputSchema>
