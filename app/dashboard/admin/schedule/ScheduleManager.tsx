'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Building, ScheduleEvent } from '@/lib/types'

interface ScheduleManagerProps {
  buildings: Building[]
  initialEvents: ScheduleEvent[]
}

const NO_BUILDING = '__none__'

export default function ScheduleManager({ buildings, initialEvents }: ScheduleManagerProps) {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [events, setEvents] = useState<ScheduleEvent[]>(initialEvents)
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // 추가/수정 폼 상태
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formTime, setFormTime] = useState('')
  const [formBuilding, setFormBuilding] = useState(NO_BUILDING)
  const [formAssignee, setFormAssignee] = useState('')
  const [formMemo, setFormMemo] = useState('')
  const [formRecurring, setFormRecurring] = useState(false)
  const [formRecurrenceUntil, setFormRecurrenceUntil] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const buildingMap = new Map(buildings.map((b) => [b.id, b.name]))

  const year = currentYear
  const month = currentMonth
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const eventsByDate = new Map<string, ScheduleEvent[]>()
  events.forEach((ev) => {
    const list = eventsByDate.get(ev.date) || []
    list.push(ev)
    eventsByDate.set(ev.date, list)
  })

  const loadMonth = async (y: number, m: number) => {
    setLoading(true)
    const supabase = createClient()
    const startOfMonth = `${y}-${String(m + 1).padStart(2, '0')}-01`
    const nextYear = m === 11 ? y + 1 : y
    const nextMonth = m === 11 ? 0 : m + 1
    const startOfNextMonth = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-01`

    const { data } = await supabase
      .from('schedule_events')
      .select('*')
      .gte('date', startOfMonth)
      .lt('date', startOfNextMonth)
      .order('time', { ascending: true, nullsFirst: false })

    setEvents(data || [])
    setLoading(false)
  }

  const prevMonth = () => {
    const newYear = month === 0 ? year - 1 : year
    const newMonth = month === 0 ? 11 : month - 1
    setCurrentYear(newYear)
    setCurrentMonth(newMonth)
    loadMonth(newYear, newMonth)
  }

  const nextMonthFn = () => {
    const newYear = month === 11 ? year + 1 : year
    const newMonth = month === 11 ? 0 : month + 1
    setCurrentYear(newYear)
    setCurrentMonth(newMonth)
    loadMonth(newYear, newMonth)
  }

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const openDay = (dateStr: string) => {
    setSelectedDate(dateStr)
    resetForm()
  }

  const resetForm = () => {
    setEditingId(null)
    setFormTitle('')
    setFormTime('')
    setFormBuilding(NO_BUILDING)
    setFormAssignee('')
    setFormMemo('')
    setFormRecurring(false)
    setFormRecurrenceUntil('')
    setFormError(null)
    setFormOpen(false)
  }

  const startEdit = (ev: ScheduleEvent) => {
    setEditingId(ev.id)
    setFormTitle(ev.title)
    setFormTime(ev.time ? ev.time.slice(0, 5) : '')
    setFormBuilding(ev.building_id || NO_BUILDING)
    setFormAssignee(ev.assignee || '')
    setFormMemo(ev.memo || '')
    setFormRecurring(false)
    setFormRecurrenceUntil('')
    setFormError(null)
    setFormOpen(true)
  }

  const startNew = () => {
    setEditingId(null)
    setFormTitle('')
    setFormTime('')
    setFormBuilding(NO_BUILDING)
    setFormAssignee('')
    setFormMemo('')
    setFormRecurring(false)
    setFormRecurrenceUntil('')
    setFormError(null)
    setFormOpen(true)
  }

  // YYYY-MM-DD 문자열에 7일 단위로 더해가며, until(포함)까지의 날짜 목록을 만든다
  const buildWeeklyDates = (start: string, until: string) => {
    const dates: string[] = []
    const cur = new Date(start + 'T00:00:00')
    const end = new Date(until + 'T00:00:00')
    while (cur <= end) {
      const y = cur.getFullYear()
      const m = String(cur.getMonth() + 1).padStart(2, '0')
      const d = String(cur.getDate()).padStart(2, '0')
      dates.push(`${y}-${m}-${d}`)
      cur.setDate(cur.getDate() + 7)
    }
    return dates
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !formTitle.trim()) return

    if (formRecurring && !formRecurrenceUntil) {
      setFormError('반복 종료일을 선택해주세요.')
      return
    }
    if (formRecurring && formRecurrenceUntil < selectedDate) {
      setFormError('반복 종료일은 시작일 이후여야 합니다.')
      return
    }

    setSaving(true)
    setFormError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const base = {
      time: formTime || null,
      title: formTitle.trim(),
      building_id: formBuilding === NO_BUILDING ? null : formBuilding,
      assignee: formAssignee.trim() || null,
      memo: formMemo.trim() || null,
      created_by: user?.id,
    }

    let error

    if (editingId) {
      const res = await supabase.from('schedule_events').update({ ...base, date: selectedDate }).eq('id', editingId)
      error = res.error
    } else if (formRecurring) {
      const dates = buildWeeklyDates(selectedDate, formRecurrenceUntil)
      const groupId = crypto.randomUUID()
      const rows = dates.map((date) => ({ ...base, date, recurrence_group_id: groupId }))
      const res = await supabase.from('schedule_events').insert(rows)
      error = res.error
    } else {
      const res = await supabase.from('schedule_events').insert({ ...base, date: selectedDate })
      error = res.error
    }

    setSaving(false)

    if (error) {
      setFormError('저장 중 오류가 발생했습니다: ' + error.message)
    } else {
      resetForm()
      loadMonth(currentYear, currentMonth)
    }
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from('schedule_events').delete().eq('id', id)
    loadMonth(currentYear, currentMonth)
  }

  const handleDeleteSeries = async (groupId: string) => {
    if (!confirm('이 반복 일정을 전체(과거·미래 포함) 삭제할까요?')) return
    const supabase = createClient()
    await supabase.from('schedule_events').delete().eq('recurrence_group_id', groupId)
    loadMonth(currentYear, currentMonth)
  }

  // 선택된 날짜가 바뀌면(달 이동 등으로) 목록도 최신화되도록
  useEffect(() => {
    if (selectedDate && !eventsByDate.has(selectedDate)) {
      // 빈 배열이어도 모달은 유지 (새 일정 추가용)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events])

  const selectedDayEvents = selectedDate ? (eventsByDate.get(selectedDate) || []) : []

  const formatSelectedDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const days = ['일', '월', '화', '수', '목', '금', '토']
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`
  }

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-white font-bold text-xl">{year}년 {monthNames[month]}</h2>
            <button onClick={nextMonthFn} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100">
          {dayNames.map((day, i) => (
            <div key={day} className={`py-2 text-center text-xs font-semibold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-500'}`}>
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="min-h-[92px] border-b border-r border-slate-100 bg-slate-50/50" />
            }
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayEvents = eventsByDate.get(dateStr) || []
            const isToday = dateStr === todayStr
            const dayOfWeek = (firstDay + day - 1) % 7

            return (
              <div
                key={day}
                onClick={() => openDay(dateStr)}
                className={`min-h-[92px] p-1.5 border-b border-r border-slate-100 cursor-pointer hover:bg-slate-50 transition ${isToday ? 'bg-blue-50/50' : ''}`}
              >
                <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                  isToday ? 'bg-blue-600 text-white' : dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-600' : 'text-slate-700'
                }`}>
                  {day}
                </span>
                <div className="flex flex-col gap-0.5">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <div key={ev.id} className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-medium truncate">
                      {ev.time && <span className="opacity-70">{ev.time.slice(0, 5)} </span>}
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="px-1.5 text-[10px] text-slate-400">+{dayEvents.length - 2}개 더</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-slate-600 mt-4 px-1">
        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
        등록된 일정
      </div>

      {/* 날짜 상세 / 일정 관리 모달 */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => { setSelectedDate(null); resetForm() }}>
          <div
            className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 sticky top-0 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">{formatSelectedDate(selectedDate)}</h3>
              <button onClick={() => { setSelectedDate(null); resetForm() }} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* 일정 목록 */}
              {!formOpen && (
                <>
                  {selectedDayEvents.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">등록된 일정이 없습니다.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedDayEvents.map((ev) => (
                        <div key={ev.id} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {ev.time && <span className="text-xs font-medium text-indigo-600">{ev.time.slice(0, 5)}</span>}
                              <span className="text-sm font-semibold text-slate-800">{ev.title}</span>
                              {ev.building_id && buildingMap.get(ev.building_id) && (
                                <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">{buildingMap.get(ev.building_id)}</span>
                              )}
                              {ev.assignee && (
                                <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">👤 {ev.assignee}</span>
                              )}
                              {ev.recurrence_group_id && (
                                <span className="text-[11px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 flex items-center gap-0.5">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  매주 반복
                                </span>
                              )}
                            </div>
                            {ev.memo && <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap">{ev.memo}</p>}
                            {ev.recurrence_group_id && (
                              <button
                                onClick={() => handleDeleteSeries(ev.recurrence_group_id!)}
                                className="text-[11px] text-red-500 hover:text-red-700 underline mt-1"
                              >
                                반복 일정 전체 삭제
                              </button>
                            )}
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => startEdit(ev)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button onClick={() => handleDelete(ev.id)} title="이 날짜만 삭제" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={startNew}
                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl py-3 text-slate-500 text-sm font-medium hover:border-blue-300 hover:bg-blue-50/50 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    새 일정 추가
                  </button>
                </>
              )}

              {/* 추가/수정 폼 */}
              {formOpen && (
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">제목 *</label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      required
                      placeholder="예: 소방점검, 임대 계약 미팅"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-800"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">시간</label>
                      <input
                        type="time"
                        value={formTime}
                        onChange={(e) => setFormTime(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">건물</label>
                      <select
                        value={formBuilding}
                        onChange={(e) => setFormBuilding(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-white text-slate-800"
                      >
                        <option value={NO_BUILDING}>전체 / 공통</option>
                        {buildings.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">담당자</label>
                    <input
                      type="text"
                      value={formAssignee}
                      onChange={(e) => setFormAssignee(e.target.value)}
                      placeholder="예: 김관리"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-800"
                    />
                  </div>

                  {!editingId && (
                    <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formRecurring}
                          onChange={(e) => setFormRecurring(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-slate-700">매주 반복</span>
                      </label>
                      {formRecurring && (
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-slate-600 mb-1.5">반복 종료일 (이 날짜까지 매주 등록)</label>
                          <input
                            type="date"
                            value={formRecurrenceUntil}
                            min={selectedDate || undefined}
                            onChange={(e) => setFormRecurrenceUntil(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-800"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">메모</label>
                    <textarea
                      value={formMemo}
                      onChange={(e) => setFormMemo(e.target.value)}
                      rows={3}
                      placeholder="상세 내용이 있으면 입력하세요 (선택)"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none text-slate-800"
                    />
                  </div>

                  {formError && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold"
                    >
                      {saving ? '저장 중...' : editingId ? '수정 저장' : formRecurring ? '반복 등록' : '추가'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
