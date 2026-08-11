'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import MemoSection from './MemoSection'
import { Memo } from '@/lib/types'

interface Building {
  id: string
  name: string
}

interface AdminMemosViewProps {
  buildings: Building[]
  currentUserId: string
}

export default function AdminMemosView({ buildings, currentUserId }: AdminMemosViewProps) {
  const [activeBuilding, setActiveBuilding] = useState(buildings[0]?.id || '')
  const [memosByBuilding, setMemosByBuilding] = useState<Record<string, Memo[]>>({})
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)

  // 선택된 건물의 메모 로드
  useEffect(() => {
    if (!activeBuilding) return
    if (memosByBuilding[activeBuilding] !== undefined) return // 이미 로드됨

    const loadMemos = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('memos')
        .select('*')
        .eq('building_id', activeBuilding)
        .order('created_at', { ascending: false })
      setMemosByBuilding((prev) => ({ ...prev, [activeBuilding]: data || [] }))
      setLoading(false)
    }
    loadMemos()
  }, [activeBuilding, memosByBuilding])

  // 전체 미읽음 수 로드
  useEffect(() => {
    const loadUnread = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('memos')
        .select('building_id, is_read')
        .eq('is_read', false)

      const counts: Record<string, number> = {}
      data?.forEach((m: { building_id: string }) => {
        counts[m.building_id] = (counts[m.building_id] || 0) + 1
      })
      setUnreadCounts(counts)
    }
    loadUnread()
  }, [])

  const currentMemos = memosByBuilding[activeBuilding] || []

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
            {unreadCounts[building.id] > 0 && (
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                activeBuilding === building.id ? 'bg-white text-blue-600' : 'bg-red-500 text-white'
              }`}>
                {unreadCounts[building.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : (
        <MemoSection
          memos={currentMemos}
          buildingId={activeBuilding}
          isAdmin={true}
          currentUserId={currentUserId}
        />
      )}
    </div>
  )
}
