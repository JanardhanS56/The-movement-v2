import { User } from "../schemas/user.schema"
import { Movement } from "../schemas/movement.schema"
import { Announcement } from "../schemas/announcement.schema"
import { AnnouncementSignature } from "../schemas/signature.schema"
import { Task, TaskClaim } from "../schemas/task.schema"
import { PeerVerification } from "../schemas/verification.schema"
import { AggregatedCheckInPoint, CheckIn } from "../schemas/check-in.schema"
import { Badge } from "../schemas/badge.schema"
import { ImpactLedgerEntry } from "../schemas/impact-ledger.schema"

export const SEED_MOVEMENT_ID = "00000000-0000-0000-0000-000000000001"

export const SEED_MOVEMENT: Movement = {
  id: SEED_MOVEMENT_ID,
  name: "Coastal Action Front",
  description: "Coordinating decentralized civic action and community support across coastal Karnataka.",
  slug: "coastal-action-front",
  is_active: true,
  created_by: "11111111-1111-1111-1111-111111111111",
  created_at: "2026-10-01T08:00:00Z",
}

export const SEED_USERS: User[] = [
  // 3 Organizers (Tier 3)
  {
    id: "11111111-1111-1111-1111-111111111111",
    display_name: "Priya Rao",
    avatar_url: null,
    tier: 3,
    created_at: "2026-10-01T08:00:00Z",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    display_name: "Rohan Shetty",
    avatar_url: null,
    tier: 3,
    created_at: "2026-10-01T08:30:00Z",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    display_name: "Ananya Kamath",
    avatar_url: null,
    tier: 3,
    created_at: "2026-10-01T09:00:00Z",
  },

  // 4 Other Users (2 Senior Volunteers, 2 Volunteers)
  {
    id: "44444444-4444-4444-4444-444444444444",
    display_name: "Devika Pai",
    avatar_url: null,
    tier: 2,
    created_at: "2026-10-05T10:00:00Z",
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    display_name: "Karthik Bhat",
    avatar_url: null,
    tier: 2,
    created_at: "2026-10-06T11:00:00Z",
  },
  {
    id: "66666666-6666-6666-6666-666666666666",
    display_name: "Sneha Nayak",
    avatar_url: null,
    tier: 1,
    created_at: "2026-10-10T12:00:00Z",
  },
  {
    id: "77777777-7777-7777-7777-777777777777",
    display_name: "Vikram Alva",
    avatar_url: null,
    tier: 1,
    created_at: "2026-10-12T14:00:00Z",
  },
]

export const SEED_ANNOUNCEMENTS: Announcement[] = [
  // 1: Published (2 of 2 signed)
  {
    id: "a1111111-1111-1111-1111-111111111111",
    movement_id: SEED_MOVEMENT_ID,
    created_by: "11111111-1111-1111-1111-111111111111",
    title: "Assembly Point Relocation Notice",
    body: "Please note that the central assembly location has moved to the Town Hall premises due to space requirements. Medical and hydration tents are already stationed.",
    required_signatures: 2,
    is_published: true,
    published_at: "2026-10-28T12:00:00Z",
    created_at: "2026-10-28T10:00:00Z",
  },
  // 2: Pending 1 of 3 (author auto-signed)
  {
    id: "a2222222-2222-2222-2222-222222222222",
    movement_id: SEED_MOVEMENT_ID,
    created_by: "11111111-1111-1111-1111-111111111111",
    title: "Severe Weather Warning Advisory",
    body: "Regional meteorological alert issued for coastal zones between 14:00 and 18:00. Field stewards must verify all temporary shade structures are secured.",
    required_signatures: 3,
    is_published: false,
    published_at: null,
    created_at: "2026-10-31T09:00:00Z",
  },
  // 3: Pending 2 of 3 (author + 1 organizer signed)
  {
    id: "a3333333-3333-3333-3333-333333333333",
    movement_id: SEED_MOVEMENT_ID,
    created_by: "22222222-2222-2222-2222-222222222222",
    title: "Volunteer Evening Shift Rotation",
    body: "Evening support shifts will transition at 17:30. Volunteers in Zone B and C must hand over check-in radios to the incoming coordinators.",
    required_signatures: 3,
    is_published: false,
    published_at: null,
    created_at: "2026-10-31T11:00:00Z",
  },
]

