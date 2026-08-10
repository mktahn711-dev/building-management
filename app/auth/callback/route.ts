import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  const supabase = await createServerSupabaseClient()

  // PKCE 방식 (code)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}/auth/set-password`)
    }
  }

  // 초대 이메일 방식 (token_hash + type=invite)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as 'invite' | 'email' | 'recovery' | 'email_change' })
    if (!error) {
      return NextResponse.redirect(`${origin}/auth/set-password`)
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}
