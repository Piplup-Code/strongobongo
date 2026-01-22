'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Database } from '@/types/database'
import { deleteRoutine } from '@/lib/supabase/queries'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/utils/toast'
import { formatDate } from '@/lib/utils/date'

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
    <Card>
      <CardHeader>
        <CardTitle>{routine.name}</CardTitle>
        <CardDescription>Created {formatDate(routine.created_at)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="flex-1">
            <Link href={`/workout/${routine.id}`}>Start Workout</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/routines/${routine.id}/edit`}>Edit</Link>
          </Button>
        </div>
      </CardContent>
      <CardFooter>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm" className="w-full">
              Delete
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Routine</DialogTitle>
              <DialogDescription>
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
      </CardFooter>
    </Card>
  )
}