export const SEED_SIGNATURES: AnnouncementSignature[] = [
  // For announcement 1 (both signed)
  {
    id: "s1111111-1111-1111-1111-111111111111",
    announcement_id: "a1111111-1111-1111-1111-111111111111",
    signed_by: "11111111-1111-1111-1111-111111111111",
    signed_at: "2026-10-28T10:00:00Z",
  },
  {
    id: "s2222222-2222-2222-2222-222222222222",
    announcement_id: "a1111111-1111-1111-1111-111111111111",
    signed_by: "22222222-2222-2222-2222-222222222222",
    signed_at: "2026-10-28T12:00:00Z",
  },
  // For announcement 2 (1 of 3 signed by author)
  {
    id: "s3333333-3333-3333-3333-333333333333",
    announcement_id: "a2222222-2222-2222-2222-222222222222",
    signed_by: "11111111-1111-1111-1111-111111111111",
    signed_at: "2026-10-31T09:00:00Z",
  },
  // For announcement 3 (2 of 3 signed by author + Rohan)
  {
    id: "s4444444-4444-4444-4444-444444444444",
    announcement_id: "a3333333-3333-3333-3333-333333333333",
    signed_by: "22222222-2222-2222-2222-222222222222",
    signed_at: "2026-10-31T11:00:00Z",
  },
  {
    id: "s5555555-5555-5555-5555-555555555555",
    announcement_id: "a3333333-3333-3333-3333-333333333333",
    signed_by: "33333333-3333-3333-3333-333333333333",
    signed_at: "2026-10-31T11:45:00Z",
  },
]

export const SEED_TASKS: Task[] = [
  // 1. open
  {
    id: "t1111111-1111-1111-1111-111111111111",
    movement_id: SEED_MOVEMENT_ID,
    created_by: "11111111-1111-1111-1111-111111111111",
    title: "Water Station Distribution Setup",
    description: "Set up 4 drinking water refill barrels near the main gate and ensure cups are stocked.",
    reward_points: 40,
    required_volunteers: 2,
    status: "open",
    created_at: "2026-10-25T08:00:00Z",
  },
  // 2. open
  {
    id: "t2222222-2222-2222-2222-222222222222",
    movement_id: SEED_MOVEMENT_ID,
    created_by: "11111111-1111-1111-1111-111111111111",
    title: "Route Navigation Signage Posting",
    description: "Install directional arrow signs from the bus terminal to the gathering ground.",
    reward_points: 50,
    required_volunteers: 1,
    status: "open",
    created_at: "2026-10-25T09:00:00Z",
  },
  // 3. in_progress
  {
    id: "t3333333-3333-3333-3333-333333333333",
    movement_id: SEED_MOVEMENT_ID,
    created_by: "22222222-2222-2222-2222-222222222222",
    title: "Medical Supply Pack Inspection",
    description: "Audit first-aid packs for sterile gauze, electrolyte packets, and contact numbers.",
    reward_points: 60,
    required_volunteers: 1,
    status: "in_progress",
    created_at: "2026-10-26T10:00:00Z",
  },
  // 4. in_progress
  {
    id: "t4444444-4444-4444-4444-444444444444",
    movement_id: SEED_MOVEMENT_ID,
    created_by: "22222222-2222-2222-2222-222222222222",
    title: "Information Pamphlet Distribution",
    description: "Distribute bilingual rights and safety cards along the northern pedestrian concourse.",
    reward_points: 45,
    required_volunteers: 2,
    status: "in_progress",
    created_at: "2026-10-27T10:00:00Z",
  },
  // 5. pending_verification (MANDATORY REQUIREMENT)
  {
    id: "t5555555-5555-5555-5555-555555555555",
    movement_id: SEED_MOVEMENT_ID,
    created_by: "33333333-3333-3333-3333-333333333333",
    title: "Community Kitchen Dry Ration Count",
    description: "Complete an inventory audit of rice, lentils, and clean cooking water containers.",
    reward_points: 80,
    required_volunteers: 1,
    status: "pending_verification",
    created_at: "2026-10-28T07:30:00Z",
  },
  // 6. completed (MANDATORY REQUIREMENT)
  {
    id: "t6666666-6666-6666-6666-666666666666",
    movement_id: SEED_MOVEMENT_ID,
    created_by: "11111111-1111-1111-1111-111111111111",
    title: "Legal Support Hotline Duty Roster",
    description: "Finalize lawyer contact availability sheet for the weekend coordination window.",
    reward_points: 100,
    required_volunteers: 1,
    status: "completed",
    created_at: "2026-10-20T08:00:00Z",
  },
  // 7. cancelled
  {
    id: "t7777777-7777-7777-7777-777777777777",
    movement_id: SEED_MOVEMENT_ID,
    created_by: "11111111-1111-1111-1111-111111111111",
    title: "Temporary Rain Shelter Dismantling",
    description: "Dismantle canopy frames after midday sun cleared. Cancelled as shade remains needed.",
    reward_points: 30,
    required_volunteers: 2,
    status: "cancelled",
    created_at: "2026-10-22T13:00:00Z",
  },
  // 8. open
  {
    id: "t8888888-8888-8888-8888-888888888888",
    movement_id: SEED_MOVEMENT_ID,
    created_by: "33333333-3333-3333-3333-333333333333",
    title: "Bicycle Courier Dispatch Coordination",
    description: "Coordinate message relays between field stewards where cellular reception is congested.",
    reward_points: 75,
    required_volunteers: 3,
    status: "open",
    created_at: "2026-10-29T11:00:00Z",
  },
]

