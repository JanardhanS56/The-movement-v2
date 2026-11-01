import { describe, it, expect } from "vitest"
import {
  getUnreadCount,
  getMentionCount,
  getReactionTotals,
  parseMentions,
  searchMessages,
} from "../mocks/chat-pure"
import { Message, MessageSchema } from "../schemas/chat.schema"
import { SEED_USERS } from "../mocks/seed-data"
import { SupabaseChatAdapter, NotImplementedError } from "../api/chat"

describe("Chat pure functions and schema tests", () => {
  const u1 = SEED_USERS[0].id
  const u2 = SEED_USERS[1].id
  const u3 = SEED_USERS[2].id

  const sampleMessages: Message[] = [
    {
      id: "11111111-2222-4333-8444-555555555551",
      roomId: "everyone",
      authorId: u1,
      text: "First announcement message",
      createdAt: "2026-10-10T10:00:00Z",
      status: "sent",
      replyToId: null,
      mentions: [u2],
      reactions: {
        thumbs_up: [u2, u3],
        heart: [u2],
      },
      taskRef: null,
      isDemo: true,
    },
    {
      id: "11111111-2222-4333-8444-555555555552",
      roomId: "everyone",
      authorId: u2,
      text: "Reply with @janardhan mention",
      createdAt: "2026-10-10T11:00:00Z",
      status: "sent",
      replyToId: "11111111-2222-4333-8444-555555555551",
      mentions: [u1],
      reactions: {
        thanks: [u1],
      },
      taskRef: null,
      isDemo: true,
    },
    {
      id: "11111111-2222-4333-8444-555555555553",
      roomId: "everyone",
      authorId: u3,
      text: "Message removed by moderator",
      createdAt: "2026-10-10T12:00:00Z",
      status: "removed",
      replyToId: null,
      mentions: [u1],
      reactions: {
        thumbs_up: [u1],
      },
      taskRef: null,
      isDemo: true,
    },
  ]

  it("calculates unread counts correctly excluding removed and blocked", () => {
    // Before any read time: both non-removed messages count
    expect(getUnreadCount("everyone", null, sampleMessages)).toBe(2)

    // After 10:30: only the second message (11:00) counts
    expect(getUnreadCount("everyone", "2026-10-10T10:30:00Z", sampleMessages)).toBe(1)

    // After 12:30: 0 unread
    expect(getUnreadCount("everyone", "2026-10-10T12:30:00Z", sampleMessages)).toBe(0)

    // If author u2 is blocked: only u1's message counts (1 unread at start)
    expect(getUnreadCount("everyone", null, sampleMessages, [u2])).toBe(1)
  })

  it("calculates mention counts accurately", () => {
    // u1 is mentioned in message 2 (at 11:00) and message 3 (removed, should be excluded)
    expect(getMentionCount(u1, null, sampleMessages)).toBe(1)

    // After 11:30: 0 unread mentions
    expect(getMentionCount(u1, "2026-10-10T11:30:00Z", sampleMessages)).toBe(0)

    // If u2 (author of mention) is blocked, returns 0
    expect(getMentionCount(u1, null, sampleMessages, [u2])).toBe(0)
  })

  it("derives reaction totals sorted by highest count and respects blocks", () => {
    const msg = sampleMessages[0]
    // thumbs_up: 2, heart: 1
    const totals = getReactionTotals(msg, u2)
    expect(totals).toHaveLength(2)
    expect(totals[0].key).toBe("thumbs_up")
    expect(totals[0].count).toBe(2)
    expect(totals[0].hasReacted).toBe(true)
    expect(totals[1].key).toBe("heart")
    expect(totals[1].count).toBe(1)

    // If u3 is blocked, thumbs_up count drops to 1
    const blockedTotals = getReactionTotals(msg, u2, [u3])
    expect(blockedTotals[0].count).toBe(1)

    // Removed message returns empty totals
    const removedTotals = getReactionTotals(sampleMessages[2], u1)
    expect(removedTotals).toHaveLength(0)
  })

  it("parses valid @handle mentions from text", () => {
    const text = "Hello @janardhan and @rohan-shetty, please review this"
    const mentions = parseMentions(text, SEED_USERS)
    expect(mentions).toContain(SEED_USERS[0].id)
    expect(mentions).toContain(SEED_USERS[1].id)
    expect(mentions).toHaveLength(2)

    // Non-existent user handle
    const unknownText = "Contact @nonexistent-person"
    expect(parseMentions(unknownText, SEED_USERS)).toHaveLength(0)
  })

  it("searches messages in room case-insensitively and filters out removed", () => {
    const results = searchMessages("everyone", "announcement", sampleMessages)
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe(sampleMessages[0].id)

    // Removed message is omitted even if text matches
    const removedSearch = searchMessages("everyone", "removed", sampleMessages)
    expect(removedSearch).toHaveLength(0)
  })

  it("validates valid Message schema and rejects invalid reaction keys", () => {
    expect(() => MessageSchema.parse(sampleMessages[0])).not.toThrow()

    // Invalid reaction key
    const invalidMsg = {
      ...sampleMessages[0],
      reactions: {
        dislike: [u1],
      },
    }
    expect(() => MessageSchema.parse(invalidMsg)).toThrow()
  })

  it("ensures SupabaseChatAdapter methods throw NotImplementedError", async () => {
    const adapter = new SupabaseChatAdapter()
    await expect(adapter.listMessages()).rejects.toThrow(NotImplementedError)
    await expect(adapter.sendMessage()).rejects.toThrow(NotImplementedError)
    await expect(adapter.deleteMessage()).rejects.toThrow(NotImplementedError)
    await expect(adapter.removeMessageByOrganizer()).rejects.toThrow(NotImplementedError)
    await expect(adapter.reportMessage()).rejects.toThrow(NotImplementedError)
    await expect(adapter.toggleReaction()).rejects.toThrow(NotImplementedError)
    await expect(adapter.pinMessage()).rejects.toThrow(NotImplementedError)
    await expect(adapter.getPinnedMessage()).rejects.toThrow(NotImplementedError)
    expect(() => adapter.subscribe()).toThrow(NotImplementedError)
  })
})
