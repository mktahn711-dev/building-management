import { cache } from 'react'
import { createServerSupabaseClient } from './supabase-server'
import type { Profile, Building } from './types'

type ProfileWithBuilding = Profile & { buildings: Building | null }

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

  return { user, profile }
})
