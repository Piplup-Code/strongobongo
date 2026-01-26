'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PauseIcon, PlayIcon, SkipForwardIcon } from 'lucide-react'

interface RestTimerProps {
  durationSeconds: number
  onComplete?: () => void
  onSkip?: () => void
  autoStart?: boolean
}

export function RestTimer({
  durationSeconds,
  onComplete,
  onSkip,
  autoStart = true
}: RestTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(durationSeconds)
  const [isPaused, setIsPaused] = useState(!autoStart)
  const [isComplete, setIsComplete] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isPaused || isComplete) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    if (timeRemaining <= 0) {
      setIsComplete(true)
      if (onComplete) {
        onComplete()
      }
      return
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsComplete(true)
          if (onComplete) {
            onComplete()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPaused, timeRemaining, isComplete, onComplete])

  // Reset timer when duration changes
  useEffect(() => {
    setTimeRemaining(durationSeconds)
    setIsComplete(false)
    setIsPaused(!autoStart)
  }, [durationSeconds, autoStart])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = ((durationSeconds - timeRemaining) / durationSeconds) * 100

  const handleSkip = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsComplete(true)
    if (onSkip) {
      onSkip()
    }
  }

  const handlePauseResume = () => {
    setIsPaused(!isPaused)
  }

  if (isComplete) {
    return null
  }

  return (
    <Card className="bg-primary/10 border-2 border-primary/50 shadow-[8px_8px_0px_0px_rgba(var(--primary),0.2)]">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Rest Timer</div>
            <div className="font-mono text-4xl md:text-5xl font-bold mb-4">{formatTime(timeRemaining)}</div>
            <div className="h-4 bg-muted border-2 border-foreground/20 relative overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-1000 border-r-2 border-foreground/20"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={handlePauseResume}
              aria-label={isPaused ? 'Resume' : 'Pause'}
              className="w-14 h-14"
            >
              {isPaused ? (
                <PlayIcon className="h-5 w-5" />
              ) : (
                <PauseIcon className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleSkip}
              aria-label="Skip rest"
              className="w-14 h-14"
            >
              <SkipForwardIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
