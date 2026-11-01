"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Minus, FilePlus2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export interface NewAnnouncementFormData {
  title: string
  body: string
  required_signatures: number
}

export interface NewAnnouncementDialogProps {
  movementId: string
  totalOrganizers: number
  onSubmit: (data: NewAnnouncementFormData) => Promise<void> | void
  isPending: boolean
  trigger?: React.ReactNode
}

export function NewAnnouncementDialog({
  movementId,
  totalOrganizers,
  onSubmit,
  isPending,
  trigger,
}: NewAnnouncementDialogProps) {
  void movementId
  const [open, setOpen] = React.useState(false)
  const maxSignatures = Math.max(1, totalOrganizers)

  const schema = React.useMemo(() => {
    return z.object({
      title: z
        .string()
        .min(5, "Title must be at least 5 characters.")
        .max(200, "Title cannot exceed 200 characters."),
      body: z
        .string()
        .min(10, "Announcement body must be at least 10 characters."),
      required_signatures: z
        .number()
        .int()
        .min(1, "At least 1 signature is required.")
        .max(
          maxSignatures,
          `Cannot require more than ${maxSignatures} signatures.`
        ),
    })
  }, [maxSignatures])

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<NewAnnouncementFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      body: "",
      required_signatures: Math.min(2, maxSignatures),
    },
  })

  const currentRequired = watch("required_signatures") || 1

  const handleFormSubmit = async (data: NewAnnouncementFormData) => {
    try {
      await onSubmit(data)
      reset()
      setOpen(false)
    } catch {
      // Error handled by caller toast
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isPending) {
      setOpen(nextOpen)
      if (!nextOpen) {
        reset()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          trigger ? (
            (trigger as React.ReactElement)
          ) : (
            <Button variant="default" className="gap-2">
              <FilePlus2 className="w-4 h-4" aria-hidden="true" />
              <span>New Announcement</span>
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Publish New Announcement</DialogTitle>
          <DialogDescription>
            Create an official movement announcement requiring multi-signature verification.
          </DialogDescription>
        </DialogHeader>

        <form
          id="new-announcement-form"
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4 py-2"
        >
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="announcement-title">Title</Label>
            <Input
              id="announcement-title"
              placeholder="e.g. Critical Logistics Route Update"
              disabled={isPending}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "title-error" : undefined}
              {...register("title")}
            />
            {errors.title && (
              <p id="title-error" className="text-xs text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <Label htmlFor="announcement-body">Body</Label>
            <Textarea
              id="announcement-body"
              placeholder="Detail the operational notice or urgent instructions clearly..."
              className="min-h-[110px]"
              disabled={isPending}
              aria-invalid={Boolean(errors.body)}
              aria-describedby={errors.body ? "body-error" : undefined}
              {...register("body")}
            />
            {errors.body && (
              <p id="body-error" className="text-xs text-destructive">
                {errors.body.message}
              </p>
            )}
          </div>

          {/* Required Signatures Stepper */}
          <div className="space-y-2">
            <Label htmlFor="announcement-signatures-stepper">
              Required Organizer Signatures
            </Label>
            <Controller
              control={control}
              name="required_signatures"
              render={({ field }) => (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      disabled={field.value <= 1 || isPending}
                      aria-label="Decrease required signatures"
                      onClick={() => field.onChange(Math.max(1, field.value - 1))}
                    >
                      <Minus className="w-4 h-4" aria-hidden="true" />
                    </Button>

                    <div
                      id="announcement-signatures-stepper"
                      className="w-16 h-8 flex items-center justify-center font-mono font-bold text-sm rounded-md border border-input bg-card text-foreground"
                      aria-live="polite"
                    >
                      {field.value}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      disabled={field.value >= maxSignatures || isPending}
                      aria-label="Increase required signatures"
                      onClick={() =>
                        field.onChange(Math.min(maxSignatures, field.value + 1))
                      }
                    >
                      <Plus className="w-4 h-4" aria-hidden="true" />
                    </Button>

                    <span className="text-xs text-muted-foreground">
                      (1 to {maxSignatures} organizers)
                    </span>
                  </div>

                  {errors.required_signatures && (
                    <p className="text-xs text-destructive">
                      {errors.required_signatures.message}
                    </p>
                  )}
                </div>
              )}
            />

            {/* Stepper Rule / Author notice */}
            <div className="p-2.5 rounded-sm bg-muted/60 border border-border/70 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">
                Author auto-signs as signature 1.
              </p>
              <p>
                {currentRequired === 1
                  ? "Since required signatures is set to 1, this announcement will publish immediately."
                  : `Requires ${currentRequired - 1} additional co-signature${
                      currentRequired - 1 > 1 ? "s" : ""
                    } from fellow organizers before publishing.`}
              </p>
            </div>
          </div>
        </form>

        <DialogFooter className="flex-row justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="new-announcement-form"
            loading={isPending}
            disabled={isPending}
          >
            {currentRequired === 1 ? "Publish Announcement" : "Submit for Co-Signing"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
