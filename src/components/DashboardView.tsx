import React, { useState, useMemo } from 'react'
import type { Project, Task } from '../types'
import { GanttChart } from './GanttChart'
import {
  formatDateDisplay,
  getStatusBadgeStyle,
  getStatusLabel,
  getProgressBarColor,
} from '../utils/helpers'
import {
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  User,
  ArrowRight,
  Plus,
  Calendar,
  MoreVertical,
  Activity,
} from 'lucide-react'

interface DashboardViewProps {
  projects: Project[]
  onSelectProject: (projectId: string) => void
  onNewProject: () => void
  onEditProject: (project: Project) => void
  onAddTask: (projectId: string) => void
  onEditTask: (projectId: string, task: Task) => void
  isAdmin: boolean
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  onSelectProject,
  onNewProject,
  onEditProject,
  onEditTask,
  isAdmin,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    projects.length > 0 ? projects[0].id : null
  )

  // Filtered projects for sidebar list
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects
    const q = searchQuery.toLowerCase()
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.owner.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q)
    )
  }, [projects, searchQuery])

  // Current active project for the right detail widget
  const activeProject = useMemo(() => {
    if (!selectedProjectId) return projects[0] || null
    return projects.find((p) => p.id === selectedProjectId) || projects[0] || null
  }, [projects, selectedProjectId])

  // Summary Metrics calculations
  const metrics = useMemo(() => {
    const total = projects.length
    const onTrack = projects.filter((p) => p.status === 'on-track').length
    const atRisk = projects.filter((p) => p.status === 'at-risk').length
    const delayed = projects.filter((p) => p.status === 'delayed').length
    const completed = projects.filter((p) => p.status === 'completed').length
    return { total, onTrack, atRisk, delayed, completed }
  }, [projects])

  // Recent task updates / milestones
  const recentUpdates = useMemo(() => {
    const list: {
      projectId: string
      projectName: string
      taskName: string
      progress: number
      date: string
      status: string
    }[] = []

    projects.forEach((p) => {
      p.tasks?.forEach((t) => {
        list.push({
          projectId: p.id,
          projectName: p.name,
          taskName: t.name,
          progress: t.progress,
          date: formatDateDisplay(t.startDate),
          status: t.status,
        })
      })
    })

    return list.slice(0, 4)
  }, [projects])

  // SVG Circular Progress values
  const circleRadius = 40
  const circleCircumference = 2 * Math.PI * circleRadius
  const activeProgress = activeProject?.progress || 0
  const strokeDashoffset = circleCircumference - (activeProgress / 100) * circleCircumference

  return (
    <div className="space-y-6">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Projects */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-slate-900">{metrics.total}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Total Projects</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FolderKanban className="w-5 h-5" />
          </div>
        </div>

        {/* On Track */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-emerald-600">{metrics.onTrack}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">On Track</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* At Risk */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-amber-500">{metrics.atRisk}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">At Risk</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Delayed */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-rose-600">{metrics.delayed}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Delayed</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Interactive Grid Section */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left column: Projects search & quick list (3 cols on xl) */}
        <div className="xl:col-span-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col h-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Projects</h3>
            <span className="text-xs text-slate-500 font-medium">{projects.length} total</span>
          </div>

          {/* Search bar */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          {/* Project List Items */}
          <div className="space-y-2 flex-1 overflow-y-auto max-h-[380px] pr-1">
            {filteredProjects.map((p) => {
              const badge = getStatusBadgeStyle(p.status)
              const isSelected = p.id === (activeProject?.id || '')

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/30 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`w-3 h-3 rounded-md shrink-0 ${badge.dot}`}
                      />
                      <span className="font-semibold text-xs text-slate-900 line-clamp-1">
                        {p.name}
                      </span>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditProject(p)
                        }}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-sm"
                        title="Edit Project"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">{p.progress}%</span>
                    <span className="flex items-center space-x-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      <span className="capitalize">{getStatusLabel(p.status)}</span>
                    </span>
                  </div>

                  {/* Mini progress bar */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                    <div
                      style={{ width: `${p.progress}%` }}
                      className={`h-full ${getProgressBarColor(p.status)}`}
                    />
                  </div>
                </div>
              )
            })}

            {filteredProjects.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-400">
                No projects match "{searchQuery}"
              </div>
            )}
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={onNewProject}
              className="mt-3 w-full py-2 px-3 rounded-lg border border-dashed border-blue-300 text-blue-600 hover:bg-blue-50/60 text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Project</span>
            </button>
          )}
        </div>

        {/* Center column: Gantt Chart widget (6 cols on xl) */}
        <div className="xl:col-span-6 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-900">Gantt Chart Timeline</h3>
            {activeProject && (
              <button
                type="button"
                onClick={() => onSelectProject(activeProject.id)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
              >
                <span>View Project Detail</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
          <GanttChart
            projects={projects}
            selectedProjectId={null}
            onSelectProject={onSelectProject}
            onEditTask={onEditTask}
            isAdmin={isAdmin}
          />
        </div>

        {/* Right column: Project Progress Gauge & Recent Updates (3 cols on xl) */}
        <div className="xl:col-span-3 space-y-4">
          {/* Progress Ring Card */}
          {activeProject ? (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col items-center text-center">
              <div className="w-full flex items-center justify-between mb-3 text-xs">
                <span className="font-semibold text-slate-700">Project Progress</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    getStatusBadgeStyle(activeProject.status).bg
                  } ${getStatusBadgeStyle(activeProject.status).border}`}
                >
                  {getStatusLabel(activeProject.status)}
                </span>
              </div>

              {/* Circular Gauge */}
              <div className="relative w-28 h-28 my-1 flex items-center justify-center">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r={circleRadius}
                    className="stroke-slate-100"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r={circleRadius}
                    className="stroke-blue-600 transition-all duration-500 ease-out"
                    strokeWidth="8"
                    strokeDasharray={circleCircumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {activeProject.progress}%
                  </span>
                </div>
              </div>

              <div className="font-bold text-sm text-slate-900 mt-2 line-clamp-1">
                {activeProject.name}
              </div>

              <div className="w-full mt-3 pt-3 border-t border-slate-100 text-xs space-y-1.5 text-left">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Owner:</span>
                  <span className="font-medium text-slate-900">{activeProject.owner}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Start Date:</span>
                  <span className="font-medium text-slate-900">
                    {formatDateDisplay(activeProject.startDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>End Date:</span>
                  <span className="font-medium text-slate-900">
                    {formatDateDisplay(activeProject.endDate)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectProject(activeProject.id)}
                className="mt-4 w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
              >
                <span>Open Project Detail</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs text-center text-xs text-slate-400">
              No project selected
            </div>
          )}

          {/* Recent Milestones Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 mb-3">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Recent Milestones</span>
            </div>
            <div className="space-y-2.5">
              {recentUpdates.map((u, i) => (
                <div
                  key={i}
                  className="text-xs p-2 rounded-lg bg-slate-50/70 border border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-100/60"
                  onClick={() => onSelectProject(u.projectId)}
                >
                  <div className="truncate pr-2">
                    <div className="font-medium text-slate-800 truncate">{u.taskName}</div>
                    <div className="text-[11px] text-slate-400 truncate">{u.projectName}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-blue-600">{u.progress}%</span>
                    <div className="text-[10px] text-slate-400">{u.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Projects Cards Overview */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">All Projects Overview</h3>
            <p className="text-xs text-slate-500">Track performance, timelines, and execution</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const badge = getStatusBadgeStyle(project.status)
            return (
              <div
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600">
                      {project.name}
                    </h4>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${badge.bg} ${badge.border}`}
                    >
                      {getStatusLabel(project.status)}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-slate-500 flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Owner:</span>
                    <span className="font-medium text-slate-700">{project.owner}</span>
                  </div>

                  <div className="mt-1 text-xs text-slate-500 flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {formatDateDisplay(project.startDate)} → {formatDateDisplay(project.endDate)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                    <span className="text-slate-600">Progress</span>
                    <span className="text-slate-900">{project.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${project.progress}%` }}
                      className={`h-full ${getProgressBarColor(project.status)}`}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{project.tasks?.length || 0} tasks</span>
                    <span className="text-blue-600 font-medium flex items-center space-x-0.5 hover:underline">
                      <span>View details</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
