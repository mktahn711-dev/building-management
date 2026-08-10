'use client'

import { MaintenanceLog, MAINTENANCE_ITEMS } from '@/lib/types'

interface MaintenanceDetailProps {
  log: MaintenanceLog
  onClose: () => void
}

const itemEmojis: Record<string, string> = {
  계단청소: '🧹',
  화장실청소: '🚿',
  분리수거: '♻️',
  방역: '🦟',
  방향제: '🌸',
  포충기: '💡',
  창틀청소: '🪟',
}

export default function MaintenanceDetail({ log, onClose }: MaintenanceDetailProps) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const days = ['일', '월', '화', '수', '목', '금', '토']
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`
  }

  const completedItems = MAINTENANCE_ITEMS.filter((item) => log[item])
  const pendingItems = MAINTENANCE_ITEMS.filter((item) => !log[item])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 sticky top-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs mb-0.5">관리 내역</p>
              <h3 className="text-white font-bold text-lg">{formatDate(log.date)}</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* 완료 항목 */}
          {completedItems.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                완료된 항목 ({completedItems.length})
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {completedItems.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-xl"
                  >
                    <span className="text-base">{itemEmojis[item]}</span>
                    <span className="text-sm font-medium text-green-700">{item}</span>
                    <svg className="w-4 h-4 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 미완료 항목 */}
          {pendingItems.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  </svg>
                </span>
                미완료 항목 ({pendingItems.length})
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {pendingItems.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <span className="text-base opacity-50">{itemEmojis[item]}</span>
                    <span className="text-sm text-slate-400">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 특이사항 */}
          {log.특이사항 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </span>
                특이사항
              </h4>
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <p className="text-sm text-orange-800 leading-relaxed">{log.특이사항}</p>
              </div>
            </div>
          )}

          {/* 등록 시간 */}
          <div className="text-xs text-slate-400 border-t border-slate-100 pt-4">
            등록일시: {new Date(log.created_at).toLocaleString('ko-KR')}
          </div>
        </div>
      </div>
    </div>
  )
}