export const SEED_TASK_CLAIMS: TaskClaim[] = [
  // Claim for Task 3 (in_progress by Devika Pai)
  {
    id: "c3333333-3333-3333-3333-333333333333",
    task_id: "t3333333-3333-3333-3333-333333333333",
    claimed_by: "44444444-4444-4444-4444-444444444444",
    status: "in_progress",
    note: "Gathered kit boxes, currently counting bandages.",
    claimed_at: "2026-10-26T11:00:00Z",
  },
  // Claim for Task 4 (in_progress by Sneha Nayak)
  {
    id: "c4444444-4444-4444-4444-444444444444",
    task_id: "t4444444-4444-4444-4444-444444444444",
    claimed_by: "66666666-6666-6666-6666-666666666666",
    status: "in_progress",
    note: "Picked up printed batch from center.",
    claimed_at: "2026-10-27T11:00:00Z",
  },
  // Claim for Task 5 (pending_verification by Karthik Bhat)
  {
    id: "c5555555-5555-5555-5555-555555555555",
    task_id: "t5555555-5555-5555-5555-555555555555",
    claimed_by: "55555555-5555-5555-5555-555555555555",
    status: "pending_verification",
    note: "All 50 dry packs logged and verified in pantry room.",
    claimed_at: "2026-10-28T08:00:00Z",
    completed_at: "2026-10-28T12:00:00Z",
  },
  // Claim for Task 6 (verified / completed by Vikram Alva)
  {
    id: "c6666666-6666-6666-6666-666666666666",
    task_id: "t6666666-6666-6666-6666-666666666666",
    claimed_by: "77777777-7777-7777-7777-777777777777",
    status: "verified",
    note: "Lawyer schedule cross-checked with all 8 attorneys.",
    claimed_at: "2026-10-20T09:00:00Z",
    completed_at: "2026-10-20T14:00:00Z",
    verified_at: "2026-10-20T16:00:00Z",
  },
]

export const SEED_PEER_VERIFICATIONS: PeerVerification[] = [
  // Verifiers for Claim 5 (Karthik's claim, pending 1 more approval out of 3)
  {
    id: "v1111111-1111-1111-1111-111111111111",
    claim_id: "c5555555-5555-5555-5555-555555555555",
    verifier_id: "44444444-4444-4444-4444-444444444444", // Devika
    vote: "approve",
    voted_at: "2026-10-28T13:00:00Z",
    assigned_at: "2026-10-28T12:00:00Z",
    expires_at: "2026-10-29T12:00:00Z",
  },
  {
    id: "v2222222-2222-2222-2222-222222222222",
    claim_id: "c5555555-5555-5555-5555-555555555555",
    verifier_id: "66666666-6666-6666-6666-666666666666", // Sneha
    vote: null,
    voted_at: null,
    assigned_at: "2026-10-28T12:00:00Z",
    expires_at: "2026-10-29T12:00:00Z",
  },
  {
    id: "v3333333-3333-3333-3333-333333333333",
    claim_id: "c5555555-5555-5555-5555-555555555555",
    verifier_id: "77777777-7777-7777-7777-777777777777", // Vikram
    vote: null,
    voted_at: null,
    assigned_at: "2026-10-28T12:00:00Z",
    expires_at: "2026-10-29T12:00:00Z",
  },
]

