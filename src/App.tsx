import { useState, useEffect, useCallback } from 'react'
import type { Project, Task, ProjectsData, ActiveTab } from './types'
import { loadProjectsData, saveProjectsData, checkAdminStatus } from './services/api'
import { DashboardView } from './components/DashboardView'
import { ProjectsView } from './components/ProjectsView'
import { GanttView } from './components/GanttView'
import { ProjectDetailView } from './components/ProjectDetailView'
import { ProjectModal } from './components/ProjectModal'
import { TaskModal } from './components/TaskModal'
import {
  LayoutDashboard,
  FolderKanban,
  Calendar,
  Plus,
  ShieldCheck,
  Eye,
  CheckCircle,
  AlertCircle,
  Menu,
  X,
  RefreshCw,
} from 'lucide-react'

export function App() {
  const [data, setData] = useState<ProjectsData>({
    projects: [],
    lastUpdated: new Date().toISOString(),
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [previewViewerMode, setPreviewViewerMode] = useState(false)

  // Navigation state
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Feedback notifications
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  // Modal states
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null)

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)
  const [taskModalProjectId, setTaskModalProjectId] = useState<string | null>(null)

  // Determine effective admin mode
  const effectiveIsAdmin = isAdmin && !previewViewerMode

  // Load initial data and check admin status
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [adminOk, loadedData] = await Promise.all([
        checkAdminStatus(),
        loadProjectsData(),
      ])
      setIsAdmin(adminOk)
      setData(loadedData)
      setError(null)
    } catch (err: any) {
      console.error('Data load error:', err)
      setError(err.message || 'Failed to load project database')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Save changes to local database
  const persistChanges = async (newData: ProjectsData, successMsg: string) => {
    setData(newData)
    if (effectiveIsAdmin) {
      try {
        const res = await saveProjectsData(newData)
        setData((prev) => ({ ...prev, lastUpdated: res.lastUpdated }))
        showNotification(successMsg)
      } catch (err: any) {
        console.error('Save error:', err)
        showNotification(`Error saving to file: ${err.message}`)
      }
    }
  }

  const showNotification = (msg: string) => {
    setSaveStatus(msg)
    setTimeout(() => {
      setSaveStatus(null)
    }, 3500)
  }

  // --- Project CRUD ---
  const handleSaveProject = (project: Project, isNew: boolean) => {
    let updatedProjects: Project[]
    if (isNew) {
      updatedProjects = [project, ...data.projects]
    } else {
      updatedProjects = data.projects.map((p) => (p.id === project.id ? project : p))
    }

    const newData: ProjectsData = {
      ...data,
      projects: updatedProjects,
    }
    persistChanges(
      newData,
      isNew ? `Project "${project.name}" created!` : `Project "${project.name}" updated!`
    )
  }

  const handleDeleteProject = (projectId: string) => {
    const proj = data.projects.find((p) => p.id === projectId)
    const updatedProjects = data.projects.filter((p) => p.id !== projectId)
    const newData: ProjectsData = {
      ...data,
      projects: updatedProjects,
    }

    if (selectedProjectId === projectId) {
      setSelectedProjectId(null)
    }

    persistChanges(newData, `Deleted project "${proj?.name || projectId}"`)
  }

  // --- Task CRUD ---
  const handleSaveTask = (task: Task, isNew: boolean) => {
    if (!taskModalProjectId) return
    const project = data.projects.find((p) => p.id === taskModalProjectId)
    if (!project) return

    let updatedTasks: Task[]
    if (isNew) {
      updatedTasks = [...(project.tasks || []), task]
    } else {
      updatedTasks = (project.tasks || []).map((t) => (t.id === task.id ? task : t))
    }

    // Recalculate average progress for the project
    const totalProg = updatedTasks.reduce((sum, t) => sum + (Number(t.progress) || 0), 0)
    const avgProg = updatedTasks.length > 0 ? Math.round(totalProg / updatedTasks.length) : project.progress

    const updatedProject: Project = {
      ...project,
      progress: avgProg,
      tasks: updatedTasks,
    }

    const updatedProjects = data.projects.map((p) =>
      p.id === taskModalProjectId ? updatedProject : p
    )

    const newData: ProjectsData = {
      ...data,
      projects: updatedProjects,
    }

    persistChanges(
      newData,
      isNew ? `Added task "${task.name}"` : `Updated task "${task.name}"`
    )
  }

  const handleDeleteTask = (projectId: string, taskId: string) => {
    const project = data.projects.find((p) => p.id === projectId)
    if (!project) return

    const updatedTasks = (project.tasks || []).filter((t) => t.id !== taskId)
    const totalProg = updatedTasks.reduce((sum, t) => sum + (Number(t.progress) || 0), 0)
    const avgProg = updatedTasks.length > 0 ? Math.round(totalProg / updatedTasks.length) : 0

    const updatedProject: Project = {
      ...project,
      progress: avgProg,
      tasks: updatedTasks,
    }

    const updatedProjects = data.projects.map((p) =>
      p.id === projectId ? updatedProject : p
    )

    const newData: ProjectsData = {
      ...data,
      projects: updatedProjects,
    }

    persistChanges(newData, 'Task deleted successfully')
  }

  // Modal Triggers
  const openNewProjectModal = () => {
    setProjectToEdit(null)
    setIsProjectModalOpen(true)
  }

  const openEditProjectModal = (proj: Project) => {
    setProjectToEdit(proj)
    setIsProjectModalOpen(true)
  }

  const openAddTaskModal = (projectId: string) => {
    setTaskModalProjectId(projectId)
    setTaskToEdit(null)
    setIsTaskModalOpen(true)
  }

  const openEditTaskModal = (projectId: string, task: Task) => {
    setTaskModalProjectId(projectId)
    setTaskToEdit(task)
    setIsTaskModalOpen(true)
  }

  // Selected project for detail view
  const currentSelectedProject = selectedProjectId
    ? data.projects.find((p) => p.id === selectedProjectId) || null
    : null

  // Format last published string
  const formatLastPublished = (iso: string) => {
    if (!iso) return 'Not yet published'
    try {
      const d = new Date(iso)
      return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50/50 text-slate-800">
      {/* Save Notification Toast */}
      {saveStatus && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white shadow-2xl text-xs font-medium border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* LEFT SIDEBAR (Desktop) */}
      <aside className="w-64 bg-white border-r border-slate-200 shrink-0 hidden md:flex md:flex-col justify-between select-none">
        <div>
          {/* Logo */}
          <div className="h-16 px-6 flex items-center space-x-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-slate-900">
                Project Tracker
              </span>
            </div>
          </div>

          {/* Mode Pill */}
          <div className="px-5 pt-4 pb-2">
            {effectiveIsAdmin ? (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <span className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Local Admin</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            ) : (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                <span className="flex items-center space-x-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Public Viewer</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-500">
                  Static
                </span>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-2 space-y-1">
            <button
              type="button"
              onClick={() => {
                setSelectedProjectId(null)
                setActiveTab('dashboard')
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'dashboard' && !selectedProjectId
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedProjectId(null)
                setActiveTab('projects')
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'projects' && !selectedProjectId
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
              }`}
            >
              <FolderKanban className="w-4 h-4" />
              <span>Projects</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedProjectId(null)
                setActiveTab('gantt')
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'gantt' && !selectedProjectId
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Gantt</span>
            </button>
          </nav>
        </div>

        {/* Bottom Sidebar Info */}
        <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/40">
          {/* Admin toggle preview switch */}
          {isAdmin && (
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-semibold text-slate-700">Preview as Viewer</span>
                <input
                  type="checkbox"
                  checked={previewViewerMode}
                  onChange={(e) => setPreviewViewerMode(e.target.checked)}
                  className="rounded-sm border-slate-300 text-blue-600 cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                {previewViewerMode
                  ? 'Viewing as public read-only visitor'
                  : 'Switch to test public visitor view'}
              </p>
            </div>
          )}

          <div className="text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center justify-between">
              <span>Last Published:</span>
            </div>
            <div className="font-medium text-slate-700 truncate">
              {formatLastPublished(data.lastUpdated)}
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-slate-400 text-[10px]">
              <span>Version</span>
              <span>v1.0.0</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 bg-white border-b border-slate-200 z-40 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <FolderKanban className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-xs text-slate-900">Project Tracker</span>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex">
          <div className="w-64 bg-white h-full p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="font-bold text-sm text-slate-900">Project Tracker</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="mt-4 space-y-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProjectId(null)
                    setActiveTab('dashboard')
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-semibold ${
                    activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProjectId(null)
                    setActiveTab('projects')
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-semibold ${
                    activeTab === 'projects' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
                  }`}
                >
                  <FolderKanban className="w-4 h-4" />
                  <span>Projects</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProjectId(null)
                    setActiveTab('gantt')
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-semibold ${
                    activeTab === 'gantt' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Gantt</span>
                </button>
              </nav>
            </div>

            <div className="text-[11px] text-slate-400">
              Last Published: {formatLastPublished(data.lastUpdated)}
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto mt-14 md:mt-0">
        {/* Top Header Bar */}
        <header className="h-16 px-6 lg:px-8 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-base font-bold text-slate-900">
              {currentSelectedProject
                ? currentSelectedProject.name
                : activeTab === 'dashboard'
                ? 'Dashboard'
                : activeTab === 'projects'
                ? 'Projects Overview'
                : 'Master Gantt'}
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              {currentSelectedProject
                ? 'Project milestones and schedule'
                : 'Track your projects, stay on schedule.'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* User badge */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="w-6 h-6 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center">
                H
              </div>
              <span className="text-xs font-semibold text-slate-700">
                {effectiveIsAdmin ? 'Hi, Hoang' : 'Guest'}
              </span>
            </div>

            {/* New Project Button (ONLY in Local Admin Mode) */}
            {effectiveIsAdmin && (
              <button
                type="button"
                onClick={openNewProjectModal}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </button>
            )}
          </div>
        </header>

        {/* Body View Content */}
        <div className="p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <RefreshCw className="w-7 h-7 animate-spin text-blue-600" />
              <p className="text-xs font-medium">Loading project data...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs max-w-lg mx-auto">
              <div className="flex items-center space-x-2 font-bold text-sm mb-2">
                <AlertCircle className="w-4 h-4" />
                <span>Error loading data</span>
              </div>
              <p>{error}</p>
              <button
                type="button"
                onClick={fetchData}
                className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-medium hover:bg-rose-700"
              >
                Retry
              </button>
            </div>
          ) : currentSelectedProject ? (
            <ProjectDetailView
              project={currentSelectedProject}
              onBack={() => setSelectedProjectId(null)}
              onEditProject={openEditProjectModal}
              onAddTask={openAddTaskModal}
              onEditTask={openEditTaskModal}
              onDeleteTask={handleDeleteTask}
              isAdmin={effectiveIsAdmin}
            />
          ) : activeTab === 'dashboard' ? (
            <DashboardView
              projects={data.projects}
              onSelectProject={(id) => setSelectedProjectId(id)}
              onNewProject={openNewProjectModal}
              onEditProject={openEditProjectModal}
              onAddTask={openAddTaskModal}
              onEditTask={openEditTaskModal}
              isAdmin={effectiveIsAdmin}
            />
          ) : activeTab === 'projects' ? (
            <ProjectsView
              projects={data.projects}
              onSelectProject={(id) => setSelectedProjectId(id)}
              onNewProject={openNewProjectModal}
              onEditProject={openEditProjectModal}
              onDeleteProject={handleDeleteProject}
              isAdmin={effectiveIsAdmin}
            />
          ) : (
            <GanttView
              projects={data.projects}
              onSelectProject={(id) => setSelectedProjectId(id)}
              onEditTask={openEditTaskModal}
              isAdmin={effectiveIsAdmin}
            />
          )}
        </div>
      </main>

      {/* Project Add / Edit Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false)
          setProjectToEdit(null)
        }}
        onSave={handleSaveProject}
        onDelete={handleDeleteProject}
        projectToEdit={projectToEdit}
      />

      {/* Task Add / Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false)
          setTaskToEdit(null)
          setTaskModalProjectId(null)
        }}
        onSave={handleSaveTask}
        onDelete={(taskId) => {
          if (taskModalProjectId) {
            handleDeleteTask(taskModalProjectId, taskId)
          }
        }}
        taskToEdit={taskToEdit}
        projectName={
          data.projects.find((p) => p.id === taskModalProjectId)?.name || 'Project'
        }
        defaultStartDate={
          data.projects.find((p) => p.id === taskModalProjectId)?.startDate
        }
        defaultEndDate={
          data.projects.find((p) => p.id === taskModalProjectId)?.endDate
        }
      />
    </div>
  )
}

export default App
