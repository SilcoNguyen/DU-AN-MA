import React, { useState } from 'react'
import type { Project, Task } from '../types'
import { GanttChart } from './GanttChart'
import { Filter, Calendar } from 'lucide-react'

interface GanttViewProps {
  projects: Project[]
  onSelectProject: (projectId: string) => void
  onEditTask: (projectId: string, task: Task) => void
  isAdmin: boolean
}

export const GanttView: React.FC<GanttViewProps> = ({
  projects,
  onSelectProject,
  onEditTask,
  isAdmin,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Master Gantt Timeline</span>
          </h2>
          <p className="text-xs text-slate-500">
            Horizontal schedule visualization across all active manufacturing projects and tasks
          </p>
        </div>

        {/* Project selector filter */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedProjectId || ''}
            onChange={(e) => setSelectedProjectId(e.target.value || null)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          >
            <option value="">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <GanttChart
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={onSelectProject}
        onEditTask={onEditTask}
        isAdmin={isAdmin}
      />
    </div>
  )
}
