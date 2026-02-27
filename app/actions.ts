'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function getUserSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  
  // Bepaal de URL voor de callback (Vercel URL of localhost)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
      // Dit zorgt ervoor dat Google altijd om het account vraagt
      queryParams: {
        prompt: 'select_account',
      },
    },
  })

  if (error) {
    console.error('OAuth Error:', error.message)
    return redirect('/login?error=auth-failed')
  }

  if (data.url) {
    return redirect(data.url) // Stuur de gebruiker naar de Google inlogpagina
  }
}