"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Minus, ListPlus } from "lucide-react"
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

const formSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters.")
    .max(120, "Title cannot exceed 120 characters."),
  description: z.string().max(2000, "Description cannot exceed 2000 characters.").optional(),
  reward_points: z
    .number()
    .int()
    .min(0, "Reward points must be at least 0.")
    .max(10000, "Reward points cannot exceed 10,000."),
  required_volunteers: z
    .number()
    .int()
    .min(1, "At least 1 volunteer is required.")
    .max(100, "Cannot require more than 100 volunteers."),
})

export type PostTaskFormData = z.infer<typeof formSchema>

export interface PostTaskDialogProps {
  movementId: string
  onSubmit: (data: PostTaskFormData) => Promise<void> | void
  isPending: boolean
  trigger?: React.ReactNode
}

export function PostTaskDialog({
  movementId,
  onSubmit,
  isPending,
  trigger,
}: PostTaskDialogProps) {
  void movementId
  const [open, setOpen] = React.useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<PostTaskFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      reward_points: 50,
      required_volunteers: 1,
    },
  })

  const handleFormSubmit = async (data: PostTaskFormData) => {
    try {
      await onSubmit(data)
      reset()
      setOpen(false)
    } catch {
      // Error handled by parent toast
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
              <ListPlus className="w-4 h-4" aria-hidden="true" />
              <span>Post Task</span>
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Post New Movement Task</DialogTitle>
          <DialogDescription>
            Create an operational task for volunteers to claim and complete for points.
          </DialogDescription>
        </DialogHeader>

        <form
          id="post-task-form"
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4 py-2"
        >
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              placeholder="e.g. Clean drinking water distribution setup"
              disabled={isPending}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "task-title-error" : undefined}
              {...register("title")}
            />
            {errors.title && (
              <p id="task-title-error" className="text-xs text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="task-description">Description (Optional)</Label>
            <Textarea
              id="task-description"
              placeholder="Outline specific steps, location coordinates, or safety precautions..."
              className="min-h-[100px]"
              disabled={isPending}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? "task-desc-error" : undefined}
              {...register("description")}
            />
            {errors.description && (
              <p id="task-desc-error" className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Reward Points and Volunteers Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Reward Points */}
            <div className="space-y-1.5">
              <Label htmlFor="task-points">Reward Points</Label>
              <Input
                id="task-points"
                type="number"
                min={0}
                max={10000}
                disabled={isPending}
                aria-invalid={Boolean(errors.reward_points)}
                aria-describedby={errors.reward_points ? "task-points-error" : undefined}
                {...register("reward_points", { valueAsNumber: true })}
              />
              {errors.reward_points && (
                <p id="task-points-error" className="text-xs text-destructive">
                  {errors.reward_points.message}
                </p>
              )}
            </div>

            {/* Required Volunteers Stepper */}
            <div className="space-y-1.5">
              <Label htmlFor="task-volunteers-stepper">Volunteers Needed</Label>
              <Controller
                control={control}
                name="required_volunteers"
                render={({ field }) => (
                  <div className="flex items-center gap-2 pt-0.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      disabled={field.value <= 1 || isPending}
                      aria-label="Decrease required volunteers"
                      onClick={() => field.onChange(Math.max(1, field.value - 1))}
                    >
                      <Minus className="w-4 h-4" aria-hidden="true" />
                    </Button>

                    <div
                      id="task-volunteers-stepper"
                      className="w-12 h-8 flex items-center justify-center tabular-nums font-bold text-sm rounded-md border border-input bg-card text-foreground"
                      aria-live="polite"
                    >
                      {field.value}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      disabled={field.value >= 100 || isPending}
                      aria-label="Increase required volunteers"
                      onClick={() => field.onChange(Math.min(100, field.value + 1))}
                    >
                      <Plus className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  </div>
                )}
              />
              {errors.required_volunteers && (
                <p className="text-xs text-destructive">
                  {errors.required_volunteers.message}
                </p>
              )}
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
            form="post-task-form"
            loading={isPending}
            disabled={isPending}
          >
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
