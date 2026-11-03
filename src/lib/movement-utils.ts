/**
 * Movement utility functions for unambiguous 5-character invite code generation.
 */

export function generateMovementInviteCode(): string {
  // Excluding visually ambiguous characters: 0/O, 1/I
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
  let code = ""
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

