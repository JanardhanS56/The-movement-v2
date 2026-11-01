export const QueryKeys = {
  tasks: (movementId: string) => ["tasks", movementId] as const,
  task: (taskId: string) => ["task", taskId] as const,
  announcements: (movementId: string) => ["announcements", movementId] as const,
  signatures: (announcementId: string) => ["signatures", announcementId] as const,
  checkIns: (movementId: string) => ["check-ins", movementId] as const,
  aggregatedCheckIns: () => ["aggregated-check-ins"] as const,
  userProfile: (userId: string) => ["profile", userId] as const,
  badges: (userId: string) => ["badges", userId] as const,
  impactLedger: (userId: string) => ["impact-ledger", userId] as const,
  pendingVerifications: (verifierId: string) => ["pending-verifications", verifierId] as const,
} as const
