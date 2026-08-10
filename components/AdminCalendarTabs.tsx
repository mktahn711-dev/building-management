'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Calendar from './Calendar'
import { MaintenanceLog } from '@/lib/types'

interface Building {
  id: string
  name: string
  address: string | null
}

interface AdminCalendarTabsProps {
  buildings: Building[]
  initialLogs: MaintenanceLog[]
}

export default function AdminCalendarTabs({ buildings, initialLogs }: AdminCalendarTabsProps) {
  const [activeBuilding, setActiveBuilding] = useState(buildings[0]?.id || '')
  const [logs, setLogs] = useState<MaintenanceLog[]>(initialLogs)
  const [loading, setLoading] = useState(false)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())

  useEffect(() => {
    if (!activeBuilding) return
    const loadLogs = async () => {
      setLoading(true)
      const supabase = createClient()
      const startOfMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`
      const endOfMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-31`

      const { data } = await supabase
        .from('maintenance_logs')
        .select('*')
        .eq('building_id', activeBuilding)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)

      setLogs(data || [])
      setLoading(false)
    }
    loadLogs()
  }, [activeBuilding, currentYear, currentMonth])

  const activeData = buildings.find((b) => b.id === activeBuilding)

  return (
    <div>
      {/* 건물 탭 */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {buildings.map((building) => (
          <button
            key={building.id}
            onClick={() => setActiveBuilding(building.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeBuilding === building.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {building.name}
          </button>
        ))}
      </div>

      {/* 주소 표시 */}
      {activeData?.address && (
        <p className="text-sm text-slate-500 mb-4 flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {activeData.address}
        </p>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-slate-500 text-sm mt-3">로딩 중...</p>
        </div>
      ) : (
        <Calendar
          logs={logs}
          buildingName={activeData?.name}
          onMonthChange={(year, month) => {
            setCurrentYear(year)
            setCurrentMonth(month)
          }}
        />
      )}
    </div>
  )
}
