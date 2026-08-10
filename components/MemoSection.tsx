'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Memo } from '@/lib/types'

interface MemoSectionProps {
  memos: Memo[]
  buildingId: string
  isAdmin: boolean
  currentUserId: string
}

export default function MemoSection({ memos: initialMemos, buildingId, isAdmin, currentUserId }: MemoSectionProps) {
  const [memos, setMemos] = useState(initialMemos)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: insertErr } = await supabase
      .from('memos')
      .insert({
        building_id: buildingId,
        content: content.trim(),
        created_by: currentUserId,
      })
      .select()
      .single()

    setLoading(false)
    if (insertErr) {
      setError('메모 등록 중 오류가 발생했습니다.')
    } else if (data) {
      setMemos([data, ...memos])
      setContent('')
    }
  }

  const handleMarkRead = async (memoId: string) => {
    const supabase = createClient()
    await supabase.from('memos').update({ is_read: true }).eq('id', memoId)
    setMemos((prev) => prev.map((m) => m.id === memoId ? { ...m, is_read: true } : m))
  }

  const handleDelete = async (memoId: string) => {
    if (!confirm('이 메모를 삭제하시겠습니까?')) return
    const supabase = createClient()
    await supabase.from('memos').delete().eq('id', memoId)
    setMemos((prev) => prev.filter((m) => m.id !== memoId))
  }

  const unreadCount = memos.filter((m) => !m.is_read).length

  return (
    <div className="space-y-6">
      {/* 메모 작성 (건물주만 가능) */}
      {!isAdmin && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            관리자에게 메모 보내기
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="관리자에게 전달할 내용을 입력하세요..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none text-slate-800 placeholder-slate-400"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold px-5 py-2.5 rounded-xl transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  전송 중...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  메모 보내기
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* 메모 목록 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            메모 목록
          </h3>
          {unreadCount > 0 && isAdmin && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
              미확인 {unreadCount}건
            </span>
          )}
        </div>

        {memos.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <p className="text-sm">등록된 메모가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {memos.map((memo) => (
              <div
                key={memo.id}
                className={`relative p-4 rounded-xl border transition ${
                  !memo.is_read && isAdmin
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                {!memo.is_read && isAdmin && (
                  <span className="absolute top-3 right-3 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                  </span>
                )}
                <p className="text-sm text-slate-700 leading-relaxed mb-2">{memo.content}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {new Date(memo.created_at).toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <div className="flex items-center gap-2">
                    {!memo.is_read && isAdmin && (
                      <button
                        onClick={() => handleMarkRead(memo.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        읽음 처리
                      </button>
                    )}
                    {(isAdmin || memo.created_by === currentUserId) && (
                      <button
                        onClick={() => handleDelete(memo.id)}
                        className="text-xs text-slate-400 hover:text-red-600 transition"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
