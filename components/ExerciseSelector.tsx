'use client'

import { useState, useEffect, useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Database } from '@/types/database'
import { getExercises } from '@/lib/supabase/queries'

type Exercise = Database['public']['Tables']['exercises']['Row']

interface ExerciseSelectorProps {
  onSelect: (exercise: Exercise) => void
  excludeIds?: string[] // Exercise IDs to exclude (already selected)
  muscleGroupFilter?: string
  onMuscleGroupChange?: (group: string) => void
}

export function ExerciseSelector({
  onSelect,
  excludeIds = [],
  muscleGroupFilter,
  onMuscleGroupChange
}: ExerciseSelectorProps) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('')

  useEffect(() => {
    async function loadExercises() {
      try {
        const data = await getExercises()
        setExercises(data)
      } catch (error) {
        console.error('Error loading exercises:', error)
      } finally {
        setLoading(false)
      }
    }
    loadExercises()
  }, [])

  // Get unique muscle groups
  const muscleGroups = useMemo(() => {
    const groups = new Set(exercises.map((e) => e.muscle_group))
    return Array.from(groups).sort()
  }, [exercises])

  // Filter exercises
  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      // Exclude already selected exercises
      if (excludeIds.includes(exercise.id)) return false

      // Filter by muscle group
      if (muscleGroupFilter && exercise.muscle_group !== muscleGroupFilter) {
        return false
      }

      // Filter by search term
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        return (
          exercise.name.toLowerCase().includes(search) ||
          exercise.muscle_group.toLowerCase().includes(search) ||
          exercise.equipment.toLowerCase().includes(search)
        )
      }

      return true
    })
  }, [exercises, excludeIds, muscleGroupFilter, searchTerm])

  const handleSelect = (exerciseId: string) => {
    const exercise = exercises.find((e) => e.id === exerciseId)
    if (exercise) {
      onSelect(exercise)
      setSelectedExerciseId('')
      setSearchTerm('')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        {onMuscleGroupChange && (
          <Select value={muscleGroupFilter || 'all'} onValueChange={(value) => onMuscleGroupChange(value === 'all' ? '' : value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by muscle group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {muscleGroups.map((group) => (
                <SelectItem key={group} value={group}>
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Input
          type="text"
          placeholder="Search exercises..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>

      <Select value={selectedExerciseId} onValueChange={handleSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={loading ? 'Loading exercises...' : 'Select an exercise'} />
        </SelectTrigger>
        <SelectContent>
          {filteredExercises.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
              {loading ? 'Loading exercises...' : searchTerm || muscleGroupFilter 
                ? 'No exercises match your search. Try different filters.' 
                : 'No exercises available'}
            </div>
          ) : (
            filteredExercises.map((exercise) => (
              <SelectItem key={exercise.id} value={exercise.id}>
                <div className="flex flex-col">
                  <span>{exercise.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {exercise.muscle_group} • {exercise.equipment}
                  </span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
