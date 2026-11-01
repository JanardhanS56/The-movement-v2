"use client"

import * as React from "react"
import {
  X,
  Bookmark,
  Calendar,
  Share2,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Upload,
  RotateCcw,
  Ban,
  Check,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"
import { Task, TaskClaim } from "@/lib/schemas/task.schema"
import { PeerVerification } from "@/lib/schemas/verification.schema"
import { User } from "@/lib/schemas/user.schema"
import { TASK_META_MAP } from "@/lib/mocks/fictional-data"
import { downloadTaskIcs } from "@/lib/calendar"
import { reencodeImage } from "@/lib/image-utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { formatCleanDateTime } from "@/lib/date"
import { cn } from "@/lib/utils"

export interface TaskDetailDrawerProps {
  taskId: string | null
  isOpen: boolean
  onClose: () => void
  task?: Task
  claim?: TaskClaim
  verifications?: PeerVerification[]
  usersMap: Record<string, User>
  currentUser?: User | null
  isSaved: boolean
  onToggleSave: (taskId: string) => void
  onClaim: (taskId: string) => Promise<void>
  onWithdraw: (claimId: string) => Promise<void>
  onMarkComplete: (claimId: string, note?: string, proofUrl?: string) => Promise<void>
  onPeerVote: (claimId: string, vote: "approve" | "reject", reason?: string) => Promise<void>
  onOrganizerOverride: (claimId: string, approve: boolean, note?: string) => Promise<void>
  onCancelTask: (taskId: string) => Promise<void>
  isLoading?: boolean
  isActionPending?: boolean
}

export function TaskDetailDrawer({
  taskId,
  isOpen,
  onClose,
  task,
  claim,
  verifications = [],
  usersMap,
  currentUser,
  isSaved,
  onToggleSave,
  onClaim,
  onWithdraw,
  onMarkComplete,
  onPeerVote,
  onOrganizerOverride,
  onCancelTask,
  isLoading,
  isActionPending,
}: TaskDetailDrawerProps) {
  // Local states for completion form & confirmations
  const [completeFormOpen, setCompleteFormOpen] = React.useState(false)
  const [completionNote, setCompletionNote] = React.useState("")
  const [completionPhotoUrl, setCompletionPhotoUrl] = React.useState<string | null>(null)
  const [photoProcessing, setPhotoProcessing] = React.useState(false)

  // Confirmation dialog states
  const [confirmCancelOpen, setConfirmCancelOpen] = React.useState(false)
  const [confirmWithdrawOpen, setConfirmWithdrawOpen] = React.useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false)
  const [rejectReason, setRejectReason] = React.useState("")

  // Handle escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (confirmCancelOpen) setConfirmCancelOpen(false)
        else if (confirmWithdrawOpen) setConfirmWithdrawOpen(false)
        else if (rejectDialogOpen) setRejectDialogOpen(false)
        else if (completeFormOpen) setCompleteFormOpen(false)
        else onClose()
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose, confirmCancelOpen, confirmWithdrawOpen, rejectDialogOpen, completeFormOpen])

  // Reset form when task changes
  React.useEffect(() => {
    setCompleteFormOpen(false)
    setCompletionNote("")
    setCompletionPhotoUrl(null)
    setConfirmCancelOpen(false)
    setConfirmWithdrawOpen(false)
    setRejectDialogOpen(false)
    setRejectReason("")
  }, [taskId])

  if (!isOpen) return null

  const meta = task ? TASK_META_MAP[task.id] : undefined
  const creator = task ? usersMap[task.created_by] : undefined
  const claimant = claim ? usersMap[claim.claimed_by] : undefined

  // User relationship to this task
  const isCreator = currentUser && task ? task.created_by === currentUser.id : false
  const isClaimant = currentUser && claim ? claim.claimed_by === currentUser.id : false
  const isTier3 = currentUser?.tier === 3
  const isAssignedVerifier = currentUser
    ? verifications.some((v) => v.verifier_id === currentUser.id)
    : false
  const canVerify = Boolean(
    currentUser &&
      !isClaimant &&
      (isAssignedVerifier || isTier3 || (currentUser.tier && currentUser.tier >= 2))
  )
  const myVote = currentUser
    ? verifications.find((v) => v.verifier_id === currentUser.id)?.vote
    : null

  // Verification calculations
  const approvalsCount = verifications.filter((v) => v.vote === "approve").length
  const totalVerificationsAssigned = verifications.length || 3

  // Photo upload handler with client-side canvas re-encoding (strips EXIF / GPS)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Please upload a valid JPEG, PNG, or WebP photo.")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo exceeds 5 MB size limit.")
      return
    }

    try {
      setPhotoProcessing(true)
      const cleanDataUrl = await reencodeImage(file, { maxWidth: 1024, maxHeight: 1024 })
      setCompletionPhotoUrl(cleanDataUrl)
      toast.success("Photo attached (EXIF & location metadata stripped).")
    } catch {
      toast.error("Could not process photo. You may continue without it.")
    } finally {
      setPhotoProcessing(false)
    }
  }

  // Handle share task URL
  const handleShareTask = async () => {
    if (!task) return
    const url = `${window.location.origin}${window.location.pathname}?task=${task.id}`
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        toast.success("Task link copied to clipboard.")
      } else {
        toast.info(url)
      }
    } catch {
      toast.error("Failed to copy link.")
    }
  }

  // Handle download calendar ICS
  const handleDownloadCalendar = () => {
    if (!task) return
    try {
      downloadTaskIcs(task, meta)
      toast.success("Calendar event (.ics) downloaded.")
    } catch {
      toast.error("Failed to generate calendar event.")
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-drawer-title"
      className="fixed inset-0 z-50 flex justify-end"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-ink/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Drawer Panel: Fullscreen on mobile, right 500px panel on desktop */}
      <div className="relative z-10 w-full md:max-w-xl h-full bg-white border-l-2 border-ink shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Drawer Header Row */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b-2 border-ink bg-ivory/50 shrink-0">
          <div className="flex items-center gap-2">
            {meta?.category && (
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs bg-white text-ink border border-ink/20">
                {meta.category}
              </span>
            )}
            {task && (
              <span
                className={cn(
                  "text-[11px] font-black uppercase px-2 py-0.5 rounded-xs border",
                  task.status === "open" && "bg-cobalt text-white border-cobalt",
                  task.status === "in_progress" && "bg-sun text-ink border-ink",
                  task.status === "pending_verification" && "bg-lavender text-ink border-ink",
                  task.status === "completed" && "bg-lime text-ink border-ink",
                  task.status === "cancelled" && "bg-tomato text-white border-tomato"
                )}
              >
                {task.status.replace("_", " ")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {task && (
              <>
                <button
                  type="button"
                  aria-label={isSaved ? "Remove from saved" : "Save task"}
                  onClick={() => onToggleSave(task.id)}
                  className="p-2 text-ink/70 hover:text-ink hover:bg-white rounded-sm border border-transparent hover:border-ink/20 transition-all"
                >
                  <Bookmark
                    className={cn(
                      "w-4 h-4",
                      isSaved ? "fill-sun text-sun" : "text-ink/60"
                    )}
                  />
                </button>
                <button
                  type="button"
                  aria-label="Add to calendar"
                  onClick={handleDownloadCalendar}
                  className="p-2 text-ink/70 hover:text-ink hover:bg-white rounded-sm border border-transparent hover:border-ink/20 transition-all"
                >
                  <Calendar className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Share task"
                  onClick={handleShareTask}
                  className="p-2 text-ink/70 hover:text-ink hover:bg-white rounded-sm border border-transparent hover:border-ink/20 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              type="button"
              aria-label="Close drawer"
              onClick={onClose}
              className="p-2 text-ink/70 hover:text-ink hover:bg-white rounded-sm border border-transparent hover:border-ink/20 transition-all ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {isLoading && (
            <div className="space-y-4 animate-pulse">
              <div className="h-6 bg-ink/10 rounded-sm w-3/4" />
              <div className="h-4 bg-ink/10 rounded-sm w-1/2" />
              <div className="h-24 bg-ink/10 rounded-sm w-full" />
            </div>
          )}

          {!isLoading && !task && (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-ivory border-2 border-ink flex items-center justify-center mx-auto text-ink/50">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="font-sans font-bold text-base text-ink">Task not found</h4>
              <p className="text-xs text-ink/60 max-w-xs mx-auto">
                This volunteer action could not be found or has been archived.
              </p>
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                size="sm"
                className="border-2 border-ink"
              >
                Return to tasks
              </Button>
            </div>
          )}

          {!isLoading && task && (
            <>
              {/* Title & Reward points */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <h2
                    id="task-drawer-title"
                    className="font-sans font-black text-xl sm:text-2xl text-ink leading-tight"
                  >
                    {task.title}
                  </h2>
                  <span className="shrink-0 font-black text-sm tabular-nums text-ink px-2.5 py-1 rounded-sm bg-lime border-2 border-ink shadow-hard-xs">
                    +{task.reward_points} pts
                  </span>
                </div>
                <p className="text-xs text-ink/50">
                  Posted {formatCleanDateTime(task.created_at)}
                </p>
              </div>

              {/* Creator Card */}
              {creator && (
                <div className="flex items-center justify-between p-3 rounded-chunky border-2 border-ink bg-ivory/40">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="w-10 h-10 border-2 border-ink shrink-0">
                      {creator.avatar_url && (
                        <AvatarImage src={creator.avatar_url} alt={creator.display_name} />
                      )}
                      <AvatarFallback className="bg-sun text-ink font-bold text-xs">
                        {creator.display_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-ink truncate">
                          {creator.display_name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-xs bg-ink/10 text-ink/80">
                          Tier {creator.tier}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink/60 truncate">
                        {creator.handle ? `@${creator.handle}` : "Organizer"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-ink/60 shrink-0">Organizer</span>
                </div>
              )}

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-chunky border border-ink/20 bg-card space-y-1">
                  <div className="flex items-center gap-1.5 text-ink/50 text-[11px] font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Estimated time</span>
                  </div>
                  <p className="font-bold text-xs text-ink">
                    {meta?.estimatedMinutes ? `${meta.estimatedMinutes} minutes` : "Flexible"}
                  </p>
                </div>

                <div className="p-3 rounded-chunky border border-ink/20 bg-card space-y-1">
                  <div className="flex items-center gap-1.5 text-ink/50 text-[11px] font-bold">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Location</span>
                  </div>
                  <p className="font-bold text-xs text-ink truncate">
                    {meta?.locationLabel || "Field Action Area"}
                  </p>
                </div>

                <div className="p-3 rounded-chunky border border-ink/20 bg-card space-y-1 col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-1.5 text-ink/50 text-[11px] font-bold">
                    <Users className="w-3.5 h-3.5" />
                    <span>Volunteer slots</span>
                  </div>
                  <p className="font-bold text-xs text-ink">
                    {claim ? "1" : "0"} of {task.required_volunteers} filled
                  </p>
                </div>
              </div>

              {/* Claimant slot display */}
              {claim && claimant && (
                <div className="p-3.5 rounded-chunky border-2 border-ink bg-white space-y-2">
                  <span className="text-[11px] font-black uppercase text-ink/60 tracking-wider">
                    Assigned Volunteer
                  </span>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="w-8 h-8 border border-ink">
                        {claimant.avatar_url && (
                          <AvatarImage src={claimant.avatar_url} alt={claimant.display_name} />
                        )}
                        <AvatarFallback className="bg-lime text-ink font-bold text-xs">
                          {claimant.display_name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-bold text-ink">{claimant.display_name}</p>
                        <p className="text-[10px] text-ink/60">
                          {claimant.handle ? `@${claimant.handle}` : "Volunteer"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-xs border",
                        claim.status === "in_progress" && "bg-sun/20 text-ink border-ink/30",
                        claim.status === "pending_verification" &&
                          "bg-lavender/30 text-ink border-ink/30",
                        claim.status === "verified" && "bg-lime/30 text-ink border-ink/30"
                      )}
                    >
                      {claim.status.replace("_", " ")}
                    </span>
                  </div>

                  {claim.note && (
                    <div className="mt-2 text-xs text-ink/80 bg-ivory/60 p-2 rounded-xs border border-ink/10 italic">
                      &quot;{claim.note}&quot;
                    </div>
                  )}

                  {claim.proof_url && (
                    <div className="mt-2">
                      <p className="text-[10px] font-bold text-ink/60 mb-1">Attached field photo:</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={claim.proof_url}
                        alt="Task completion evidence"
                        className="w-full max-h-48 object-cover rounded-sm border border-ink"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Full Description */}
              <div className="space-y-2 pt-2">
                <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-ink/60">
                  Description & Instructions
                </h3>
                <div className="text-sm text-ink/85 leading-relaxed whitespace-pre-line bg-card p-4 rounded-chunky border border-ink/15">
                  {task.description || "No specific instructions provided for this action."}
                </div>
              </div>

              {/* Skills Tags */}
              {task.required_skills && task.required_skills.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-ink/60">
                    Helpful Skills
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {task.required_skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-xs font-semibold px-2.5 py-1 rounded-sm bg-ivory text-ink border border-ink/20"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Verification Progress Box */}
              {(task.status === "pending_verification" || task.status === "completed") && (
                <div className="p-4 rounded-chunky border-2 border-ink bg-lavender/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-cobalt" />
                      <h4 className="font-bold text-xs text-ink">Peer verification</h4>
                    </div>
                    <span className="text-xs font-black tabular-nums text-ink">
                      {approvalsCount} of {totalVerificationsAssigned} checked
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-white border border-ink overflow-hidden flex">
                    <div
                      className="bg-lime h-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          (approvalsCount / totalVerificationsAssigned) * 100
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="text-[11px] text-ink/70">
                    {task.status === "completed"
                      ? "Task verified and reward points awarded to volunteer."
                      : "Awaiting consensus review from assigned movement peers."}
                  </p>
                </div>
              )}

              {/* Expandable "Mark as complete" form */}
              {completeFormOpen && claim && (
                <div className="p-4 rounded-chunky border-2 border-cobalt bg-white space-y-4 shadow-hard-xs animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-ink/10 pb-2">
                    <h4 className="font-bold text-xs text-ink">Submit completion report</h4>
                    <button
                      type="button"
                      onClick={() => setCompleteFormOpen(false)}
                      className="text-ink/50 hover:text-ink"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-ink">
                      Volunteer note (optional)
                    </label>
                    <Textarea
                      value={completionNote}
                      onChange={(e) => setCompletionNote(e.target.value)}
                      placeholder="Brief summary of how the action went..."
                      rows={3}
                      className="border-2 border-ink text-xs focus:ring-cobalt"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-ink">
                      Field photo proof (optional)
                    </label>
                    <div className="text-[11px] text-ink/60 mb-1">
                      Canvas re-encoding strips all EXIF, camera, and GPS metadata.
                    </div>

                    <input
                      type="file"
                      id="drawer-photo-input"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="drawer-photo-input"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border-2 border-ink text-xs font-bold bg-ivory hover:bg-white cursor-pointer shadow-hard-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{photoProcessing ? "Processing..." : "Choose photo"}</span>
                    </label>

                    {completionPhotoUrl && (
                      <div className="mt-2 relative inline-block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={completionPhotoUrl}
                          alt="Preview"
                          className="w-32 h-24 object-cover rounded-sm border-2 border-ink"
                        />
                        <button
                          type="button"
                          onClick={() => setCompletionPhotoUrl(null)}
                          className="absolute -top-1.5 -right-1.5 p-0.5 bg-tomato text-white rounded-full border border-ink"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCompleteFormOpen(false)}
                      className="border-2 border-ink text-xs font-bold"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isActionPending || photoProcessing}
                      onClick={async () => {
                        await onMarkComplete(
                          claim.id,
                          completionNote || undefined,
                          completionPhotoUrl || undefined
                        )
                        setCompleteFormOpen(false)
                      }}
                      className="bg-lime text-ink hover:bg-lime/90 border-2 border-ink text-xs font-black shadow-hard-xs gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Submit for verification</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Confirmation Prompts */}
              {confirmCancelOpen && (
                <div className="p-4 rounded-chunky border-2 border-tomato bg-tomato/10 space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-tomato font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Confirm task cancellation</span>
                  </div>
                  <p className="text-xs text-ink/80">
                    Are you sure you want to cancel this task? It will be marked cancelled and closed to all volunteers.
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmCancelOpen(false)}
                      className="border-2 border-ink text-xs"
                    >
                      Keep task
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={async () => {
                        await onCancelTask(task.id)
                        setConfirmCancelOpen(false)
                      }}
                      className="bg-tomato text-white hover:bg-tomato/90 border-2 border-ink text-xs font-bold"
                    >
                      Confirm cancel
                    </Button>
                  </div>
                </div>
              )}

              {confirmWithdrawOpen && claim && (
                <div className="p-4 rounded-chunky border-2 border-ink bg-ivory space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-xs text-ink">
                    <RotateCcw className="w-4 h-4 text-sun" />
                    <span>Confirm claim withdrawal</span>
                  </div>
                  <p className="text-xs text-ink/80">
                    Withdraw from this task? Your spot will be returned to the open volunteer pool.
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmWithdrawOpen(false)}
                      className="border-2 border-ink text-xs"
                    >
                      Stay assigned
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={async () => {
                        await onWithdraw(claim.id)
                        setConfirmWithdrawOpen(false)
                      }}
                      className="bg-ink text-white hover:bg-ink/90 border-2 border-ink text-xs font-bold"
                    >
                      Confirm withdrawal
                    </Button>
                  </div>
                </div>
              )}

              {rejectDialogOpen && claim && (
                <div className="p-4 rounded-chunky border-2 border-tomato bg-white space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-tomato font-bold text-xs">
                    <Ban className="w-4 h-4" />
                    <span>Reject completion with reason</span>
                  </div>
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Provide constructive feedback for the volunteer..."
                    rows={2}
                    className="border-2 border-ink text-xs"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setRejectDialogOpen(false)}
                      className="border-2 border-ink text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!rejectReason.trim()}
                      onClick={async () => {
                        await onPeerVote(claim.id, "reject", rejectReason)
                        setRejectDialogOpen(false)
                      }}
                      className="bg-tomato text-white hover:bg-tomato/90 border-2 border-ink text-xs font-bold"
                    >
                      Confirm rejection
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Drawer Footer Actions */}
        {task && (
          <div className="p-4 sm:p-5 border-t-2 border-ink bg-ivory/60 shrink-0 space-y-3">
            <div className="flex flex-wrap items-center justify-end gap-2">
              {/* State 1: Open task - Claim action */}
              {task.status === "open" && !isClaimant && (
                <>
                  {isCreator ? (
                    <p className="text-xs font-bold text-ink/60 italic">
                      You created this task. Organizers cannot claim their own tasks.
                    </p>
                  ) : (
                    <Button
                      type="button"
                      disabled={isActionPending}
                      onClick={() => onClaim(task.id)}
                      className="w-full sm:w-auto bg-cobalt hover:bg-cobalt/90 text-white border-2 border-ink font-black text-xs shadow-hard-xs h-10 px-5 gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Claim task</span>
                    </Button>
                  )}
                </>
              )}

              {/* State 2: User has claimed task and it is in_progress */}
              {isClaimant && claim?.status === "in_progress" && !completeFormOpen && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isActionPending}
                    onClick={() => setConfirmWithdrawOpen(true)}
                    className="border-2 border-ink text-xs font-bold hover:bg-white text-ink/80 h-9"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    <span>Withdraw</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    disabled={isActionPending}
                    onClick={() => setCompleteFormOpen(true)}
                    className="bg-lime text-ink hover:bg-lime/90 border-2 border-ink font-black text-xs shadow-hard-xs h-9 px-4 gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark as done</span>
                  </Button>
                </>
              )}

              {/* State 3: Peer verification actions */}
              {task.status === "pending_verification" && claim && (
                <>
                  {isClaimant ? (
                    <p className="text-xs text-ink/70 font-semibold italic">
                      Submitted for peer verification. You cannot verify your own task.
                    </p>
                  ) : myVote ? (
                    <p className="text-xs text-ink/70 font-bold">
                      You voted to {myVote} this completion.
                    </p>
                  ) : canVerify ? (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isActionPending}
                        onClick={() => setRejectDialogOpen(true)}
                        className="bg-white hover:bg-tomato/10 text-tomato border-2 border-tomato font-bold text-xs h-9 px-3"
                      >
                        Reject
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={isActionPending}
                        onClick={() => onPeerVote(claim.id, "approve")}
                        className="bg-lime text-ink hover:bg-lime/90 border-2 border-ink font-black text-xs shadow-hard-xs h-9 px-4"
                      >
                        Approve
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-ink/70 bg-ivory px-3 py-1.5 rounded-sm border border-ink">
                      Peer review in progress
                    </span>
                  )}
                </>
              )}

              {/* State 4: Tier 3 Organizer overrides */}
              {isTier3 && task.status !== "completed" && task.status !== "cancelled" && (
                <div className="w-full flex items-center justify-between pt-2 border-t border-ink/10">
                  <span className="text-[10px] font-black uppercase text-ink/50 tracking-wider">
                    Tier 3 Controls
                  </span>
                  <div className="flex items-center gap-2">
                    {claim && task.status === "pending_verification" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isActionPending}
                        onClick={() => onOrganizerOverride(claim.id, true)}
                        className="border-2 border-ink bg-sun text-ink text-[11px] font-bold h-7 px-2.5"
                      >
                        Verify as organizer
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isActionPending}
                      onClick={() => setConfirmCancelOpen(true)}
                      className="border-2 border-tomato text-tomato hover:bg-tomato/10 text-[11px] font-bold h-7 px-2.5"
                    >
                      Cancel task
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
