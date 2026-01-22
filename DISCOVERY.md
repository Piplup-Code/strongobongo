# StrongoBongo Discovery & Planning

## 1. Proposed Project Structure

```
StrongoBongo/
├── app/
│   ├── layout.tsx                 # Root layout (providers, fonts)
│   ├── page.tsx                    # Routine list page (/)
│   ├── routines/
│   │   ├── new/
│   │   │   └── page.tsx            # Create new routine
│   │   └── [id]/
│   │       ├── page.tsx            # View routine details
│   │       └── edit/
│   │           └── page.tsx        # Edit routine
│   ├── workout/
│   │   └── [routineId]/
│   │       └── page.tsx            # Active workout session tracker
│   └── api/                        # API routes if needed
│       └── seed/                   # Optional: seed endpoint
├── components/
│   ├── ui/                         # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── badge.tsx
│   │   └── timer.tsx               # Custom rest timer component
│   ├── routines/
│   │   ├── RoutineList.tsx
│   │   ├── RoutineCard.tsx
│   │   └── RoutineEditor.tsx
│   ├── workout/
│   │   ├── WorkoutSession.tsx
│   │   ├── ExerciseSet.tsx
│   │   └── RestTimer.tsx
│   └── ExerciseSelector.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   └── server.ts               # Server client (if needed)
│   ├── utils.ts                    # Utility functions (cn, etc.)
│   └── storage.ts                  # localStorage helpers for session_id
├── types/
│   └── database.ts                 # TypeScript types from Supabase
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql  # DB schema + seed data
│   └── seed.sql                    # Exercise seed data
├── public/                         # Static assets
├── .env.local                      # Environment variables
├── .env.example                    # Example env file
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## 2. Supabase Client Setup

### Environment Variables (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Client Initialization (lib/supabase/client.ts)
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Session ID Management (lib/storage.ts)
```typescript
// Generate and store anonymous session ID
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sessionId = localStorage.getItem('session_id')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem('session_id', sessionId)
  }
  return sessionId
}
```

**Note**: Since we're using anonymous sessions, we'll need Row Level Security (RLS) policies that allow:
- SELECT/INSERT/UPDATE/DELETE on routines where session_id matches
- SELECT on exercises (public read)
- INSERT/UPDATE on workout_sessions and session_sets where session_id matches

## 3. DB Schema Review

### Schema Validation
✅ **routines**: Good - session_id as text is fine for UUIDs
✅ **exercises**: Good - pre-seeded, no session_id needed
✅ **routine_exercises**: Good - junction table with ordering
✅ **workout_sessions**: Good - tracks session lifecycle
✅ **session_sets**: Good - individual set tracking

### Recommended Additions/Changes:
1. **Indexes** (for performance):
   - `routines(session_id)` - fast lookup of user's routines
   - `routine_exercises(routine_id, order_index)` - ordered exercise fetch
   - `workout_sessions(session_id, started_at DESC)` - recent sessions
   - `session_sets(session_id, exercise_id)` - set history

2. **Optional Enhancements**:
   - `workout_sessions.notes` (text) - user notes about workout
   - `session_sets.rest_duration_seconds` (integer) - if logging rest time

3. **RLS Policies Needed**:
   ```sql
   -- Routines: users can only see/edit their own
   CREATE POLICY "Users can manage own routines"
     ON routines FOR ALL
     USING (session_id = current_setting('app.session_id', true));
   
   -- Exercises: public read
   CREATE POLICY "Exercises are public"
     ON exercises FOR SELECT
     USING (true);
   
   -- Similar policies for workout_sessions and session_sets
   ```

## 4. Pages/Routes

### Route Structure:
1. **`/` (app/page.tsx)**
   - Routine list page
   - Shows all routines for current session_id
   - "New Routine" button
   - Click routine → view/edit

2. **`/routines/new` (app/routines/new/page.tsx)**
   - Create new routine
   - Name input
   - Add exercises (search/select from exercises table)
   - Set target sets & rest time per exercise
   - Save → redirect to routine detail

3. **`/routines/[id]` (app/routines/[id]/page.tsx)**
   - View routine details
   - List exercises in order
   - "Edit" and "Start Workout" buttons

4. **`/routines/[id]/edit` (app/routines/[id]/edit/page.tsx)**
   - Edit routine name
   - Reorder/remove exercises
   - Update target sets/rest times
   - Save changes

5. **`/workout/[routineId]` (app/workout/[routineId]/page.tsx)**
   - Active workout session tracker
   - Shows exercises in order
   - For each exercise: log sets (reps, weight)
   - Rest timer between sets
   - "Complete Workout" button
   - Auto-saves sets as they're logged

## 5. Recommended shadcn/ui Components

### Core Components to Install:
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add scroll-area  # For exercise lists
```

