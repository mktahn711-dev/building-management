'use client'

import { useState } from 'react'
import { MaintenanceLog, MAINTENANCE_ITEMS } from '@/lib/types'
import MaintenanceDetail from './MaintenanceDetail'

interface CalendarProps {
  logs: MaintenanceLog[]
  buildingName?: string
  onMonthChange?: (year: number, month: number) => void
}

export default function Calendar({ logs, buildingName, onMonthChange }: CalendarProps) {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedLog, setSelectedLog] = useState<MaintenanceLog | null>(null)

  const year = currentYear
  const month = currentMonth

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const logMap = new Map<string, MaintenanceLog>()
  logs.forEach((log) => {
    logMap.set(log.date, log)
  })

  const prevMonth = () => {
    const newYear = month === 0 ? year - 1 : year
    const newMonth = month === 0 ? 11 : month - 1
    setCurrentYear(newYear)
    setCurrentMonth(newMonth)
    onMonthChange?.(newYear, newMonth)
  }

  const nextMonth = () => {
    const newYear = month === 11 ? year + 1 : year
    const newMonth = month === 11 ? 0 : month + 1
    setCurrentYear(newYear)
    setCurrentMonth(newMonth)
    onMonthChange?.(newYear, newMonth)
  }

  const getCompletedCount = (log: MaintenanceLog) => {
    return MAINTENANCE_ITEMS.filter((item) => log[item]).length
  }

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return (
    <div>
      {/* 캘린더 헤더 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-center">
              {buildingName && (
                <p className="text-blue-100 text-sm mb-0.5">{buildingName}</p>
              )}
              <h2 className="text-white font-bold text-xl">
                {year}년 {monthNames[month]}
              </h2>
            </div>
            <button
              onClick={nextMonth}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100">
          {dayNames.map((day, i) => (
            <div
              key={day}
              className={`py-2 text-center text-xs font-semibold ${
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-500'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="min-h-[80px] border-b border-r border-slate-100 bg-slate-50/50" />
            }

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const log = logMap.get(dateStr)
            const completedCount = log ? getCompletedCount(log) : 0
            const hasSpecial = log?.특이사항 && log.특이사항.trim() !== ''
            const isToday = dateStr === todayStr
            const dayOfWeek = (firstDay + day - 1) % 7

            return (
              <div
                key={day}
                onClick={() => log && setSelectedLog(log)}
                className={`min-h-[80px] p-2 border-b border-r border-slate-100 transition ${
                  log ? 'cursor-pointer hover:bg-slate-50' : ''
                } ${isToday ? 'bg-blue-50/50' : ''}`}
              >
                <div className="flex flex-col h-full">
                  <span
                    className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                      isToday
                        ? 'bg-blue-600 text-white'
                        : dayOfWeek === 0
                        ? 'text-red-500'
                        : dayOfWeek === 6
                        ? 'text-blue-600'
                        : 'text-slate-700'
                    }`}
                  >
                    {day}
                  </span>
                  {log && (
                    <div className="flex flex-col gap-1 mt-auto">
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium ${
                        completedCount === MAINTENANCE_ITEMS.length
                          ? 'bg-green-100 text-green-700'
                          : completedCount > 0
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          completedCount === MAINTENANCE_ITEMS.length
                            ? 'bg-green-500'
                            : completedCount > 0
                            ? 'bg-blue-500'
                            : 'bg-slate-400'
                        }`} />
                        <span className="hidden sm:block">{completedCount}/{MAINTENANCE_ITEMS.length}</span>
                        <span className="sm:hidden">{completedCount}</span>
                      </div>
                      {hasSpecial && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium bg-orange-100 text-orange-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span className="hidden sm:block">특이사항</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap items-center gap-4 mt-4 px-1">
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          전체 완료
        </div>
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          일부 완료
        </div>
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
          특이사항
        </div>
      </div>

      {/* 상세 모달 */}
      {selectedLog && (
        <MaintenanceDetail
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  )
}
