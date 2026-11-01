export type GroundTruthEventType = "announcement" | "task_completed" | "emergency_alert"

export interface GroundTruthAuthor {
  id: string
  name: string
  handle: string
  tier: 1 | 2 | 3
  roleTitle: string
  avatarUrl: string
}

export interface CryptographicProof {
  algorithm: string
  signatureHex: string
  publicKeyFingerprint: string
  verified: boolean
  blockNumber: number
  merkleRoot: string
  parentHash: string
}

export interface GroundTruthCommit {
  id: string
  commitHash: string // e.g. #a1b2c3d
  fullSha256: string
  parentHash: string // e.g. #0000000 or previous hash
  timestamp: string // ISO timestamp down to the minute
  eventType: GroundTruthEventType
  title: string
  summary: string
  details: string
  author: GroundTruthAuthor
  proof: CryptographicProof
  tags: string[]
  metadata: {
    location?: string
    signaturesVerified?: number
    signaturesRequired?: number
    impactPointsAwarded?: number
    verificationType?: string
    sector?: string
  }
}

export const GROUND_TRUTH_COMMITS: GroundTruthCommit[] = [
  {
    id: "gt-commit-012",
    commitHash: "#d1928ec",
    fullSha256: "d1928ec7f5b401e9a24c81f03bb91a5e78cd01b3e8a491f2c4e610b7194f280a",
    parentHash: "#0f7b62a",
    timestamp: "2026-11-01T10:00:00Z",
    eventType: "announcement",
    title: "Summary of Demands Formal Presentation",
    summary: "Citizen assembly memorandum officially submitted to the Municipal Commissioner with signed endorsement of 4,200 participants.",
    details: "The 8-point resolution regarding clean water access, transparent local budgets, and coastal ecology preservation was presented at Town Hall with full quorum. Official acknowledgement receipt #KA-MNG-2026-992 signed.",
    author: {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Janardhan",
      handle: "janardhan",
      tier: 3,
      roleTitle: "Movement Organizer",
      avatarUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=Janardhan",
    },
    proof: {
      algorithm: "Ed25519-SHA512",
      signatureHex: "b9c71a04e5d891b2c7e0912f7a4b81c30e9d4128f1b620a9e4d7159c3e80b2a7",
      publicKeyFingerprint: "SHA256:4a8b...19e0",
      verified: true,
      blockNumber: 12,
      merkleRoot: "7fa1...99bc",
      parentHash: "#0f7b62a",
    },
    tags: ["Demands", "Municipal", "Memorandum"],
    metadata: {
      location: "Town Hall Premises, Mangalore",
      signaturesVerified: 3,
      signaturesRequired: 3,
      sector: "Main Civic Complex",
    },
  },
  {
    id: "gt-commit-011",
    commitHash: "#0f7b62a",
    fullSha256: "0f7b62a98e10d4c51b72a08f3e91c4b75a28cd19e04f618b2a3d7194f8019ab3",
    parentHash: "#4c910fb",
    timestamp: "2026-10-31T19:00:00Z",
    eventType: "task_completed",
    title: "Post-Assembly Site Clean-Up & Recycling",
    summary: "Collected and segregated 45 waste bags; zero litter left on public park grounds; recyclables transferred to municipal partner.",
    details: "18 volunteer teams swept the gathering grounds from 17:00 to 19:00. 100% of organic waste and paper placards were sorted. Public ground restored to pristine condition.",
    author: {
      id: "66666666-6666-4666-8666-666666666666",
      name: "Arjun Rao",
      handle: "arjun-rao",
      tier: 1,
      roleTitle: "Active Volunteer",
      avatarUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=ArjunRao",
    },
    proof: {
      algorithm: "Ed25519-SHA512",
      signatureHex: "82a17f09c4d8e12b70f391a84b5c62d0e719a84b2c159e4d708f3e91b2c6a084",
      publicKeyFingerprint: "SHA256:8b1f...55c2",
      verified: true,
      blockNumber: 11,
      merkleRoot: "c18e...20fd",
      parentHash: "#4c910fb",
    },
    tags: ["Environment", "Clean-up", "Civic Stewardship"],
    metadata: {
      location: "Town Hall Public Grounds",
      impactPointsAwarded: 75,
      verificationType: "Peer consensus (4 verified)",
      sector: "Sector 1 & 2 Grounds",
    },
  },
  {
    id: "gt-commit-010",
    commitHash: "#4c910fb",
    fullSha256: "4c910fb82a19e07f3d61b58a9c4e20d871b9c3f0e5a82194b6d701c9a83e5f20",
    parentHash: "#8a2d3e1",
    timestamp: "2026-10-31T11:40:00Z",
    eventType: "emergency_alert",
    title: "Supply Delivery Delay Advisory",
    summary: "Secondary medical supply truck delayed by 30 mins due to perimeter traffic. Temporary rationing in effect at South Gate.",
    details: "Perimeter route congestion along National Highway 66 delayed replenishment vehicle. Bandages and electrolyte sachets pooled from Zone A cache to maintain uninterrupted field care.",
    author: {
      id: "44444444-4444-4444-8444-444444444444",
      name: "Devika Pai",
      handle: "devika-pai",
      tier: 2,
      roleTitle: "Senior Field Steward",
      avatarUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=DevikaPai",
    },
    proof: {
      algorithm: "Ed25519-SHA512",
      signatureHex: "39a08f71b2c6e4d58019f2a74c8b91d30e5f62a98b1c4e7d018f29c3a8b4e710",
      publicKeyFingerprint: "SHA256:19e0...77ab",
      verified: true,
      blockNumber: 10,
      merkleRoot: "5e20...11da",
      parentHash: "#8a2d3e1",
    },
    tags: ["Logistics", "Emergency", "Medical Supply"],
    metadata: {
      location: "South Gate Triage Depot",
      sector: "Zone B Triage",
      signaturesVerified: 1,
      signaturesRequired: 1,
    },
  },
  {
    id: "gt-commit-009",
    commitHash: "#8a2d3e1",
    fullSha256: "8a2d3e170f92b4c581e091a4b6c82d70e3f591a82c4b71d9e08f2a93b5c61840",
    parentHash: "#b5192fa",
    timestamp: "2026-10-31T08:15:00Z",
    eventType: "task_completed",
    title: "Acoustic & Sound Equipment Setup",
    summary: "Installed battery-powered PA systems across 3 relay points ensuring clear public address coverage without main grid dependency.",
    details: "Deployed independent high-clarity megaphone towers at Central Circle, West Plaza, and South Entrance. Decibel test verified within municipal 75dB compliance boundaries.",
    author: {
      id: "55555555-5555-4555-8555-555555555555",
      name: "David Kim",
      handle: "david-kim",
      tier: 2,
      roleTitle: "Field Coordinator",
      avatarUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=DavidKim",
    },
    proof: {
      algorithm: "Ed25519-SHA512",
      signatureHex: "71e09a82b4c581f390d2a74c8b61e0d98f3a5b2c149e7d082f1b62a98c4e09f5",
      publicKeyFingerprint: "SHA256:22bb...88d1",
      verified: true,
      blockNumber: 9,
      merkleRoot: "99aa...33cc",
      parentHash: "#b5192fa",
    },
    tags: ["Infrastructure", "Audio", "Public Safety"],
    metadata: {
      location: "Central Circle & Relay Posts",
      impactPointsAwarded: 80,
      verificationType: "Organizer Verification (Verified by Janardhan)",
      sector: "Sector 1 Audio Post",
    },
  },
  {
    id: "gt-commit-008",
    commitHash: "#b5192fa",
    fullSha256: "b5192fa8109d7c4b5e28a901f4c63d871a9e20b5f8c47190e2b3a841d9e05f62",
    parentHash: "#98e01d3",
    timestamp: "2026-10-30T17:30:00Z",
    eventType: "announcement",
    title: "Volunteer Evening Shift Rotation Handover",
    summary: "Shift transition active. Volunteers in Zone B and C handed over check-in radios and battery packs to incoming coordinators.",
    details: "Night protocol activated. Safety marshals in pairs of two will maintain visibility along lighted transit corridors until 21:00. Rest station open at Community Center.",
    author: {
      id: "22222222-2222-4222-8222-222222222222",
      name: "Rohan Shetty",
      handle: "rohan-shetty",
      tier: 3,
      roleTitle: "Movement Organizer",
      avatarUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=RohanShetty",
    },
    proof: {
      algorithm: "Ed25519-SHA512",
      signatureHex: "14f092b7a8c5e1d908f2a74b3c61d8e09f5a82b1c4e97d028f1a62c98b4e70f1",
      publicKeyFingerprint: "SHA256:55cc...99ef",
      verified: true,
      blockNumber: 8,
      merkleRoot: "0a1b...88fe",
      parentHash: "#98e01d3",
    },
    tags: ["Handover", "Shifts", "Safety Protocol"],
    metadata: {
      location: "Zone B & C Coordinator Desk",
      signaturesVerified: 2,
      signaturesRequired: 2,
      sector: "Sector 2 West",
    },
  },
  {
    id: "gt-commit-007",
    commitHash: "#98e01d3",
    fullSha256: "98e01d372b4c581a90f2a74b6c81e0d98f3a5b2c149e7d082f1b62a98c4e09f5",
    parentHash: "#72b14c5",
    timestamp: "2026-10-29T16:00:00Z",
    eventType: "task_completed",
    title: "Legal Support Hotline Duty Roster",
    summary: "Staffed emergency legal documentation intake for 6 hours; recorded 14 field reports with zero unlogged inquiries.",
    details: "Helpline 555-0199 manned without disruption. Coordinated rapid bail observers and rights advocacy liaisons across southern district stations.",
    author: {
      id: "77777777-7777-4777-8777-777777777777",
      name: "Vikram Alva",
      handle: "vikram-alva",
      tier: 1,
      roleTitle: "Volunteer Lawyer",
      avatarUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=VikramAlva",
    },
    proof: {
      algorithm: "Ed25519-SHA512",
      signatureHex: "90f1a82b4c6e7d028f5a72b1c4e98d038f1a62c98b4e70f114f092b7a8c5e1d9",
      publicKeyFingerprint: "SHA256:77aa...11bc",
      verified: true,
      blockNumber: 7,
      merkleRoot: "4d70...55cc",
      parentHash: "#72b14c5",
    },
    tags: ["Legal", "Hotline", "Civil Rights"],
    metadata: {
      location: "Civil Documentation Cell",
      impactPointsAwarded: 100,
      verificationType: "Peer consensus (3 peers verified)",
      sector: "Sector 1 Legal Hub",
    },
  },
  {
    id: "gt-commit-006",
    commitHash: "#72b14c5",
    fullSha256: "72b14c5908f2a74b6c81e0d98f3a5b2c149e7d082f1b62a98c4e09f598e01d37",
    parentHash: "#1f4a980",
    timestamp: "2026-10-29T14:05:00Z",
    eventType: "emergency_alert",
    title: "Perimeter Crowd Surge Alert: Sector 3",
    summary: "High density bottleneck observed along Sector 3 western access. Marshals re-routing incoming groups through eastern boulevard.",
    details: "Sudden arrival of 3 passenger coaches congested pedestrian turnstiles. Marshals with megaphone guidance redirected foot traffic within 8 minutes. Flow normalized.",
    author: {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Janardhan",
      handle: "janardhan",
      tier: 3,
      roleTitle: "Movement Organizer",
      avatarUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=Janardhan",
    },
    proof: {
      algorithm: "Ed25519-SHA512",
      signatureHex: "28f1a62c98b4e70f114f092b7a8c5e1d990f1a82b4c6e7d028f5a72b1c4e98d0",
      publicKeyFingerprint: "SHA256:4a8b...19e0",
      verified: true,
      blockNumber: 6,
      merkleRoot: "82a9...1100",
      parentHash: "#1f4a980",
    },
    tags: ["Crowd Safety", "Emergency", "Traffic Flow"],
    metadata: {
      location: "Sector 3 Western Gate",
      sector: "Zone C Entry",
      signaturesVerified: 1,
      signaturesRequired: 1,
    },
  },
  {
    id: "gt-commit-005",
    commitHash: "#1f4a980",
    fullSha256: "1f4a9808f3a5b2c149e7d082f1b62a98c4e09f598e01d372b4c581a90f2a74b6",
    parentHash: "#3d8e57b",
    timestamp: "2026-10-29T11:20:00Z",
    eventType: "task_completed",
    title: "Water & Hydration Distribution Unit",
    summary: "Distributed 600 sealed water canisters across Sector 2 and 4 gathering points in collaboration with local vendors.",
    details: "Hydration points maintained zero outage through mid-day peak sun. Waste recycling bins paired at each distribution cart to capture empty cans.",
    author: {
      id: "88888888-8888-4888-8888-888888888888",
      name: "Elena Rostova",
      handle: "elena-rostova",
      tier: 1,
      roleTitle: "Active Volunteer",
      avatarUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=ElenaRostova",
    },
    proof: {
      algorithm: "Ed25519-SHA512",
      signatureHex: "6e7d028f5a72b1c4e98d038f1a62c98b4e70f114f092b7a8c5e1d990f1a82b4c",
      publicKeyFingerprint: "SHA256:33dd...22aa",
      verified: true,
      blockNumber: 5,
      merkleRoot: "7d08...2f1b",
      parentHash: "#3d8e57b",
    },
    tags: ["Hydration", "Health", "Community Care"],
    metadata: {
      location: "Sector 2 & 4 Assembly Grounds",
      impactPointsAwarded: 60,
      verificationType: "Peer consensus (3 verified)",
      sector: "Hydration Post B",
    },
  },
  {
    id: "gt-commit-004",
    commitHash: "#3d8e57b",
    fullSha256: "3d8e57b149e7d082f1b62a98c4e09f598e01d372b4c581a90f2a74b6c81e0d98",
    parentHash: "#a9c332f",
    timestamp: "2026-10-29T09:45:00Z",
    eventType: "announcement",
    title: "Urgent: Safe Corridor Established via Nehru Circle",
    summary: "Coordinated volunteer marshals have marked a secure pedestrian transit corridor along Nehru Circle. First aid stations operational.",
    details: "Bypass route vetted for accessibility for strollers and elder participants. Clear signage and reflective safety flags installed along 1.2km route.",
    author: {
      id: "33333333-3333-4333-8333-333333333333",
      name: "Ananya Kamath",
      handle: "ananya-kamath",
      tier: 3,
      roleTitle: "Movement Organizer",
      avatarUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=AnanyaKamath",
    },
    proof: {
      algorithm: "Ed25519-SHA512",
      signatureHex: "b1c4e98d038f1a62c98b4e70f114f092b7a8c5e1d990f1a82b4c6e7d028f5a72",
      publicKeyFingerprint: "SHA256:99bb...44cc",
      verified: true,
      blockNumber: 4,
      merkleRoot: "c4e0...9f59",
      parentHash: "#a9c332f",
    },
    tags: ["Transit", "Safe Corridor", "Marshals"],
    metadata: {
      location: "Nehru Circle Arterial Road",
      signaturesVerified: 2,
      signaturesRequired: 2,
      sector: "Sector 1 Corridor",
    },
  },
  {
    id: "gt-commit-003",
    commitHash: "#a9c332f",
    fullSha256: "a9c332f2f1b62a98c4e09f598e01d372b4c581a90f2a74b6c81e0d98f3a5b2c1",
    parentHash: "#e4b891d",
    timestamp: "2026-10-28T15:30:00Z",
    eventType: "task_completed",
    title: "Emergency Medical Camp Setup",
    summary: "Field triage station operational at South Gate entrance with 4 certified paramedics and trauma supplies.",
    details: "All triage equipment calibrated. Emergency vehicle lane secured and reserved with local hospital ambulance service. Defibrillator and trauma packs verified.",
    author: {
      id: "44444444-4444-4444-8444-444444444444",
      name: "Devika Pai",
      handle: "devika-pai",
      tier: 2,
      roleTitle: "Senior Field Steward",
      avatarUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=DevikaPai",
    },
    proof: {
      algorithm: "Ed25519-SHA512",
      signatureHex: "f114f092b7a8c5e1d990f1a82b4c6e7d028f5a72b1c4e98d038f1a62c98b4e70",
      publicKeyFingerprint: "SHA256:19e0...77ab",
      verified: true,
      blockNumber: 3,
      merkleRoot: "b4c5...81a9",
      parentHash: "#e4b891d",
    },
    tags: ["Medical", "Field Care", "Triage"],
    metadata: {
      location: "South Gate Plaza Entrance",
      impactPointsAwarded: 150,
      verificationType: "Organizer override (Verified by Janardhan)",
      sector: "Sector 2 Medical Camp",
    },
  },
  {
    id: "gt-commit-002",
    commitHash: "#e4b891d",
    fullSha256: "e4b891dc4e09f598e01d372b4c581a90f2a74b6c81e0d98f3a5b2c149e7d082f",
    parentHash: "#c7f91a2",
    timestamp: "2026-10-28T14:15:00Z",
    eventType: "emergency_alert",
    title: "Severe Weather Warning Advisory",
    summary: "Regional meteorological alert issued for coastal zones between 14:00 and 18:00. Field stewards must verify all temporary shade structures are secured.",
    details: "Gust winds of 45 km/h recorded along coastline. Shade canopies anchored with sandbags and tent pegs. Emergency indoor assembly space reserved at Town Hall.",
    author: {
      id: "22222222-2222-4222-8222-222222222222",
      name: "Rohan Shetty",
      handle: "rohan-shetty",
      tier: 3,
      roleTitle: "Movement Organizer",
      avatarUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=RohanShetty",
    },
    proof: {
      algorithm: "Ed25519-SHA512",
      signatureHex: "b7a8c5e1d990f1a82b4c6e7d028f5a72b1c4e98d038f1a62c98b4e70f114f092",
      publicKeyFingerprint: "SHA256:55cc...99ef",
      verified: true,
      blockNumber: 2,
      merkleRoot: "01d3...72b4",
      parentHash: "#c7f91a2",
    },
    tags: ["Weather", "Safety Advisory", "Coastal Alert"],
    metadata: {
      location: "Coastal Belt & Gathering Zone",
      signaturesVerified: 1,
      signaturesRequired: 1,
      sector: "Coastal Front",
    },
  },
  {
    id: "gt-commit-001",
    commitHash: "#c7f91a2",
    fullSha256: "c7f91a2e01d372b4c581a90f2a74b6c81e0d98f3a5b2c149e7d082f1b62a98c4",
    parentHash: "#0000000",
    timestamp: "2026-10-28T12:00:00Z",
    eventType: "announcement",
    title: "Assembly Point Relocation Notice",
    summary: "Central assembly location moved to Town Hall premises due to space requirements. Medical & hydration tents positioned.",
    details: "Relocation coordinates shared with municipal safety officers and civic legal observers. Genesis consensus block recorded on ledger.",
    author: {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Janardhan",
      handle: "janardhan",
      tier: 3,
      roleTitle: "Movement Organizer",
      avatarUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=Janardhan",
    },
    proof: {
      algorithm: "Ed25519-SHA512",
      signatureHex: "a82b4c6e7d028f5a72b1c4e98d038f1a62c98b4e70f114f092b7a8c5e1d990f1",
      publicKeyFingerprint: "SHA256:4a8b...19e0",
      verified: true,
      blockNumber: 1,
      merkleRoot: "genesis_root_001",
      parentHash: "#0000000",
    },
    tags: ["Genesis", "Assembly", "Relocation"],
    metadata: {
      location: "Town Hall, Mangalore",
      signaturesVerified: 2,
      signaturesRequired: 2,
      sector: "Main Assembly Area",
    },
  },
]
