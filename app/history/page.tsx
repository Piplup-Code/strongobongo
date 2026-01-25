'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { WorkoutHistoryCard } from '@/components/history/WorkoutHistoryCard'
import { getWorkoutHistory, WorkoutHistoryItem } from '@/lib/supabase/queries'
import { getOrCreateSessionId } from '@/lib/storage'
import { toast } from '@/lib/utils/toast'

export default function HistoryPage() {
  const [workouts, setWorkouts] = useState<WorkoutHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true)
        const sessionId = getOrCreateSessionId()
        const data = await getWorkoutHistory(sessionId)
        setWorkouts(data)
        setError(null)
      } catch (err) {
        console.error('Error loading workout history:', err)
        const errorMessage = 'Failed to load workout history. Please refresh the page.'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Workout History</h1>
        <p className="text-muted-foreground mt-1">
          Track your progress over time
        </p>
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
      ) : workouts.length === 0 ? (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-semibold mb-2">No workouts yet</h2>
            <p className="text-muted-foreground mb-6">
              Complete your first workout to start tracking your progress!
            </p>
            <Button asChild size="lg">
              <Link href="/">Go to Routines</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {workouts.map((workout) => (
            <WorkoutHistoryCard key={workout.id} workout={workout} />
          ))}
        </div>
      )}
    </div>
  )
}
