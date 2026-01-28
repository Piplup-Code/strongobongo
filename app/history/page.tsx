'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { WorkoutHistoryCard } from '@/components/history/WorkoutHistoryCard'
import { DateGroupHeader } from '@/components/history/DateGroupHeader'
import { WorkoutHeatMap } from '@/components/history/WorkoutHeatMap'
import { getWorkoutHistory, WorkoutHistoryItem } from '@/lib/supabase/queries'
import { getOrCreateSessionId } from '@/lib/storage'
import { toast } from '@/lib/utils/toast'
import { DateGroup, getRelativeDateGroup } from '@/lib/utils/date'
import { Dumbbell } from 'lucide-react'

// Define the order of date groups for display
const DATE_GROUP_ORDER: DateGroup[] = ['today', 'yesterday', 'this_week', 'last_week', 'earlier']

export default function HistoryPage() {
  const [workouts, setWorkouts] = useState<WorkoutHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

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

  // Filter workouts by selected date if any
  const filteredWorkouts = useMemo(() => {
    if (!selectedDate) return workouts

    return workouts.filter(w => {
      const workoutDate = new Date(w.ended_at)
      return workoutDate.toDateString() === selectedDate.toDateString()
    })
  }, [workouts, selectedDate])

  // Group workouts by relative date
  const groupedWorkouts = useMemo(() => {
    const groups = new Map<DateGroup, WorkoutHistoryItem[]>()

    for (const workout of filteredWorkouts) {
      const group = getRelativeDateGroup(new Date(workout.ended_at))
      const existing = groups.get(group) || []
      existing.push(workout)
      groups.set(group, existing)
    }

    // Return groups in order
    return DATE_GROUP_ORDER
      .filter(group => groups.has(group))
      .map(group => ({
        group,
        workouts: groups.get(group)!
      }))
  }, [filteredWorkouts])

  const handleDayClick = (date: Date, dayWorkouts: WorkoutHistoryItem[]) => {
    if (selectedDate?.toDateString() === date.toDateString()) {
      // Clicking same date clears filter
      setSelectedDate(null)
    } else if (dayWorkouts.length > 0) {
      setSelectedDate(date)
    }
  }

  return (
    <div className="min-h-screen relative">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large diagonal stripe */}
        <div className="absolute -right-20 top-0 w-40 h-[200%] bg-primary/[0.03] transform -skew-x-12" />
        {/* Corner accent */}
        <div className="absolute top-0 left-0 w-32 h-32">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 to-transparent" />
          <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-primary/40 to-transparent" />
        </div>
      </div>

      <div className="container mx-auto px-6 py-10 max-w-2xl relative">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-card/50 animate-pulse border-2 border-foreground/10"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        ) : error ? (
          <div className="border-2 border-destructive bg-destructive/10 p-6 text-destructive animate-reveal">
            <div className="font-display text-xl uppercase mb-2">Error</div>
            <div>{error}</div>
          </div>
        ) : workouts.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center min-h-[70vh]">
            {/* Decorative number */}
            <div className="text-[12rem] md:text-[16rem] font-display text-foreground/[0.03] leading-none select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              00
            </div>

            <div className="relative z-10 text-center animate-reveal">
              {/* Yellow accent line */}
              <div className="w-12 h-1 bg-primary mx-auto mb-8" />

              <h1 className="text-4xl md:text-6xl font-display tracking-tight leading-none mb-3">
                No Workouts
              </h1>
              <h1 className="text-4xl md:text-6xl font-display tracking-tight leading-none text-primary mb-8">
                Yet
              </h1>

              <p className="text-muted-foreground mb-10 max-w-xs mx-auto">
                Complete your first workout to start tracking your progress
              </p>

              <Button asChild size="lg" className="text-lg px-8 h-14">
                <Link href="/">
                  <Dumbbell className="h-5 w-5 mr-2" />
                  Start Training
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          /* History List */
          <div className="min-h-[70vh]">
            {/* Header */}
            <div className="mb-8 animate-reveal">
              {/* Yellow accent line */}
              <div className="w-8 h-1 bg-primary mb-6" />

              <h1 className="text-4xl md:text-5xl font-display tracking-tight leading-none mb-2">
                Your
              </h1>
              <h1 className="text-4xl md:text-5xl font-display tracking-tight leading-none text-primary">
                History
              </h1>
            </div>

            {/* Heat Map */}
            <div className="mb-8 animate-reveal" style={{ animationDelay: '0.1s' }}>
              <WorkoutHeatMap
                workouts={workouts}
                weeks={16}
                onDayClick={handleDayClick}
              />
            </div>

            {/* Selected date filter indicator */}
            {selectedDate && (
              <div className="mb-4 flex items-center gap-3 animate-reveal">
                <div className="text-sm text-muted-foreground">
                  Showing workouts from{' '}
                  <span className="text-primary font-display uppercase">
                    {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
                >
                  Clear filter
                </button>
              </div>
            )}

            {/* Grouped workout cards */}
            <div className="space-y-2">
              {groupedWorkouts.map(({ group, workouts: groupWorkouts }, groupIndex) => (
                <div key={group}>
                  <DateGroupHeader group={group} />
                  <div className="space-y-3">
                    {groupWorkouts.map((workout, index) => (
                      <div
                        key={workout.id}
                        className="animate-reveal"
                        style={{ animationDelay: `${(groupIndex * 3 + index + 1) * 0.08}s` }}
                      >
                        <WorkoutHistoryCard workout={workout} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
