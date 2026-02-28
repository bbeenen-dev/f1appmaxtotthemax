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
          return cookieStore.getAll()
        },
        /**
         * We gebruiken 'any' om de strikte type-controle van Next.js 15 
         * op de cookie-objecten te omzeilen.
         */
        setAll(cookiesToSet: any) {
          try {
            cookiesToSet.forEach((cookie: any) => {
              const { name, value, options } = cookie
              cookieStore.set(name, value, options)
            })
          } catch {
            // In Server Components mogen cookies niet aangepast worden.
            // Dit wordt opgevangen door de middleware.
          }
        },
      },
    }
  )
}