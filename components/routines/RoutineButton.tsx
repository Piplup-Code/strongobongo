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

type Routine = Database['public']['Tables']['routines']['Row']

interface RoutineButtonProps {
  routine: Routine
  onDelete?: () => void
}

export function RoutineButton({ routine, onDelete }: RoutineButtonProps) {
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

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button
            onClick={handleTap}
            className="w-full text-left p-6 bg-card border-2 border-foreground/20 hover:border-foreground/40 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] active:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] transition-all duration-150"
          >
            <span className="text-3xl md:text-4xl font-display tracking-tight">
              {routine.name}
            </span>
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
