'use client'

import { useState } from 'react'

export interface Team {
  id: string
  name: string
  category: string
  gender: string
  seasonId: string
  athleteCount: number
  createdAt: string
}

const STORAGE_KEY = 'hb_tracking_teams'

const DEFAULT_TEAMS: Team[] = [
  {
    id: '1',
    name: 'Sub-16 Feminino',
    category: 'sub16',
    gender: 'feminino',
    seasonId: '2024-2025',
    athleteCount: 18,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Sub-18 Feminino',
    category: 'sub18',
    gender: 'feminino',
    seasonId: '2024-2025',
    athleteCount: 15,
    createdAt: '2024-01-20',
  },
]

export function useTeams() {
  const [teams] = useState<Team[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          return JSON.parse(stored) as Team[]
        } catch (e) {
          console.error('Erro ao carregar equipes:', e)
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TEAMS))
    }
    return DEFAULT_TEAMS
  })

  return teams
}
