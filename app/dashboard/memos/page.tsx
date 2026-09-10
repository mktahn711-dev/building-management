import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getAuthedProfile } from '@/lib/get-profile'
import MemoSection from '@/components/MemoSection'

export default async function MemosPage() {
  const { user, profile } = await getAuthedProfile()
  if (!user) redirect('/login')
  if (!profile) redirect('/login')

  const supabase = await createServerSupabaseClient()

  const isAdmin = profile.role === 'admin'

  // 메모 불러오기
  type MemoRow = {
    id: string
    building_id: string
    content: string
    created_by: string | null
    is_read: boolean
    created_at: string
    buildings?: { name: string } | null
  }

  // 관리자: 모든 건물/메모 / 건물주: 본인 건물/메모 — 서로 의존하지 않으니 동시에 조회
  let buildings: { id: string; name: string }[] = []
  let allMemos: MemoRow[] = []

  if (isAdmin) {
    const [{ data: b }, { data: m }] = await Promise.all([
      supabase.from('buildings').select('id, name').order('name'),
      supabase.from('memos').select('*').order('created_at', { ascending: false }),
    ])
    buildings = b || []
    allMemos = m || []
  } else if (profile.building_id) {
    const [{ data: b }, { data: m }] = await Promise.all([
      supabase.from('buildings').select('id, name').eq('id', profile.building_id),
      supabase.from('memos').select('*').eq('building_id', profile.building_id).order('created_at', { ascending: false }),
    ])
    buildings = b || []
    allMemos = m || []
  }

  const targetBuildingId = isAdmin ? buildings[0]?.id : profile.building_id

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          {isAdmin ? '건물주 메모 관리' : '메모'}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {isAdmin
            ? '건물주로부터 받은 메모를 확인하세요'
            : '관리자에게 전달할 내용을 메모로 남기세요'}
        </p>
      </div>

      {/* 관리자: 건물별 메모 탭 */}
      {isAdmin && buildings.length > 0 && (
        <AdminMemosView buildings={buildings} currentUserId={user.id} />
      )}

      {/* 건물주: 단일 건물 메모 */}
      {!isAdmin && targetBuildingId && (
        <MemoSection
          memos={allMemos}
          buildingId={targetBuildingId}
          isAdmin={false}
          currentUserId={user.id}
        />
      )}

      {buildings.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <p className="text-slate-500">등록된 건물이 없습니다</p>
        </div>
      )}
    </div>
  )
}

// 관리자용 건물별 메모 뷰
import AdminMemosView from '@/components/AdminMemosView'