// 8 Badge definitions
export const SEED_BADGES: Badge[] = [
  {
    id: "b1111111-1111-1111-1111-111111111111",
    user_id: "11111111-1111-1111-1111-111111111111",
    claim_id: null,
    badge_type: "movement_founder",
    badge_label: "Movement Founder",
    issued_by: "organizer_override",
    issued_by_user: "11111111-1111-1111-1111-111111111111",
    awarded_at: "2026-10-01T08:00:00Z",
  },
  {
    id: "b2222222-2222-2222-2222-222222222222",
    user_id: "22222222-2222-2222-2222-222222222222",
    claim_id: null,
    badge_type: "early_adopter",
    badge_label: "Early Responder",
    issued_by: "organizer_override",
    issued_by_user: "11111111-1111-1111-1111-111111111111",
    awarded_at: "2026-10-01T08:30:00Z",
  },
  {
    id: "b3333333-3333-3333-3333-333333333333",
    user_id: "33333333-3333-3333-3333-333333333333",
    claim_id: null,
    badge_type: "early_adopter",
    badge_label: "Early Responder",
    issued_by: "organizer_override",
    issued_by_user: "11111111-1111-1111-1111-111111111111",
    awarded_at: "2026-10-01T09:00:00Z",
  },
  {
    id: "b4444444-4444-4444-4444-444444444444",
    user_id: "44444444-4444-4444-4444-444444444444",
    claim_id: null,
    badge_type: "organizer_verified",
    badge_label: "Field Medic Steward",
    issued_by: "organizer_override",
    issued_by_user: "11111111-1111-1111-1111-111111111111",
    awarded_at: "2026-10-05T12:00:00Z",
  },
  {
    id: "b5555555-5555-5555-5555-555555555555",
    user_id: "55555555-5555-5555-5555-555555555555",
    claim_id: null,
    badge_type: "organizer_verified",
    badge_label: "Supply Coordinator",
    issued_by: "organizer_override",
    issued_by_user: "22222222-2222-2222-2222-222222222222",
    awarded_at: "2026-10-06T13:00:00Z",
  },
  {
    id: "b6666666-6666-6666-6666-666666666666",
    user_id: "66666666-6666-6666-6666-666666666666",
    claim_id: null,
    badge_type: "task_complete",
    badge_label: "Route Scout",
    issued_by: "peer_vote",
    awarded_at: "2026-10-15T15:00:00Z",
  },
  {
    id: "b7777777-7777-7777-7777-777777777777",
    user_id: "77777777-7777-7777-7777-777777777777",
    claim_id: "c6666666-6666-6666-6666-666666666666",
    badge_type: "task_complete",
    badge_label: "Legal Support Champion",
    issued_by: "peer_vote",
    awarded_at: "2026-10-20T16:00:00Z",
  },
  {
    id: "b8888888-8888-8888-8888-888888888888",
    user_id: "77777777-7777-7777-7777-777777777777",
    claim_id: null,
    badge_type: "organizer_verified",
    badge_label: "Community Pillar",
    issued_by: "organizer_override",
    issued_by_user: "11111111-1111-1111-1111-111111111111",
    awarded_at: "2026-10-21T10:00:00Z",
  },
]

