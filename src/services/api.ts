import type { ProjectsData } from '../types'

const BASE_URL = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`

export async function checkAdminStatus(): Promise<boolean> {
  if (import.meta.env.PROD) {
    return false
  }

  try {
    const res = await fetch('/api/status', { method: 'GET' })
    if (res.ok) {
      const data = await res.json()
      return Boolean(data?.admin)
    }
  } catch {
    // If /api/status is not reachable, fallback to checking DEV mode
  }
  return Boolean(import.meta.env.DEV)
}

export async function loadProjectsData(): Promise<ProjectsData> {
  if (import.meta.env.DEV) {
    try {
      const res = await fetch('/api/projects', {
        headers: { Accept: 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        if (data && Array.isArray(data.projects)) {
          return data
        }
      }
    } catch {
      console.warn('Local API not responding, falling back to static projects.json')
    }
  }

  const staticUrl = `${BASE_URL}data/projects.json?t=${Date.now()}`
  const response = await fetch(staticUrl)
  if (!response.ok) {
    throw new Error(`Failed to load projects from ${staticUrl}: ${response.statusText}`)
  }
  return response.json()
}

export async function saveProjectsData(data: ProjectsData): Promise<{ success: boolean; lastUpdated: string }> {
  const updatedData: ProjectsData = {
    ...data,
    lastUpdated: new Date().toISOString(),
  }

  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatedData),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Save failed: ${errText || res.statusText}`)
  }

  const result = await res.json()
  return {
    success: true,
    lastUpdated: result.lastUpdated || updatedData.lastUpdated,
  }
}
