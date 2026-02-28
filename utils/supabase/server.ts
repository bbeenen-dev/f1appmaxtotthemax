import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Haal alle beschikbare cookies op uit de browser-request
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            // Probeer de cookies te updaten (werkt alleen in Server Actions/Route Handlers)
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // In Server Components (zoals je HomePage) mag je geen cookies zetten.
            // De middleware handelt het verversen van de sessie al af, 
            // dus dit 'foutje' kunnen we hier veilig negeren.
          }
        },
      },
    }
  )
}