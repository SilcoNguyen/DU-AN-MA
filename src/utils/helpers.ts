import type { ProjectStatus, TaskStatus } from '../types'

export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '-'
  try {
    const [year, month, day] = dateStr.split('-').map(Number)
    if (!year || !month || !day) return dateStr
    const d = new Date(year, month - 1, day)
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '-'
  try {
    const [year, month, day] = dateStr.split('-').map(Number)
    if (!year || !month || !day) return dateStr
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`
  } catch {
    return dateStr
  }
}

export function getStatusLabel(status: ProjectStatus | TaskStatus): string {
  switch (status) {
    case 'completed':
      return 'Completed'
    case 'on-track':
      return 'On Track'
    case 'at-risk':
      return 'At Risk'
    case 'delayed':
      return 'Delayed'
    case 'not-started':
      return 'Not Started'
    default:
      return status
  }
}

export function getStatusBadgeStyle(status: ProjectStatus | TaskStatus): {
  bg: string
  text: string
  border: string
  dot: string
} {
  switch (status) {
    case 'completed':
      return {
        bg: 'bg-emerald-50 text-emerald-700',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
      }
    case 'on-track':
      return {
        bg: 'bg-blue-50 text-blue-700',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
      }
    case 'at-risk':
      return {
        bg: 'bg-amber-50 text-amber-700',
        text: 'text-amber-700',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
      }
    case 'delayed':
      return {
        bg: 'bg-rose-50 text-rose-700',
        text: 'text-rose-700',
        border: 'border-rose-200',
        dot: 'bg-rose-500',
      }
    case 'not-started':
    default:
      return {
        bg: 'bg-slate-50 text-slate-600',
        text: 'text-slate-600',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
      }
  }
}

export function getProgressBarColor(status: ProjectStatus | TaskStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-emerald-500'
    case 'on-track':
      return 'bg-blue-600'
    case 'at-risk':
      return 'bg-amber-500'
    case 'delayed':
      return 'bg-rose-500'
    case 'not-started':
    default:
      return 'bg-slate-400'
  }
}

export function generateId(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return `${base || 'item'}-${Date.now().toString(36).slice(-4)}`
}

export function calculateAverageProgress(tasks: { progress: number }[]): number {
  if (!tasks || tasks.length === 0) return 0
  const total = tasks.reduce((sum, t) => sum + (Number(t.progress) || 0), 0)
  return Math.round(total / tasks.length)
}
