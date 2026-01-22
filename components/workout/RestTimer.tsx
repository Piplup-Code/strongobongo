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
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="text-sm text-muted-foreground mb-1">Rest Timer</div>
            <div className="text-2xl font-bold">{formatTime(timeRemaining)}</div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePauseResume}
              aria-label={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? (
                <PlayIcon className="h-4 w-4" />
              ) : (
                <PauseIcon className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleSkip}
              aria-label="Skip rest"
            >
              <SkipForwardIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
