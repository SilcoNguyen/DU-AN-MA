export type ProjectStatus = 'not-started' | 'on-track' | 'at-risk' | 'delayed' | 'completed'

export type TaskStatus = 'not-started' | 'on-track' | 'at-risk' | 'delayed' | 'completed'

export interface Task {
  id: string
  name: string
  owner: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  progress: number // 0 to 100
  status: TaskStatus
  notes?: string
}

export interface Project {
  id: string
  name: string
  owner: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  progress: number // 0 to 100
  status: ProjectStatus
  notes?: string
  tasks: Task[]
}

export interface ProjectsData {
  projects: Project[]
  lastUpdated: string
}

export type ActiveTab = 'dashboard' | 'projects' | 'gantt'
