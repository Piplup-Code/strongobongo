// components/routines/RoutineButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Database } from '@/types/database'
import { deleteRoutine } from '@/lib/supabase/queries'
import { toast } from '@/lib/utils/toast'
import { ChevronRight } from 'lucide-react'

type Routine = Database['public']['Tables']['routines']['Row']

interface RoutineButtonProps {
  routine: Routine
  index?: number
  onDelete?: () => void
}

export function RoutineButton({ routine, index = 0, onDelete }: RoutineButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleTap = () => {
    router.push(`/workout/${routine.id}`)
  }

  const handleEdit = () => {
    router.push(`/routines/${routine.id}/edit`)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteRoutine(routine.id)
      toast.success('Routine deleted')
      setShowDeleteDialog(false)
      onDelete?.()
    } catch (error) {
      console.error('Error deleting routine:', error)
      toast.error('Failed to delete routine')
    } finally {
      setIsDeleting(false)
    }
  }

  const displayNumber = String(index + 1).padStart(2, '0')

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button
            onClick={handleTap}
            className="group w-full text-left relative overflow-hidden bg-card border-2 border-foreground/20 hover:border-primary transition-all duration-200 active:scale-[0.98]"
          >
            {/* Yellow accent bar on left */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/60 group-hover:bg-primary group-hover:w-1.5 transition-all duration-200" />

            {/* Content */}
            <div className="flex items-center pl-5 pr-4 py-5">
              {/* Large number */}
              <div className="text-6xl md:text-7xl font-display text-foreground/10 group-hover:text-primary/30 transition-colors duration-200 mr-4 leading-none select-none">
                {displayNumber}
              </div>

              {/* Routine name */}
              <div className="flex-1 min-w-0">
                <span className="text-2xl md:text-3xl font-display tracking-tight block truncate group-hover:text-primary transition-colors duration-200">
                  {routine.name}
                </span>
              </div>

              {/* Arrow indicator */}
              <ChevronRight className="h-6 w-6 text-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
            </div>

            {/* Diagonal cut decoration */}
            <div className="absolute right-0 top-0 w-16 h-full overflow-hidden pointer-events-none">
              <div className="absolute -right-8 top-0 w-16 h-full bg-foreground/5 transform skew-x-[-12deg] group-hover:bg-primary/10 transition-colors duration-200" />
            </div>
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleEdit}>
            Edit
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Routine</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{routine.name}&quot;? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
