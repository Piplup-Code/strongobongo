'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu'
import { Database } from '@/types/database'
import { deleteRoutine } from '@/lib/supabase/queries'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/utils/toast'

type Routine = Database['public']['Tables']['routines']['Row']

interface RoutineCardProps {
  routine: Routine
  onDelete?: () => void
}

export function RoutineCard({ routine, onDelete }: RoutineCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteRoutine(routine.id)
      toast.success('Routine deleted successfully')
      setIsDialogOpen(false)
      if (onDelete) {
        onDelete()
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error('Error deleting routine:', error)
      toast.error('Failed to delete routine. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="relative group hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.3)] transition-all duration-200">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <CardTitle className="text-3xl md:text-4xl leading-tight">{routine.name}</CardTitle>
        <DropdownMenu>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => {
                router.push(`/routines/${routine.id}/edit`)
              }}
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                setIsDialogOpen(true)
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="border-2 border-foreground/20">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl uppercase">Delete Routine</DialogTitle>
              <DialogDescription className="text-base font-body">
                Are you sure you want to delete &quot;{routine.name}&quot;? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
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
      </CardHeader>
      <CardContent>
        <Button asChild size="lg" className="w-full">
          <Link href={`/workout/${routine.id}`}>Start Workout</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
