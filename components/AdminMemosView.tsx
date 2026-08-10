'use client'

import { useState } from 'react'
import MemoSection from './MemoSection'
import { Memo } from '@/lib/types'

interface Building {
  id: string
  name: string
}

interface AdminMemosViewProps {
  buildings: Building[]
  allMemos: (Memo & { buildings?: { name: string } | null })[]
  currentUserId: string
}

export default function AdminMemosView({ buildings, allMemos, currentUserId }: AdminMemosViewProps) {
  const [activeBuilding, setActiveBuilding] = useState(buildings[0]?.id || '')

  const filteredMemos = allMemos.filter((m) => m.building_id === activeBuilding)
  const unreadCountByBuilding = buildings.reduce((acc, b) => {
    acc[b.id] = allMemos.filter((m) => m.building_id === b.id && !m.is_read).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div>
      {/* 건물 탭 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {buildings.map((building) => (
          <button
            key={building.id}
            onClick={() => setActiveBuilding(building.id)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeBuilding === building.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {building.name}
            {unreadCountByBuilding[building.id] > 0 && (
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                activeBuilding === building.id ? 'bg-white text-blue-600' : 'bg-red-500 text-white'
              }`}>
                {unreadCountByBuilding[building.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      <MemoSection
        memos={filteredMemos}
        buildingId={activeBuilding}
        isAdmin={true}
        currentUserId={currentUserId}
      />
    </div>
  )
}
