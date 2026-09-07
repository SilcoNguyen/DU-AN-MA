import React, { useState, useMemo, useRef } from 'react'
import type { Project, Task, ProjectStatus, TaskStatus } from '../types'
import {
  formatDateDisplay,
  getStatusBadgeStyle,
  getStatusLabel,
} from '../utils/helpers'
import { Calendar, User } from 'lucide-react'

interface GanttChartProps {
  projects: Project[]
  selectedProjectId?: string | null
  onSelectProject?: (projectId: string) => void
  onEditTask?: (projectId: string, task: Task) => void
  isAdmin?: boolean
}

type TimelineViewMode = 'month' | 'week' | 'day'

interface TimelineItem {
  id: string
  name: string
  owner: string
  startDate: string
  endDate: string
  progress: number
  status: ProjectStatus | TaskStatus
  notes?: string
  isProject: boolean
  projectId: string
}

export const GanttChart: React.FC<GanttChartProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  onEditTask,
  isAdmin = false,
}) => {
  const [viewMode, setViewMode] = useState<TimelineViewMode>('month')
  const [hoveredItem, setHoveredItem] = useState<{
    item: TimelineItem
    x: number
    y: number
  } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Filter projects if a specific one is selected
  const activeProjects = useMemo(() => {
    if (selectedProjectId) {
      return projects.filter((p) => p.id === selectedProjectId)
    }
    return projects
  }, [projects, selectedProjectId])

  // Flatten items into project headers and task rows
  const timelineItems = useMemo<TimelineItem[]>(() => {
    const list: TimelineItem[] = []
    activeProjects.forEach((p) => {
      // Add project parent row
      list.push({
        id: p.id,
        name: p.name,
        owner: p.owner,
        startDate: p.startDate,
        endDate: p.endDate,
        progress: p.progress,
        status: p.status,
        notes: p.notes,
        isProject: true,
        projectId: p.id,
      })

      // Add task rows
      if (p.tasks && p.tasks.length > 0) {
        p.tasks.forEach((t) => {
          list.push({
            id: t.id,
            name: t.name,
            owner: t.owner,
            startDate: t.startDate,
            endDate: t.endDate,
            progress: t.progress,
            status: t.status,
            notes: t.notes,
            isProject: false,
            projectId: p.id,
          })
        })
      }
    })
    return list
  }, [activeProjects])

  // Calculate timeline start and end dates
  const { timelineStart, totalDays, dayWidth } = useMemo(() => {
    let minTime = Number.MAX_SAFE_INTEGER
    let maxTime = 0

    // Find min and max dates
    timelineItems.forEach((item) => {
      if (item.startDate) {
        const t = new Date(item.startDate).getTime()
        if (!isNaN(t) && t < minTime) minTime = t
      }
      if (item.endDate) {
        const t = new Date(item.endDate).getTime()
        if (!isNaN(t) && t > maxTime) maxTime = t
      }
    })

    // Fallback if no valid dates
    const now = new Date()
    if (minTime === Number.MAX_SAFE_INTEGER || maxTime === 0) {
      minTime = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
      maxTime = new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime()
    }

    const start = new Date(minTime)
    start.setDate(start.getDate() - 3) // 3 days padding before
    start.setHours(0, 0, 0, 0)

    const end = new Date(maxTime)
    end.setDate(end.getDate() + 5) // 5 days padding after
    end.setHours(0, 0, 0, 0)

    const diffDays = Math.max(
      15,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    )

    // Day width based on view mode
    let pxPerDay = 32
    if (viewMode === 'day') pxPerDay = 64
    else if (viewMode === 'week') pxPerDay = 44
    else pxPerDay = 32

    return {
      timelineStart: start,
      timelineEnd: end,
      totalDays: diffDays,
      dayWidth: pxPerDay,
    }
  }, [timelineItems, viewMode])

  // Generate days array for timeline header
  const days = useMemo(() => {
    const list: Date[] = []
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(timelineStart)
      d.setDate(d.getDate() + i)
      list.push(d)
    }
    return list
  }, [timelineStart, totalDays])

  // Group days into columns / intervals depending on viewMode
  const intervalMarkers = useMemo(() => {
    return days.map((d, index) => {
      const isInterval =
        viewMode === 'day' ||
        (viewMode === 'week' && d.getDay() === 1) || // Monday
        (viewMode === 'month' && (d.getDate() === 1 || d.getDate() % 7 === 1))

      return {
        date: d,
        index,
        isInterval,
        label: d.toLocaleDateString('en-GB', {
          month: 'short',
          day: 'numeric',
        }),
      }
    })
  }, [days, viewMode])

  // Calculate position helper
  const getPosition = (startDateStr: string, endDateStr: string) => {
    const s = new Date(startDateStr)
    s.setHours(0, 0, 0, 0)
    const e = new Date(endDateStr)
    e.setHours(0, 0, 0, 0)

    const startDiff = Math.max(
      0,
      Math.floor((s.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))
    )
    const duration = Math.max(
      1,
      Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
    )

    const left = startDiff * dayWidth
    const width = Math.max(duration * dayWidth - 4, 18)

    return { left, width }
  }

  // Today indicator
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayDiff = Math.floor(
    (today.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)
  )
  const todayLeft = todayDiff >= 0 && todayDiff <= totalDays ? todayDiff * dayWidth + dayWidth / 2 : null

  // Status color styles for bars
  const getBarColors = (status: ProjectStatus | TaskStatus, isProject: boolean) => {
    if (isProject) {
      switch (status) {
        case 'completed':
          return { bg: 'bg-emerald-500', fill: 'bg-emerald-600', text: 'text-white' }
        case 'on-track':
          return { bg: 'bg-blue-600', fill: 'bg-blue-700', text: 'text-white' }
        case 'at-risk':
          return { bg: 'bg-amber-500', fill: 'bg-amber-600', text: 'text-white' }
        case 'delayed':
          return { bg: 'bg-rose-500', fill: 'bg-rose-600', text: 'text-white' }
        default:
          return { bg: 'bg-slate-600', fill: 'bg-slate-700', text: 'text-white' }
      }
    }

    switch (status) {
      case 'completed':
        return {
          bg: 'bg-emerald-100 border border-emerald-300',
          fill: 'bg-emerald-500',
          text: 'text-emerald-950 font-medium',
        }
      case 'on-track':
        return {
          bg: 'bg-blue-100 border border-blue-300',
          fill: 'bg-blue-600',
          text: 'text-blue-950 font-medium',
        }
      case 'at-risk':
        return {
          bg: 'bg-amber-100 border border-amber-300',
          fill: 'bg-amber-500',
          text: 'text-amber-950 font-medium',
        }
      case 'delayed':
        return {
          bg: 'bg-rose-100 border border-rose-300',
          fill: 'bg-rose-500',
          text: 'text-rose-950 font-medium',
        }
      default:
        return {
          bg: 'bg-slate-100 border border-slate-300',
          fill: 'bg-slate-400',
          text: 'text-slate-800 font-medium',
        }
    }
  }

  const headerMonthTitle = useMemo(() => {
    const midDate = new Date(
      timelineStart.getTime() + (totalDays * 86400000) / 2
    )
    return midDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }, [timelineStart, totalDays])

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Top Header of Gantt */}
      <div className="px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-slate-700 font-medium">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold">{headerMonthTitle}</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
            {timelineItems.filter((i) => !i.isProject).length} Tasks
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'month'
                  ? 'bg-white text-blue-700 font-medium shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'week'
                  ? 'bg-white text-blue-700 font-medium shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'day'
                  ? 'bg-white text-blue-700 font-medium shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Day
            </button>
          </div>
        </div>
      </div>

      {/* Main Gantt Body */}
      <div className="flex flex-1 overflow-hidden relative" ref={containerRef}>
        {/* Left pinned list */}
        <div className="w-80 shrink-0 border-r border-slate-200 bg-white z-10 select-none">
          <div className="h-10 border-b border-slate-200 bg-slate-50/80 px-4 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className="w-44 truncate">Task</span>
            <span className="w-16 text-left">Owner</span>
            <span className="w-14 text-right">Progress</span>
          </div>

          <div className="divide-y divide-slate-100">
            {timelineItems.map((item) => {
              const badge = getStatusBadgeStyle(item.status)
              return (
                <div
                  key={item.id}
                  className={`h-11 px-4 flex items-center justify-between text-xs transition-colors ${
                    item.isProject
                      ? 'bg-slate-50/70 font-semibold text-slate-900 hover:bg-slate-100/70'
                      : 'hover:bg-blue-50/40 text-slate-700'
                  }`}
                  onClick={() => {
                    if (item.isProject && onSelectProject) {
                      onSelectProject(item.projectId)
                    } else if (!item.isProject && isAdmin && onEditTask) {
                      const proj = projects.find((p) => p.id === item.projectId)
                      const taskObj = proj?.tasks.find((t) => t.id === item.id)
                      if (taskObj) onEditTask(item.projectId, taskObj)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center space-x-2 w-44 truncate">
                    {item.isProject ? (
                      <span className={`w-2.5 h-2.5 rounded-xs shrink-0 ${badge.dot}`} />
                    ) : (
                      <span className="w-2.5 h-2.5 ml-2 border-l-2 border-b-2 border-slate-300 rounded-bl shrink-0" />
                    )}
                    <span className="truncate" title={item.name}>
                      {item.name}
                    </span>
                  </div>

                  <div className="w-16 truncate text-slate-500 flex items-center space-x-1" title={item.owner}>
                    <User className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{item.owner || '-'}</span>
                  </div>

                  <div className="w-14 text-right font-medium text-slate-700">
                    {item.progress}%
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right scrollable timeline */}
        <div className="flex-1 overflow-x-auto relative bg-white">
          <div
            style={{ width: `${totalDays * dayWidth}px` }}
            className="min-h-full relative"
          >
            {/* Timeline header columns */}
            <div className="h-10 border-b border-slate-200 bg-slate-50/80 flex sticky top-0 z-10 select-none">
              {intervalMarkers.map((marker, i) => (
                <div
                  key={i}
                  style={{ width: `${dayWidth}px` }}
                  className={`h-full shrink-0 border-r border-slate-100 flex flex-col justify-center px-1 ${
                    marker.isInterval ? 'bg-slate-100/40' : ''
                  }`}
                >
                  {marker.isInterval && (
                    <span className="text-[11px] font-medium text-slate-600 truncate whitespace-nowrap">
                      {marker.label}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Vertical grid lines */}
            <div className="absolute inset-0 top-10 pointer-events-none flex">
              {days.map((_, i) => (
                <div
                  key={i}
                  style={{ width: `${dayWidth}px` }}
                  className="h-full shrink-0 border-r border-slate-100/70"
                />
              ))}
            </div>

            {/* Today vertical line */}
            {todayLeft !== null && (
              <div
                style={{ left: `${todayLeft}px` }}
                className="absolute top-0 bottom-0 z-20 pointer-events-none border-l-2 border-rose-500"
              >
                <div className="bg-rose-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-sm shadow-xs -translate-x-1/2 whitespace-nowrap">
                  Today
                </div>
              </div>
            )}

            {/* Gantt Bar Rows */}
            <div className="divide-y divide-slate-100">
              {timelineItems.map((item) => {
                const { left, width } = getPosition(item.startDate, item.endDate)
                const colors = getBarColors(item.status, item.isProject)

                return (
                  <div
                    key={item.id}
                    className={`h-11 relative flex items-center transition-colors ${
                      item.isProject ? 'bg-slate-50/30' : 'hover:bg-blue-50/20'
                    }`}
                  >
                    {/* The Gantt Bar */}
                    <div
                      style={{
                        left: `${left}px`,
                        width: `${width}px`,
                      }}
                      className={`absolute h-7 rounded-md cursor-pointer transition-all hover:ring-2 hover:ring-blue-400/50 flex items-center overflow-hidden shadow-xs ${colors.bg}`}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setHoveredItem({
                          item,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        })
                      }}
                      onMouseLeave={() => setHoveredItem(null)}
                      onClick={() => {
                        if (item.isProject && onSelectProject) {
                          onSelectProject(item.projectId)
                        } else if (!item.isProject && isAdmin && onEditTask) {
                          const proj = projects.find((p) => p.id === item.projectId)
                          const taskObj = proj?.tasks.find((t) => t.id === item.id)
                          if (taskObj) onEditTask(item.projectId, taskObj)
                        }
                      }}
                    >
                      {/* Inner Progress fill */}
                      <div
                        style={{ width: `${item.progress}%` }}
                        className={`h-full transition-all ${colors.fill}`}
                      />

                      {/* Percentage and name label inside bar */}
                      <div
                        className={`absolute inset-0 px-2 flex items-center justify-between text-[11px] whitespace-nowrap overflow-hidden pointer-events-none ${colors.text}`}
                      >
                        <span className="truncate pr-1">
                          {item.isProject ? item.name : `${item.progress}%`}
                        </span>
                        {item.isProject && (
                          <span className="font-semibold">{item.progress}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredItem && (
        <div
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full mb-2 bg-slate-900/95 text-white p-3 rounded-lg shadow-xl text-xs backdrop-blur-xs max-w-xs border border-slate-700 animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: `${hoveredItem.x}px`,
            top: `${hoveredItem.y - 8}px`,
          }}
        >
          <div className="font-semibold text-white text-sm mb-1">
            {hoveredItem.item.name}
          </div>
          <div className="space-y-1 text-slate-300">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Owner:</span>
              <span className="font-medium text-white">{hoveredItem.item.owner || 'Unassigned'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Dates:</span>
              <span className="font-medium text-white">
                {formatDateDisplay(hoveredItem.item.startDate)} →{' '}
                {formatDateDisplay(hoveredItem.item.endDate)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Progress:</span>
              <span className="font-medium text-white">{hoveredItem.item.progress}%</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Status:</span>
              <span className="font-medium capitalize text-blue-300">
                {getStatusLabel(hoveredItem.item.status)}
              </span>
            </div>
            {hoveredItem.item.notes && (
              <div className="pt-1.5 border-t border-slate-700/80 text-[11px] text-slate-300 italic">
                "{hoveredItem.item.notes}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
