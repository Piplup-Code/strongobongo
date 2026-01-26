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
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        <div className="mb-12 animate-reveal">
          <h1 className="text-5xl md:text-6xl font-display mb-4 tracking-tight leading-none">
            Workout History
          </h1>
          <p className="text-lg text-muted-foreground font-body">
            Track your progress over time
          </p>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 bg-muted animate-pulse border-2 border-foreground/20"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        ) : error ? (
          <div className="border-2 border-destructive bg-destructive/10 p-6 text-destructive animate-reveal">
            <div className="font-display text-xl uppercase mb-2">Error</div>
            <div>{error}</div>
          </div>
        ) : workouts.length === 0 ? (
          <div className="text-center py-24 px-6 animate-reveal">
            <div className="max-w-lg mx-auto">
              <h2 className="text-5xl md:text-6xl font-display mb-6 tracking-tight leading-none">
                No workouts yet
              </h2>
              <p className="text-lg text-muted-foreground mb-12 font-body max-w-md mx-auto">
                Complete your first workout to start tracking your progress!
              </p>
              <Button asChild size="lg" className="animate-reveal-delay-2">
                <Link href="/">Go to Routines</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {workouts.map((workout, index) => (
              <div
                key={workout.id}
                className="animate-reveal"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <WorkoutHistoryCard workout={workout} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
