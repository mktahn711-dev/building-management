import { cache } from 'react'
import { createServerSupabaseClient } from './supabase-server'
import type { Profile, Building } from './types'

type ProfileWithBuilding = Profile & { buildings: Building | null; ownedBuildings: Building[] }

/**
 * 로그인 사용자 + 프로필을 한 요청당 한 번만 조회한다.
 * React의 cache()는 같은 렌더 요청 안에서 동일한 함수 호출을 자동으로 중복 제거해주므로,
 * layout.tsx와 각 page.tsx가 똑같이 이 함수를 호출해도 실제 Supabase 왕복은 한 번만 일어난다.
 */
export const getAuthedProfile = cache(async () => {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, buildings(*)')
    .eq('id', user.id)
    .single<ProfileWithBuilding>()

  // 건물주가 담당하는 전체 건물 목록 (한 명이 여러 건물을 가질 수 있음).
  // profiles.building_id는 하위 호환용 단일 필드로 남겨두되, 실제 접근 권한과 목록은 owner_buildings가 기준이다.
  let ownedBuildings: Building[] = []
  if (profile?.role === 'owner') {
    const { data, error } = await supabase
      .from('owner_buildings')
      .select('buildings(*)')
      .eq('owner_id', user.id)
      .returns<{ buildings: Building }[]>()

    if (error) {
      // owner_buildings 마이그레이션이 아직 적용되지 않은 경우를 대비한 하위 호환 폴백
      if (profile.buildings) ownedBuildings = [profile.buildings]
    } else {
      ownedBuildings = (data || [])
        .map((row) => row.buildings)
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name))
    }
  }

  return { user, profile: profile ? { ...profile, ownedBuildings } : null }
})
