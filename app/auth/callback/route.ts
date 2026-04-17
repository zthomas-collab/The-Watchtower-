import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // On successful auth, ensure user profile row exists
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('user_profiles').upsert({
          id: user.id,
          email: user.email ?? '',
          full_name: user.user_metadata?.full_name ?? null,
        }, { onConflict: 'id', ignoreDuplicates: true })

        // Create default watchlist if none exists
        const { data: existing } = await supabase
          .from('watchlists')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)

        if (!existing?.length) {
          await supabase.from('watchlists').insert({
            user_id: user.id,
            name: 'My Watchlist',
            is_default: true,
          })
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}
