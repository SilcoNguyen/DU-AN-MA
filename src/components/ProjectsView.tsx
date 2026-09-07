import React, { useState, useMemo } from 'react'
import type { Project } from '../types'
import {
  formatDateDisplay,
  getStatusBadgeStyle,
  getStatusLabel,
  getProgressBarColor,
} from '../utils/helpers'
import {
  Search,
  Plus,
  Calendar,
  User,
  ArrowRight,
  Edit2,
  Trash2,
} from 'lucide-react'

interface ProjectsViewProps {
  projects: Project[]
  onSelectProject: (projectId: string) => void
  onNewProject: () => void
  onEditProject: (project: Project) => void
  onDeleteProject: (projectId: string) => void
  isAdmin: boolean
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  onSelectProject,
  onNewProject,
  onEditProject,
  onDeleteProject,
  isAdmin,
}) => {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.owner.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || p.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [projects, search, statusFilter])

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">All Projects</h2>
          <p className="text-xs text-slate-500">
            Manage projects, timelines, and execution status
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={onNewProject}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        {/* Status filter pills */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'on-track', label: 'On Track' },
            { id: 'at-risk', label: 'At Risk' },
            { id: 'delayed', label: 'Delayed' },
            { id: 'completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((project) => {
          const badge = getStatusBadgeStyle(project.status)
          return (
            <div
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                    {project.name}
                  </h3>
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

                {project.notes && (
                  <p className="mt-2 text-xs text-slate-500 line-clamp-2 italic">
                    "{project.notes}"
                  </p>
                )}
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
                  <div
                    className="flex items-center space-x-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => onEditProject(project)}
                          className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                          title="Edit Project"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete project "${project.name}"?`)) {
                              onDeleteProject(project.id)
                            }
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <span
                      onClick={() => onSelectProject(project.id)}
                      className="text-blue-600 font-medium flex items-center space-x-0.5 hover:underline ml-1 cursor-pointer"
                    >
                      <span>Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            No projects found matching your criteria.
          </div>
        )}
      </div>
    </div>
  )
}
