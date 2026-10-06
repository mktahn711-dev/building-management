'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Building {
  id: string
  name: string
}

interface Owner {
  id: string
  name: string | null
  email: string
  buildingIds: string[]
}

interface OwnersManagerProps {
  buildings: Building[]
}

export default function OwnersManager({ buildings }: OwnersManagerProps) {
  const [owners, setOwners] = useState<Owner[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingKey, setPendingKey] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/owners')
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || '건물주 목록을 불러오지 못했습니다.')
          return
        }
        setOwners(data.owners)
      } catch {
        setError('네트워크 오류가 발생했습니다.')
      }
    }
    load()
  }, [])

  const toggleBuilding = async (owner: Owner, buildingId: string) => {
    const key = `${owner.id}:${buildingId}`
    setPendingKey(key)
    setError(null)
    const supabase = createClient()
    const isAssigned = owner.buildingIds.includes(buildingId)

    const { error: opError } = isAssigned
      ? await supabase.from('owner_buildings').delete().eq('owner_id', owner.id).eq('building_id', buildingId)
      : await supabase.from('owner_buildings').insert({ owner_id: owner.id, building_id: buildingId })

    setPendingKey(null)

    if (opError) {
      setError(`건물 배정 변경 중 오류가 발생했습니다: ${opError.message}`)
      return
    }

    setOwners((prev) =>
      (prev || []).map((o) =>
        o.id !== owner.id
          ? o
          : {
              ...o,
              buildingIds: isAssigned
                ? o.buildingIds.filter((id) => id !== buildingId)
                : [...o.buildingIds, buildingId],
            }
      )
    )
  }

  if (owners === null && !error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center text-slate-400 text-sm">
        불러오는 중...
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h2 className="text-base font-semibold text-slate-800 mb-1">등록된 건물주</h2>
      <p className="text-sm text-slate-500 mb-4">
        체크박스로 건물주별 담당 건물을 언제든 추가/해제할 수 있습니다. 한 명이 여러 건물을 담당해도 됩니다.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      {owners && owners.length === 0 ? (
        <p className="text-slate-400 text-sm py-6 text-center">등록된 건물주가 없습니다</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {owners?.map((owner) => (
            <div key={owner.id} className="py-4 first:pt-0 last:pb-0">
              <div className="mb-2">
                <p className="font-medium text-slate-800">{owner.name || '이름 없음'}</p>
                <p className="text-xs text-slate-500">{owner.email}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {buildings.map((b) => {
                  const assigned = owner.buildingIds.includes(b.id)
                  const key = `${owner.id}:${b.id}`
                  return (
                    <button
                      key={b.id}
                      type="button"
                      disabled={pendingKey === key}
                      onClick={() => toggleBuilding(owner, b.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition disabled:opacity-50 ${
                        assigned
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {b.name}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
