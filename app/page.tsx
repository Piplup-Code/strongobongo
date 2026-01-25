'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { RoutineCard } from '@/components/routines/RoutineCard'
import { getRoutines } from '@/lib/supabase/queries'
import { getOrCreateSessionId } from '@/lib/storage'
import { Database } from '@/types/database'
import { toast } from '@/lib/utils/toast'

type Routine = Database['public']['Tables']['routines']['Row']

export default function Home() {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadRoutines() {
      try {
        setLoading(true)
        const sessionId = getOrCreateSessionId()
        const data = await getRoutines(sessionId)
        setRoutines(data)
        setError(null)
      } catch (err) {
        console.error('Error loading routines:', err)
        const errorMessage = 'Failed to load routines. Please refresh the page.'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadRoutines()
  }, [])

  const handleDelete = () => {
    // Reload routines after delete
    const sessionId = getOrCreateSessionId()
    getRoutines(sessionId)
      .then((data) => {
        setRoutines(data)
      })
      .catch((err) => {
        console.error('Error reloading routines:', err)
        toast.error('Failed to reload routines')
      })
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Routines</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your workout routines
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/history">History</Link>
          </Button>
          <Button asChild>
            <Link href="/routines/new">New Routine</Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-muted animate-pulse rounded-lg"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-destructive">
          {error}
        </div>
      ) : routines.length === 0 ? (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">💪</div>
            <h2 className="text-2xl font-semibold mb-2">No routines yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first workout routine to get started tracking your progress!
            </p>
            <Button asChild size="lg">
              <Link href="/routines/new">Create Your First Routine</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {routines.map((routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
