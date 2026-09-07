import React from 'react'
import type { Project, Task } from '../types'
import { GanttChart } from './GanttChart'
import {
  formatDateDisplay,
  formatDateShort,
  getStatusBadgeStyle,
  getStatusLabel,
  getProgressBarColor,
} from '../utils/helpers'
import {
  ArrowLeft,
  Calendar,
  User,
  Plus,
  Edit2,
  Trash2,
  ListTodo,
  FileText,
} from 'lucide-react'

interface ProjectDetailViewProps {
  project: Project
  onBack: () => void
  onEditProject: (project: Project) => void
  onAddTask: (projectId: string) => void
  onEditTask: (projectId: string, task: Task) => void
  onDeleteTask: (projectId: string, taskId: string) => void
  isAdmin: boolean
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  onBack,
  onEditProject,
  onAddTask,
  onEditTask,
  onDeleteTask,
  isAdmin,
}) => {
  const badge = getStatusBadgeStyle(project.status)

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Overview</span>
        </button>

        {isAdmin && (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => onEditProject(project)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Project</span>
            </button>
            <button
              type="button"
              onClick={() => onAddTask(project.id)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>
        )}
      </div>

      {/* Project Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${badge.bg} ${badge.border}`}
              >
                {getStatusLabel(project.status)}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-600">
              <div className="flex items-center space-x-1.5">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">Owner:</span>
                <span className="font-semibold text-slate-800">{project.owner}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">Timeline:</span>
                <span className="font-semibold text-slate-800">
                  {formatDateDisplay(project.startDate)} → {formatDateDisplay(project.endDate)}
                </span>
              </div>
            </div>

            {project.notes && (
              <div className="mt-3 flex items-start space-x-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 max-w-2xl">
                <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="italic">{project.notes}</p>
              </div>
            )}
          </div>

          {/* Progress gauge summary */}
          <div className="md:text-right min-w-[180px] p-4 bg-slate-50/70 rounded-xl border border-slate-100">
            <div className="text-xs text-slate-500 font-medium mb-1">Overall Progress</div>
            <div className="text-3xl font-extrabold text-blue-600">{project.progress}%</div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
              <div
                style={{ width: `${project.progress}%` }}
                className={`h-full ${getProgressBarColor(project.status)}`}
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5">
              {project.tasks?.filter((t) => t.status === 'completed').length || 0} of{' '}
              {project.tasks?.length || 0} tasks completed
            </div>
          </div>
        </div>
      </div>

      {/* Task Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ListTodo className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Project Tasks</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
              {project.tasks?.length || 0}
            </span>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => onAddTask(project.id)}
              className="inline-flex items-center space-x-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          )}
        </div>

        {/* The Task Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-6">Task</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">Start</th>
                <th className="py-3 px-4">End</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-4">Status</th>
                {isAdmin && <th className="py-3 px-6 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {project.tasks && project.tasks.length > 0 ? (
                project.tasks.map((task) => {
                  const taskBadge = getStatusBadgeStyle(task.status)
                  return (
                    <tr
                      key={task.id}
                      onClick={() => isAdmin && onEditTask(project.id, task)}
                      className={`group transition-colors ${
                        isAdmin ? 'cursor-pointer hover:bg-blue-50/30' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <td className="py-3.5 px-6 font-medium text-slate-900">
                        <div>{task.name}</div>
                        {task.notes && (
                          <div className="text-[11px] text-slate-400 italic line-clamp-1">
                            {task.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="inline-flex items-center space-x-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{task.owner || '-'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {formatDateShort(task.startDate)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {formatDateShort(task.endDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-800 w-8">{task.progress}%</span>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${task.progress}%` }}
                              className={`h-full ${getProgressBarColor(task.status)}`}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${taskBadge.bg} ${taskBadge.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${taskBadge.dot}`} />
                          {getStatusLabel(task.status)}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-6 text-right">
                          <div
                            className="inline-flex items-center space-x-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => onEditTask(project.id, task)}
                              className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit Task"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Delete task "${task.name}"?`)) {
                                  onDeleteTask(project.id, task.id)
                                }
                              }}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td
                    colSpan={isAdmin ? 7 : 6}
                    className="py-8 text-center text-slate-400 text-xs"
                  >
                    No tasks added yet for this project.
                    {isAdmin && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => onAddTask(project.id)}
                          className="text-blue-600 font-semibold hover:underline"
                        >
                          + Add your first task
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Gantt Timeline */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3">Project Timeline Gantt</h3>
        <GanttChart
          projects={[project]}
          selectedProjectId={project.id}
          onEditTask={onEditTask}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  )
}
