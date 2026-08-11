'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Building } from '@/lib/types'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ace-management.netlify.app'

interface BuildingsManagerProps {
  initialBuildings: Building[]
}

export default function BuildingsManager({ initialBuildings }: BuildingsManagerProps) {
  const [buildings, setBuildings] = useState<Building[]>(initialBuildings)
  const [newName, setNewName] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [addSuccess, setAddSuccess] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [qrBuildingId, setQrBuildingId] = useState<string | null>(null)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddLoading(true)
    setAddError(null)
    setAddSuccess(false)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('buildings')
      .insert({ name: newName.trim(), address: newAddress.trim() || null })
      .select()
      .single()

    setAddLoading(false)

    if (error) {
      setAddError('건물 추가 중 오류가 발생했습니다: ' + error.message)
    } else {
      setBuildings((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setNewName('')
      setNewAddress('')
      setAddSuccess(true)
      setTimeout(() => setAddSuccess(false), 3000)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    setDeleteError(null)

    const supabase = createClient()

    // 이 건물에 연결된 profiles가 있는지 확인
    const { count: profileCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('building_id', id)

    if (profileCount && profileCount > 0) {
      setDeleteError('이 건물에 등록된 건물주가 있어 삭제할 수 없습니다. 먼저 건물주를 다른 건물로 이동하거나 삭제해주세요.')
      setDeletingId(null)
      setConfirmDeleteId(null)
      return
    }

    const { error } = await supabase.from('buildings').delete().eq('id', id)

    setDeletingId(null)
    setConfirmDeleteId(null)

    if (error) {
      setDeleteError('삭제 중 오류가 발생했습니다: ' + error.message)
    } else {
      setBuildings((prev) => prev.filter((b) => b.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      {/* 건물 추가 폼 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 건물 추가
        </h2>

        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="building-name" className="block text-sm font-medium text-slate-700 mb-1.5">
                건물 이름 <span className="text-red-500">*</span>
              </label>
              <input
                id="building-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                placeholder="예) 강남 오피스텔"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-slate-800 placeholder-slate-400"
              />
            </div>
            <div>
              <label htmlFor="building-address" className="block text-sm font-medium text-slate-700 mb-1.5">
                주소 <span className="text-slate-400 font-normal text-xs">(선택)</span>
              </label>
              <input
                id="building-address"
                type="text"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="예) 서울시 강남구 테헤란로 123"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>

          {addError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {addError}
            </div>
          )}

          {addSuccess && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              건물이 추가되었습니다.
            </div>
          )}

          <button
            type="submit"
            disabled={addLoading || !newName.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-xl transition duration-200 flex items-center gap-2 shadow-md shadow-blue-200"
          >
            {addLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                추가 중...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                건물 추가
              </>
            )}
          </button>
        </form>
      </div>

      {/* 건물 목록 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          등록된 건물 목록
          <span className="ml-auto text-sm font-normal text-slate-400">{buildings.length}개</span>
        </h2>

        {deleteError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {deleteError}
          </div>
        )}

        {buildings.length === 0 ? (
          <div className="py-12 text-center">
            <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-slate-500 font-medium">등록된 건물이 없습니다</p>
            <p className="text-slate-400 text-sm mt-1">위 폼에서 첫 번째 건물을 추가해보세요</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {buildings.map((building) => (
              <li key={building.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 truncate">{building.name}</p>
                      {building.address && (
                        <p className="text-sm text-slate-500 truncate">{building.address}</p>
                      )}
                    </div>
                  </div>

                  {/* 버튼 영역 */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {/* QR코드 버튼 */}
                    <button
                      onClick={() => setQrBuildingId(qrBuildingId === building.id ? null : building.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      QR
                    </button>

                    {/* 삭제 버튼 / 확인 */}
                    {confirmDeleteId === building.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">정말 삭제할까요?</span>
                        <button
                          onClick={() => handleDelete(building.id)}
                          disabled={deletingId === building.id}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition disabled:bg-red-400"
                        >
                          {deletingId === building.id ? '삭제 중...' : '확인'}
                        </button>
                        <button
                          onClick={() => { setConfirmDeleteId(null); setDeleteError(null) }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setConfirmDeleteId(building.id); setDeleteError(null) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        삭제
                      </button>
                    )}
                  </div>
                </div>
                {/* QR코드 패널 */}
                {qrBuildingId === building.id && (() => {
                  const url = `${SITE_URL}/view/${building.id}`
                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`
                  return (
                    <div className="w-full mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-sm font-medium text-slate-700 mb-3">세입자용 QR코드 · {building.name}</p>
                      <div className="flex flex-col sm:flex-row items-start gap-4">
                        <img src={qrUrl} alt="QR코드" className="w-40 h-40 rounded-lg border border-slate-200 bg-white p-1" />
                        <div className="flex flex-col gap-2 flex-1">
                          <p className="text-xs text-slate-500 break-all bg-white border border-slate-200 rounded-lg px-3 py-2">{url}</p>
                          <a
                            href={qrUrl}
                            download={`QR_${building.name}.png`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition w-fit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            QR코드 저장
                          </a>
                          <p className="text-xs text-slate-400">QR코드를 인쇄해서 건물에 부착하세요</p>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
