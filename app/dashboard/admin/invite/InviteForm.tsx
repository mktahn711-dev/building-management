'use client'

import { useState } from 'react'

interface Building {
  id: string
  name: string
}

interface InviteFormProps {
  buildings: Building[]
}

export default function InviteForm({ buildings }: InviteFormProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [buildingId, setBuildingId] = useState(buildings[0]?.id || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(null)
    setWarning(null)
    setError(null)

    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, building_id: buildingId, name }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '초대 중 오류가 발생했습니다.')
      } else {
        setSuccess(data.message || '초대 이메일을 발송했습니다.')
        if (data.warning) setWarning(data.warning)
        // 폼 초기화
        setEmail('')
        setName('')
        setBuildingId(buildings[0]?.id || '')
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (buildings.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
        <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <p className="text-slate-500 font-medium">등록된 건물이 없습니다</p>
        <p className="text-slate-400 text-sm mt-1">먼저 건물을 등록한 후 건물주를 초대하세요</p>
        <a
          href="/dashboard/admin/buildings"
          className="inline-block mt-4 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition"
        >
          건물 관리로 이동
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        {/* 안내 박스 */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-0.5">초대 안내</p>
            <p className="text-blue-700">초대 이메일이 발송되면, 건물주가 이메일 링크를 클릭해 비밀번호를 설정하고 바로 로그인할 수 있습니다.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 이름 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
              건물주 이름 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="홍길동"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* 이메일 */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
              이메일 주소 <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="owner@example.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* 건물 선택 */}
          <div>
            <label htmlFor="building" className="block text-sm font-medium text-slate-700 mb-1.5">
              담당 건물 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="building"
                value={buildingId}
                onChange={(e) => setBuildingId(e.target.value)}
                required
                className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none appearance-none bg-white text-slate-800"
              >
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* 피드백 메시지 */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p>{success}</p>
                {warning && <p className="mt-1 text-amber-700">{warning}</p>}
              </div>
            </div>
          )}

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-md shadow-blue-200"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                초대 발송 중...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                초대 이메일 발송
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
