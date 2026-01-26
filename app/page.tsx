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
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-12 max-w-5xl">
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
        ) : routines.length === 0 ? (
          <div className="text-center py-24 px-6 animate-reveal">
            <div className="max-w-lg mx-auto">
              <h1 className="text-6xl md:text-7xl font-display mb-6 tracking-tight leading-none">
                Ready to train?
              </h1>
              <p className="text-lg text-muted-foreground mb-12 font-body max-w-md mx-auto">
                Create your first workout routine to get started tracking your progress
              </p>
              <Button asChild size="lg" className="animate-reveal-delay-2">
                <Link href="/routines/new">Create Your First Routine</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-12 animate-reveal">
              <h1 className="text-5xl md:text-6xl font-display mb-4 tracking-tight leading-none">
                What are you<br />training today?
              </h1>
            </div>
            <div className="space-y-6 mb-12">
              {routines.map((routine, index) => (
                <div
                  key={routine.id}
                  className="animate-reveal"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <RoutineCard
                    routine={routine}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-center animate-reveal-delay-3">
              <Button asChild variant="outline" size="lg">
                <Link href="/routines/new">+ Create new routine</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
