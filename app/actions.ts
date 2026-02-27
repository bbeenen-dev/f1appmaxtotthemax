'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers' // Importeer headers

export async function getUserSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  
  // Bepaal de host (bijv. localhost:3000 of je-app.vercel.app)
  const headerList = await headers()
  const host = headerList.get('host')
  
  // Bepaal of we op http (lokaal) of https (live) zitten
  const protocol = host?.includes('localhost') ? 'http' : 'https'
  
  // Bouw de exacte siteUrl
  const siteUrl = `${protocol}://${host}`
  
  console.log("Redirecting to:", `${siteUrl}/auth/callback`) // Handig voor debuggen in je terminal!

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
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
    return redirect(data.url)
  }
}