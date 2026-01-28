'use client'

import { useMemo, useState } from 'react'
import { WorkoutHistoryItem } from '@/lib/supabase/queries'
import { cn } from '@/lib/utils'

interface WorkoutHeatMapProps {
  workouts: WorkoutHistoryItem[]
  weeks?: number
  onDayClick?: (date: Date, workouts: WorkoutHistoryItem[]) => void
}

interface DayData {
  date: Date
  workouts: WorkoutHistoryItem[]
  intensity: number // 0-4 scale
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function getIntensity(count: number): number {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  if (count <= 3) return 3
  return 4
}

export function WorkoutHeatMap({ workouts, weeks = 16, onDayClick }: WorkoutHeatMapProps) {
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  // Build heat map data
  const { grid, monthLabels } = useMemo(() => {
    // Create a map of date string -> workouts
    const workoutsByDate = new Map<string, WorkoutHistoryItem[]>()
    for (const workout of workouts) {
      const dateKey = new Date(workout.ended_at).toDateString()
      const existing = workoutsByDate.get(dateKey) || []
      existing.push(workout)
      workoutsByDate.set(dateKey, existing)
    }

    // Get the Monday of the current week
    const today = new Date()
    const currentMonday = getMonday(today)

    // Build grid: array of weeks, each week is array of 7 days
    const grid: DayData[][] = []
    const monthLabels: { week: number; label: string }[] = []
    let lastMonth = -1

    for (let w = weeks - 1; w >= 0; w--) {
      const weekStart = new Date(currentMonday)
      weekStart.setDate(weekStart.getDate() - (w * 7))

      const week: DayData[] = []
      for (let d = 0; d < 7; d++) {
        const date = new Date(weekStart)
        date.setDate(date.getDate() + d)

        const dateKey = date.toDateString()
        const dayWorkouts = workoutsByDate.get(dateKey) || []

        week.push({
          date,
          workouts: dayWorkouts,
          intensity: getIntensity(dayWorkouts.length),
        })

        // Track month labels
        if (d === 0 && date.getMonth() !== lastMonth) {
          lastMonth = date.getMonth()
          monthLabels.push({
            week: weeks - 1 - w,
            label: date.toLocaleDateString('en-US', { month: 'short' }),
          })
        }
      }
      grid.push(week)
    }

    return { grid, monthLabels }
  }, [workouts, weeks])

  // Calculate stats
  const stats = useMemo(() => {
    const totalWorkouts = workouts.length
    const daysWithWorkouts = new Set(
      workouts.map(w => new Date(w.ended_at).toDateString())
    ).size

    // Current streak
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i <= 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      const hasWorkout = workouts.some(w => {
        const wDate = new Date(w.ended_at)
        wDate.setHours(0, 0, 0, 0)
        return wDate.getTime() === checkDate.getTime()
      })
      if (hasWorkout) {
        streak++
      } else if (i > 0) {
        break
      }
    }

    return { totalWorkouts, daysWithWorkouts, streak }
  }, [workouts])

  const handleMouseEnter = (day: DayData, e: React.MouseEvent) => {
    setHoveredDay(day)
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    })
  }

  const handleMouseLeave = () => {
    setHoveredDay(null)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isFuture = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date > today
  }

  return (
    <div className="relative">
      {/* Stats row */}
      <div className="flex items-center gap-6 mb-6 text-sm">
        <div>
          <span className="text-muted-foreground">Workouts: </span>
          <span className="font-mono text-primary">{stats.totalWorkouts}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Active days: </span>
          <span className="font-mono text-primary">{stats.daysWithWorkouts}</span>
        </div>
        {stats.streak > 0 && (
          <div>
            <span className="text-muted-foreground">Streak: </span>
            <span className="font-mono text-primary">{stats.streak} day{stats.streak !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Heat map container */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-block">
          {/* Month labels */}
          <div className="flex ml-6 mb-1 text-xs text-muted-foreground">
            {monthLabels.map(({ week, label }, i) => (
              <div
                key={i}
                className="absolute"
                style={{ left: `${week * 14 + 24}px` }}
              >
                {label}
              </div>
            ))}
          </div>

          <div className="flex gap-0.5 mt-4">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1 text-xs text-muted-foreground">
              {DAY_LABELS.map((label, i) => (
                <div key={i} className="h-3 w-4 flex items-center justify-center text-[10px]">
                  {i % 2 === 0 ? label : ''}
                </div>
              ))}
            </div>

            {/* Grid */}
            {grid.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-0.5">
                {week.map((day, dayIdx) => (
                  <button
                    key={dayIdx}
                    onClick={() => !isFuture(day.date) && onDayClick?.(day.date, day.workouts)}
                    onMouseEnter={(e) => handleMouseEnter(day, e)}
                    onMouseLeave={handleMouseLeave}
                    disabled={isFuture(day.date)}
                    className={cn(
                      'h-3 w-3 border transition-all duration-150',
                      isFuture(day.date) && 'opacity-20 cursor-default',
                      isToday(day.date) && 'ring-1 ring-foreground/50',
                      day.intensity === 0 && 'bg-foreground/5 border-foreground/10 hover:border-foreground/30',
                      day.intensity === 1 && 'bg-primary/20 border-primary/30 hover:border-primary/50',
                      day.intensity === 2 && 'bg-primary/40 border-primary/50 hover:border-primary/70',
                      day.intensity === 3 && 'bg-primary/60 border-primary/70 hover:border-primary',
                      day.intensity === 4 && 'bg-primary border-primary hover:brightness-110',
                    )}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-0.5">
              <div className="h-3 w-3 bg-foreground/5 border border-foreground/10" />
              <div className="h-3 w-3 bg-primary/20 border border-primary/30" />
              <div className="h-3 w-3 bg-primary/40 border border-primary/50" />
              <div className="h-3 w-3 bg-primary/60 border border-primary/70" />
              <div className="h-3 w-3 bg-primary border border-primary" />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="bg-card border-2 border-foreground/20 px-3 py-2 text-sm shadow-lg">
            <div className="font-display uppercase tracking-wider">
              {formatDate(hoveredDay.date)}
            </div>
            <div className="text-muted-foreground">
              {hoveredDay.workouts.length === 0
                ? 'No workouts'
                : `${hoveredDay.workouts.length} workout${hoveredDay.workouts.length !== 1 ? 's' : ''}`}
            </div>
            {hoveredDay.workouts.length > 0 && (
              <div className="text-primary text-xs mt-1">
                {hoveredDay.workouts.map(w => w.routine.name).join(', ')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
