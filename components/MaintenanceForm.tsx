'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Building, MaintenanceLog, MAINTENANCE_ITEMS, MaintenanceItem } from '@/lib/types'

interface MaintenanceFormProps {
  buildings: Building[]
}

const itemEmojis: Record<string, string> = {
  계단청소: '🧹',
  화장실청소: '🚿',
  분리수거: '♻️',
  방역: '🦟',
  방향제: '🌸',
  포충기: '💡',
  창틀청소: '🪟',
  바닥청소: '🧽',
  입주청소: '🏠',
  도배: '🖌️',
  입실: '🔑',
  퇴실: '🚪',
  철거: '🔨',
  시설관리: '🔧',
}

export default function MaintenanceForm({ buildings }: MaintenanceFormProps) {
  const today = new Date().toISOString().split('T')[0]

  const [selectedBuilding, setSelectedBuilding] = useState(buildings[0]?.id || '')
  const [selectedDate, setSelectedDate] = useState(today)
  const [checkedItems, setCheckedItems] = useState<Record<MaintenanceItem, boolean>>(
    Object.fromEntries(MAINTENANCE_ITEMS.map((item) => [item, false])) as Record<MaintenanceItem, boolean>
  )
  const [specialNote, setSpecialNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingLog, setExistingLog] = useState<MaintenanceLog | null>(null)
  const [unreadMemos, setUnreadMemos] = useState<Record<string, number>>({})

  // 기존 로그 불러오기
  useEffect(() => {
    if (!selectedBuilding || !selectedDate) return
    const loadExisting = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('maintenance_logs')
        .select('*')
        .eq('building_id', selectedBuilding)
        .eq('date', selectedDate)
        .single()

      if (data) {
        setExistingLog(data)
        const newChecked = Object.fromEntries(
          MAINTENANCE_ITEMS.map((item) => [item, data[item] ?? false])
        ) as Record<MaintenanceItem, boolean>
        setCheckedItems(newChecked)
        setSpecialNote(data.특이사항 || '')
      } else {
        setExistingLog(null)
        setCheckedItems(Object.fromEntries(MAINTENANCE_ITEMS.map((item) => [item, false])) as Record<MaintenanceItem, boolean>)
        setSpecialNote('')
      }
    }
    loadExisting()
  }, [selectedBuilding, selectedDate])

  // 읽지 않은 메모 수 불러오기
  useEffect(() => {
    const loadUnread = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('memos')
        .select('building_id')
        .eq('is_read', false)

      if (data) {
        const counts: Record<string, number> = {}
        data.forEach((m: { building_id: string }) => {
          counts[m.building_id] = (counts[m.building_id] || 0) + 1
        })
        setUnreadMemos(counts)
      }
    }
    loadUnread()
  }, [])

  const toggleItem = (item: MaintenanceItem) => {
    setCheckedItems((prev) => ({ ...prev, [item]: !prev[item] }))
  }

  const handleSelectAll = () => {
    const allChecked = MAINTENANCE_ITEMS.every((item) => checkedItems[item])
    setCheckedItems(Object.fromEntries(MAINTENANCE_ITEMS.map((item) => [item, !allChecked])) as Record<MaintenanceItem, boolean>)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const payload = {
      building_id: selectedBuilding,
      date: selectedDate,
      ...checkedItems,
      특이사항: specialNote || null,
      created_by: user?.id,
    }

    let err
    if (existingLog) {
      const { error: updateErr } = await supabase
        .from('maintenance_logs')
        .update(payload)
        .eq('id', existingLog.id)
      err = updateErr
    } else {
      const { error: insertErr } = await supabase
        .from('maintenance_logs')
        .insert(payload)
      err = insertErr
    }

    setLoading(false)
    if (err) {
      setError('저장 중 오류가 발생했습니다: ' + err.message)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  const selectedBuildingData = buildings.find((b) => b.id === selectedBuilding)
  const totalUnread = Object.values(unreadMemos).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6">
      {/* 알림 배지 */}
      {totalUnread > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800">읽지 않은 메모 {totalUnread}건</p>
            <p className="text-xs text-amber-600">건물주 메모를 확인하세요</p>
          </div>
          <a href="/dashboard/memos" className="ml-auto text-sm font-medium text-amber-700 hover:text-amber-900 underline">
            확인하기
          </a>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 건물 및 날짜 선택 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            건물 및 날짜 선택
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">건물 선택</label>
              <div className="relative">
                <select
                  value={selectedBuilding}
                  onChange={(e) => setSelectedBuilding(e.target.value)}
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none appearance-none bg-white text-slate-800"
                >
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                      {unreadMemos[b.id] ? ` (메모 ${unreadMemos[b.id]}건)` : ''}
                    </option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {selectedBuildingData?.address && (
                <p className="text-xs text-slate-500 mt-1 pl-1">{selectedBuildingData.address}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">날짜 선택</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-800"
              />
            </div>
          </div>

          {existingLog && (
            <div className="mt-3 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              이미 등록된 내역이 있습니다. 수정 후 저장하면 업데이트됩니다.
            </div>
          )}
        </div>

        {/* 관리 항목 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              관리 항목
            </h2>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {MAINTENANCE_ITEMS.every((item) => checkedItems[item]) ? '전체 해제' : '전체 선택'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {MAINTENANCE_ITEMS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggleItem(item)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 transition font-medium text-sm ${
                  checkedItems[item]
                    ? 'bg-green-50 border-green-400 text-green-700'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span className="text-lg">{itemEmojis[item]}</span>
                <span>{item}</span>
                {checkedItems[item] && (
                  <svg className="w-4 h-4 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          <div className="mt-3 text-sm text-slate-500">
            {MAINTENANCE_ITEMS.filter((item) => checkedItems[item]).length} / {MAINTENANCE_ITEMS.length}개 선택됨
          </div>
        </div>

        {/* 특이사항 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            특이사항
          </h2>
          <textarea
            value={specialNote}
            onChange={(e) => setSpecialNote(e.target.value)}
            placeholder="특이사항이 있으면 입력하세요 (선택)"
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* 저장 버튼 */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            관리 내역이 성공적으로 저장되었습니다.
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3.5 px-6 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-md shadow-blue-200"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              저장 중...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {existingLog ? '수정 저장' : '관리 내역 저장'}
            </>
          )}
        </button>
      </form>
    </div>
  )
}
