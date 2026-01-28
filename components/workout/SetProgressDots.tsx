// components/workout/SetProgressDots.tsx
interface SetProgressDotsProps {
  total: number
  completed: number
  isResting?: boolean
}

export function SetProgressDots({ total, completed, isResting = false }: SetProgressDotsProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      {Array.from({ length: total }).map((_, i) => {
        const isFilled = i < completed
        const isInProgress = i === completed && isResting

        return (
          <div
            key={i}
            className={`
              w-4 h-4 rounded-full border-2 border-foreground transition-all duration-300
              ${isFilled ? 'bg-foreground' : ''}
              ${isInProgress ? 'bg-foreground/50 animate-pulse' : ''}
            `}
          />
        )
      })}
    </div>
  )
}