export const SEED_IMPACT_ENTRIES: ImpactLedgerEntry[] = [
  {
    id: "i1111111-1111-1111-1111-111111111111",
    user_id: "77777777-7777-7777-7777-777777777777",
    task_id: "t6666666-6666-6666-6666-666666666666",
    task_title: "Legal Support Hotline Duty Roster",
    verification_method: "peer_vote",
    verified_by_detail: "Verified by 3 peers",
    reward_points: 100,
    verified_at: "2026-10-20T16:00:00Z",
  },
  {
    id: "i2222222-2222-2222-2222-222222222222",
    user_id: "44444444-4444-4444-4444-444444444444",
    task_id: undefined,
    task_title: "Emergency Medical Camp Setup",
    verification_method: "organizer_override",
    verified_by_detail: "Verified by Priya Rao",
    reward_points: 150,
    verified_at: "2026-10-05T12:00:00Z",
  },
]

/**
 * Exactly 40 aggregated check-in points near Mangalore coordinates:
 * Centered around lat 12.870 to 12.920, lng 74.840 to 74.880, rounded to 3 decimals.
 */
export const SEED_CHECK_IN_POINTS: AggregatedCheckInPoint[] = [
  { lat: 12.871, lng: 74.842, intensity: 0.9 },
  { lat: 12.872, lng: 74.843, intensity: 0.8 },
  { lat: 12.873, lng: 74.841, intensity: 0.85 },
  { lat: 12.875, lng: 74.845, intensity: 0.95 },
  { lat: 12.876, lng: 74.848, intensity: 0.7 },
  { lat: 12.878, lng: 74.850, intensity: 0.65 },
  { lat: 12.880, lng: 74.852, intensity: 0.75 },
  { lat: 12.882, lng: 74.851, intensity: 0.8 },
  { lat: 12.884, lng: 74.853, intensity: 0.85 },
  { lat: 12.886, lng: 74.855, intensity: 0.9 },
  { lat: 12.888, lng: 74.857, intensity: 0.95 },
  { lat: 12.890, lng: 74.858, intensity: 1.0 },
  { lat: 12.891, lng: 74.859, intensity: 0.95 },
  { lat: 12.893, lng: 74.860, intensity: 0.85 },
  { lat: 12.895, lng: 74.862, intensity: 0.8 },
  { lat: 12.897, lng: 74.864, intensity: 0.7 },
  { lat: 12.899, lng: 74.865, intensity: 0.65 },
  { lat: 12.901, lng: 74.866, intensity: 0.6 },
  { lat: 12.903, lng: 74.868, intensity: 0.75 },
  { lat: 12.905, lng: 74.870, intensity: 0.8 },
  { lat: 12.907, lng: 74.871, intensity: 0.85 },
  { lat: 12.909, lng: 74.873, intensity: 0.7 },
  { lat: 12.911, lng: 74.874, intensity: 0.65 },
  { lat: 12.913, lng: 74.875, intensity: 0.6 },
  { lat: 12.915, lng: 74.876, intensity: 0.55 },
  { lat: 12.917, lng: 74.878, intensity: 0.5 },
  { lat: 12.919, lng: 74.879, intensity: 0.65 },
  { lat: 12.874, lng: 74.846, intensity: 0.9 },
  { lat: 12.879, lng: 74.849, intensity: 0.85 },
  { lat: 12.883, lng: 74.854, intensity: 0.9 },
  { lat: 12.887, lng: 74.856, intensity: 0.8 },
  { lat: 12.892, lng: 74.861, intensity: 0.85 },
  { lat: 12.896, lng: 74.863, intensity: 0.75 },
  { lat: 12.900, lng: 74.867, intensity: 0.7 },
  { lat: 12.904, lng: 74.869, intensity: 0.65 },
  { lat: 12.908, lng: 74.872, intensity: 0.6 },
  { lat: 12.912, lng: 74.875, intensity: 0.55 },
  { lat: 12.916, lng: 74.877, intensity: 0.5 },
  { lat: 12.885, lng: 74.852, intensity: 0.9 },
  { lat: 12.889, lng: 74.859, intensity: 0.95 },
]

export const SEED_RAW_CHECK_INS: CheckIn[] = SEED_CHECK_IN_POINTS.map((pt, i) => ({
  id: `k0000000-0000-0000-0000-${String(i + 1).padStart(12, "0")}`,
  movement_id: SEED_MOVEMENT_ID,
  user_id: SEED_USERS[i % SEED_USERS.length].id,
  lat: pt.lat,
  lng: pt.lng,
  accuracy: 12.5,
  checked_in_at: new Date(Date.now() - i * 60000).toISOString(),
}))
