"use client"

import * as React from "react"
import { Movement } from "@/lib/schemas/movement.schema"
import { FICTIONAL_MOVEMENTS, getActiveMovementId, setActiveMovementId } from "@/lib/mocks/fictional-data"
import { toast } from "sonner"
import { Check, ChevronsUpDown, Shield } from "lucide-react"

export interface MovementSwitcherProps {
  collapsed?: boolean
}

export function MovementSwitcher({ collapsed = false }: MovementSwitcherProps) {
  const [activeId, setActiveIdState] = React.useState<string>(FICTIONAL_MOVEMENTS[0].id)
  const [movements, setMovements] = React.useState<Movement[]>(FICTIONAL_MOVEMENTS)
  const [open, setOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setActiveIdState(getActiveMovementId())
    setMovements([...FICTIONAL_MOVEMENTS])

    const handleMovementChange = () => {
      setActiveIdState(getActiveMovementId())
      setMovements([...FICTIONAL_MOVEMENTS])
    }

    window.addEventListener("the-movement:movement-changed", handleMovementChange)
    window.addEventListener("the-movement:movement-added", handleMovementChange)
    return () => {
      window.removeEventListener("the-movement:movement-changed", handleMovementChange)
      window.removeEventListener("the-movement:movement-added", handleMovementChange)
    }
  }, [])

  // Close on outside click or Esc
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      window.addEventListener("keydown", handleKeyDown)
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  const activeMovement =
    movements.find((m) => m.id === activeId) || movements[0] || FICTIONAL_MOVEMENTS[0]

  const handleSelect = (id: string) => {
    setActiveMovementId(id)
    setActiveIdState(id)
    setOpen(false)
    const target = movements.find((m) => m.id === id)
    if (target) {
      toast.success(`Switched movement to ${target.name}`)
    }
  }

  if (collapsed) {
    return (
      <div className="relative flex justify-center py-2 border-b border-ink/20">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={`Current movement: ${activeMovement.name}. Click to switch.`}
          className="w-10 h-10 rounded-sm bg-lime/20 border-2 border-ink flex items-center justify-center text-ink hover:bg-lime/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
        >
          <Shield className="w-5 h-5 text-ink" />
        </button>

        {open && (
          <div
            ref={menuRef}
            role="menu"
            className="absolute left-14 top-2 z-50 w-64 rounded-chunky border-2 border-ink bg-white p-2 shadow-hard-md space-y-1"
          >
            <p className="text-[10px] uppercase font-black tracking-wider text-ink/60 px-2 py-1">
              Switch movement
            </p>
            {movements.map((mov) => {
              const isSelected = mov.id === activeId
              return (
                <button
                  key={mov.id}
                  type="button"
                  role="menuitem"
                  onClick={() => handleSelect(mov.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-sm text-xs flex items-center justify-between border-2 transition-all ${
                    isSelected
                      ? "bg-lime border-ink font-bold text-ink shadow-hard-xs"
                      : "border-transparent hover:bg-ivory text-ink"
                  }`}
                >
                  <span className="truncate">{mov.name}</span>
                  {isSelected && <Check className="w-4 h-4 shrink-0 stroke-[3]" />}
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={menuRef} className="relative px-3 py-2 border-b-2 border-ink/10">
      <p className="text-[10px] uppercase font-black tracking-wider text-ink/60 px-1 mb-1">
        Movement
      </p>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Movement switcher: currently ${activeMovement.name}`}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-sm bg-white border-2 border-ink text-left shadow-hard-xs hover:bg-ivory transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-xs bg-lime border border-ink flex items-center justify-center shrink-0">
            <Shield className="w-3.5 h-3.5 text-ink" />
          </div>
          <span className="text-xs font-black text-ink truncate font-sans">
            {activeMovement.name}
          </span>
        </div>
        <ChevronsUpDown className="w-4 h-4 text-ink/60 shrink-0" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Select movement"
          className="absolute left-3 right-3 top-full mt-1.5 z-50 rounded-chunky border-2 border-ink bg-white p-1.5 shadow-hard-md space-y-1"
        >
          {movements.map((mov) => {
            const isSelected = mov.id === activeId
            return (
              <button
                key={mov.id}
                type="button"
                role="menuitem"
                onClick={() => handleSelect(mov.id)}
                className={`w-full text-left px-2.5 py-2 rounded-sm text-xs flex items-center justify-between border-2 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-lime border-ink font-black text-ink shadow-hard-xs"
                    : "border-transparent hover:bg-ivory text-ink font-semibold"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate">{mov.name}</p>
                  <p className="text-[10px] text-ink/60 truncate">{mov.description}</p>
                </div>
                {isSelected && <Check className="w-4 h-4 shrink-0 stroke-[3] ml-2" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
