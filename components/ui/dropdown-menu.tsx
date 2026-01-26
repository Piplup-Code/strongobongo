"use client"

import * as React from "react"
import { MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface DropdownMenuProps {
  children: React.ReactNode
  trigger?: React.ReactNode
}

interface DropdownMenuContentProps {
  children: React.ReactNode
  className?: string
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  variant?: "default" | "destructive"
}

const DropdownMenuContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({
  open: false,
  setOpen: () => {},
})

export function DropdownMenu({ children, trigger }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative" ref={menuRef}>
        {trigger || (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setOpen(!open)}
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        )}
        {open && children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

export function DropdownMenuContent({
  children,
  className,
}: DropdownMenuContentProps) {
  const { open } = React.useContext(DropdownMenuContext)

  if (!open) return null

  return (
    <div
      className={cn(
        "absolute right-0 top-10 z-50 min-w-[10rem] overflow-hidden border-2 border-foreground/20 bg-popover p-2 text-popover-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)]",
        className
      )}
    >
      {children}
    </div>
  )
}

export function DropdownMenuItem({
  children,
  onClick,
  className,
  variant = "default",
}: DropdownMenuItemProps) {
  const { setOpen } = React.useContext(DropdownMenuContext)

  const handleClick = () => {
    onClick?.()
    setOpen(false)
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "relative flex w-full cursor-default select-none items-center px-3 py-2.5 text-sm font-semibold uppercase tracking-wider outline-none transition-all border-2 border-transparent hover:border-foreground/20 hover:bg-secondary focus:bg-secondary focus:border-foreground/30 active:scale-[0.98] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        variant === "destructive" &&
          "text-destructive hover:border-destructive/30 hover:bg-destructive/10 focus:bg-destructive/10 focus:border-destructive/40",
        className
      )}
    >
      {children}
    </button>
  )
}