### Custom Components Needed:
- **RestTimer** - Countdown timer component (client-side)
- **ExerciseSetInput** - Input for reps/weight with validation
- **ExerciseSelector** - Searchable dropdown for adding exercises

### Component Usage:
- **Button**: Primary actions (Start Workout, Save Routine, Complete Set)
- **Card**: Routine cards, exercise cards in workout view
- **Dialog**: Confirm delete routine, add exercise modal
- **Input**: Routine name, reps, weight inputs
- **Select**: Muscle group filter, equipment filter
- **Badge**: Muscle group tags, equipment tags
- **Separator**: Visual dividers in workout view

## 6. Rest Timer Approach

### Recommendation: **Client-Side Only (MVP)**

**Why:**
- Simpler implementation (no DB writes during rest)
- Better UX (instant start/stop, no network delays)
- MVP scope - can add logging later if needed

**Implementation:**
- Use `useState` + `useEffect` with `setInterval`
- Display countdown in UI (e.g., "Rest: 1:30")
- Optional: Play sound when timer completes
- Timer state is ephemeral - not persisted

**Future Enhancement:**
- If we want to track rest duration later, add `rest_duration_seconds` to `session_sets` table
- Log rest time when user starts next set

## 7. Seed Data Approach

### Recommendation: **SQL Script (supabase/seed.sql)**

**Why:**
- Cleaner for initial setup
- Version controlled
- Can run via Supabase dashboard SQL editor
- No API endpoint needed (one-time setup)

**Approach:**
```sql
-- Insert common exercises
INSERT INTO exercises (name, muscle_group, equipment) VALUES
  ('Bench Press', 'chest', 'barbell'),
  ('Squat', 'legs', 'barbell'),
  ('Deadlift', 'back', 'barbell'),
  ('Overhead Press', 'shoulders', 'barbell'),
  ('Barbell Row', 'back', 'barbell'),
  -- ... more exercises
```

**Execution:**
- Run once via Supabase dashboard → SQL Editor
- Or include in migration file for automated setup

**Alternative (if needed):**
- API endpoint `/api/seed` (admin-only, one-time call)
- Less ideal for MVP - adds complexity

## Missing Pieces & Risks

### ⚠️ Risks & Considerations:

1. **RLS Policy Complexity**
   - Need to pass `session_id` via Supabase context or headers
   - May need custom RLS functions to check session_id
   - **Mitigation**: Test RLS policies early, use service role key for migrations

2. **Session ID Persistence**
   - Users clearing localStorage = lost data
   - **Mitigation**: Acceptable for MVP, add auth later

3. **No Data Migration**
   - Can't transfer routines between devices
   - **Mitigation**: MVP scope, auth solves this later

4. **Concurrent Workout Sessions**
   - What if user starts workout, closes tab, starts another?
   - **Mitigation**: Check for active session on mount, prompt to resume

5. **Exercise Search Performance**
   - If seed data grows large, need search/filter
   - **Mitigation**: Use Supabase `ilike` or full-text search

6. **Mobile UX**
   - Rest timer needs to work when app is backgrounded
   - **Mitigation**: Use Web APIs (Page Visibility API), accept limitations

### ✅ What's Covered:
- ✅ Basic CRUD for routines
- ✅ Workout tracking
- ✅ Set logging
- ✅ Responsive design (Tailwind)
- ✅ Type safety (TypeScript)

## Recommended shadcn Components Summary

**Must Install:**
- button, card, dialog, input, select, badge, separator

**Nice to Have:**
- scroll-area, toast (for notifications), skeleton (loading states)

**Custom Build:**
- RestTimer, ExerciseSetInput, ExerciseSelector

## Questions Before Phase 1?

### Ready to Start ✅
- Project structure is clear
- Supabase setup is straightforward
- DB schema is solid
- Routes are defined
- Component plan is ready

### Optional Clarifications (not blockers):
1. **Exercise seed data**: How many exercises? Full list or start with 20-30 common ones?
2. **Workout persistence**: Auto-save sets immediately or batch on "Complete Workout"?
3. **Routine sharing**: Any plans for sharing routines between users? (Not MVP, but affects schema)
4. **Analytics**: Track PRs (personal records)? (Nice-to-have, can add later)

**Recommendation**: Start with 30-50 common exercises, auto-save sets, skip sharing/analytics for MVP.

---

## Next Steps (Phase 1)

1. Initialize Next.js 14 project
2. Install dependencies (Supabase, Tailwind, shadcn/ui)
3. Set up Supabase client and storage utilities
4. Create DB schema + RLS policies
5. Seed exercises
6. Build routine list page
7. Build routine editor
8. Build workout tracker
9. Polish UI/UX

**Estimated Time**: 2 hours (tight but doable with focused scope)
