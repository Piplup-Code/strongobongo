# Focused Home Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the home page to be focused and distraction-free — returning users see only their routines (tap to start), new users see a clear path to create one.

**Architecture:** Simplify the existing home page by removing templates section, inline buttons, and dropdowns. Routine cards become full-width tap targets that navigate directly to workout. Edit/delete accessed via long-press context menu. Templates moved to a separate browse flow.

**Tech Stack:** React, Next.js, Tailwind CSS, existing Supabase queries (no backend changes)

---

## Task 1: Create RoutineButton Component

**Files:**
- Create: `components/routines/RoutineButton.tsx`

A simple, large tap target that starts a workout.

**Step 1: Create the component**

```tsx
// components/routines/RoutineButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Database } from '@/types/database'
import { deleteRoutine } from '@/lib/supabase/queries'
import { toast } from '@/lib/utils/toast'

type Routine = Database['public']['Tables']['routines']['Row']

interface RoutineButtonProps {
  routine: Routine
  onDelete?: () => void
}

export function RoutineButton({ routine, onDelete }: RoutineButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleTap = () => {
    router.push(`/workout/${routine.id}`)
  }

  const handleEdit = () => {
    router.push(`/routines/${routine.id}/edit`)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteRoutine(routine.id)
      toast.success('Routine deleted')
      setShowDeleteDialog(false)
      onDelete?.()
    } catch (error) {
      console.error('Error deleting routine:', error)
      toast.error('Failed to delete routine')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button
            onClick={handleTap}
            className="w-full text-left p-6 bg-card border-2 border-foreground/20 hover:border-foreground/40 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] active:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] transition-all duration-150"
          >
            <span className="text-3xl md:text-4xl font-display tracking-tight">
              {routine.name}
            </span>
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleEdit}>
            Edit
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Routine</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{routine.name}&quot;? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

**Step 2: Verify context-menu component exists**

Check if `@/components/ui/context-menu` exists. If not, install it:

```bash
npx shadcn@latest add context-menu
```

**Step 3: Commit**

```bash
git add components/routines/RoutineButton.tsx
git commit -m "feat: add RoutineButton component with long-press context menu"
```

---

## Task 2: Refactor Home Page - Empty State

**Files:**
- Modify: `app/page.tsx`

**Step 1: Replace the empty state with focused design**

Update the empty state section in `app/page.tsx`:

```tsx
// Replace the routines.length === 0 block with:

) : routines.length === 0 ? (
  <div className="flex flex-col items-center justify-center min-h-[60vh] animate-reveal">
    <h1 className="text-4xl md:text-5xl font-display text-center mb-8 tracking-tight leading-tight">
      What are you<br />training today?
    </h1>

    <Button asChild size="lg" className="mb-6">
      <Link href="/routines/new">+ Create Routine</Link>
    </Button>

    <Link
      href="/templates"
      className="text-muted-foreground hover:text-foreground transition-colors text-sm"
    >
      or browse templates →
    </Link>
  </div>
```

**Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: simplify home page empty state for experienced users"
```

---

## Task 3: Refactor Home Page - Routines List

**Files:**
- Modify: `app/page.tsx`

**Step 1: Replace routines list with RoutineButton components**

Update the routines display section:

```tsx
// Replace the routines.length > 0 block with:

) : (
  <div className="flex flex-col min-h-[60vh] animate-reveal">
    <h1 className="text-4xl md:text-5xl font-display mb-8 tracking-tight leading-tight">
      What are you<br />training today?
    </h1>

    <div className="space-y-3 mb-8">
      {routines.map((routine, index) => (
        <div
          key={routine.id}
          className="animate-reveal"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <RoutineButton
            routine={routine}
            onDelete={handleDelete}
          />
        </div>
      ))}
    </div>

    <div className="text-center">
      <Link
        href="/routines/new"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        + Add routine
      </Link>
    </div>
  </div>
)
```

**Step 2: Update imports at top of file**

```tsx
// Remove these imports:
// import { RoutineCard } from '@/components/routines/RoutineCard'
// import { TemplateCard } from '@/components/templates/TemplateCard'
// import { WORKOUT_TEMPLATES, WorkoutTemplate } from '@/lib/data/workout-templates'
// import { ChevronDown, ChevronRight } from 'lucide-react'

// Add this import:
import { RoutineButton } from '@/components/routines/RoutineButton'
```

**Step 3: Remove unused state and handlers**

Remove from the component:
- `const [templatesExpanded, setTemplatesExpanded] = useState(false)`
- `const handleCopyTemplate = async (template: WorkoutTemplate) => { ... }`

**Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: replace routine cards with focused tap-to-start buttons"
```

---

## Task 4: Create Templates Browse Page

**Files:**
- Create: `app/templates/page.tsx`

Since templates are no longer on the home page, create a dedicated page.

**Step 1: Create the templates page**

```tsx
// app/templates/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TemplateCard } from '@/components/templates/TemplateCard'
import { WORKOUT_TEMPLATES, WorkoutTemplate } from '@/lib/data/workout-templates'
import { copyTemplateToRoutine, getRoutines } from '@/lib/supabase/queries'
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
```

**Step 2: Commit**

```bash
git add app/templates/page.tsx
git commit -m "feat: add dedicated templates browse page"
```

---

## Task 5: Add "Browse Templates" to New Routine Flow

**Files:**
- Modify: `app/routines/new/page.tsx`

When users tap "+ Add routine", they might also want access to templates. Add a link.

**Step 1: Add templates link to new routine page**

Add below the routine name input:

```tsx
// After the routine name input section, add:

<div className="text-center">
  <Link
    href="/templates"
    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
  >
    or start from a template →
  </Link>
</div>
```

Add the Link import if not present:
```tsx
import Link from 'next/link'
```

**Step 2: Commit**

```bash
git add app/routines/new/page.tsx
git commit -m "feat: add template link to new routine page"
```

---

## Task 6: Clean Up Unused Components

**Files:**
- Delete: `components/routines/RoutineCard.tsx` (replaced by RoutineButton)

**Step 1: Verify RoutineCard is no longer imported anywhere**

```bash
grep -r "RoutineCard" --include="*.tsx" --include="*.ts" app/ components/
```

Should only show the file itself.

**Step 2: Delete the file**

```bash
rm components/routines/RoutineCard.tsx
```

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove unused RoutineCard component"
```

---

## Task 7: Test and Polish

**Step 1: Run the dev server**

```bash
npm run dev
```

**Step 2: Manual testing checklist**

Test these scenarios:
- [ ] New user (no routines): See "Create Routine" button + "browse templates" link
- [ ] Tap "Create Routine" → goes to /routines/new
- [ ] Tap "browse templates" → goes to /templates
- [ ] Templates page: can add template to routines
- [ ] After adding template: redirects to home, routine shows
- [ ] Returning user: See routine buttons only
- [ ] Tap routine → starts workout immediately
- [ ] Long-press routine → context menu appears with Edit/Delete
- [ ] Edit → goes to edit page
- [ ] Delete → shows confirmation, deletes on confirm
- [ ] "+ Add routine" link works
- [ ] Test on mobile viewport

**Step 3: Fix any issues found**

Address bugs or UX issues.

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: polish focused home page"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | RoutineButton with long-press menu | `components/routines/RoutineButton.tsx` |
| 2 | Simplified empty state | `app/page.tsx` |
| 3 | Routines list with tap-to-start | `app/page.tsx` |
| 4 | Dedicated templates page | `app/templates/page.tsx` |
| 5 | Template link in new routine flow | `app/routines/new/page.tsx` |
| 6 | Remove unused RoutineCard | Delete `RoutineCard.tsx` |
| 7 | Test and polish | All files |

**Removed from home page:**
- Templates section (moved to /templates)
- RoutineCard with inline buttons (replaced by RoutineButton)
- Dropdown menus (replaced by long-press context menu)
