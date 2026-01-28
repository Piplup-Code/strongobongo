// app/templates/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TemplateCard } from '@/components/templates/TemplateCard'
import { WORKOUT_TEMPLATES, WorkoutTemplate } from '@/lib/data/workout-templates'
import { copyTemplateToRoutine } from '@/lib/supabase/queries'
import { getOrCreateSessionId } from '@/lib/storage'
import { toast } from '@/lib/utils/toast'
import { ArrowLeft } from 'lucide-react'

export default function TemplatesPage() {
  const router = useRouter()

  const handleCopyTemplate = async (template: WorkoutTemplate) => {
    try {
      const sessionId = getOrCreateSessionId()
      await copyTemplateToRoutine(sessionId, template)
      toast.success('Added to your routines')
      router.push('/')
    } catch (err) {
      console.error('Error copying template:', err)
      toast.error('Failed to add template')
    }
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-display uppercase tracking-wider">
            Templates
          </h1>
        </div>

        <p className="text-muted-foreground mb-8">
          Expert-backed programs to get you started. Tap to add to your routines.
        </p>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {WORKOUT_TEMPLATES.map((template, index) => (
            <div
              key={template.id}
              className="animate-reveal"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <TemplateCard template={template} onCopy={handleCopyTemplate} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
