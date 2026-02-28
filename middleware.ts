import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        /**
         * We dwingen 'cookiesToSet' naar 'any' om de mismatch tussen 
         * de bibliotheek-versies en Next.js 15 op te lossen.
         */
        setAll(cookiesToSet: any) {
          cookiesToSet.forEach((cookie: any) => {
            const { name, value } = cookie
            request.cookies.set(name, value)
          })

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })

          cookiesToSet.forEach((cookie: any) => {
            const { name, value, options } = cookie
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Dit is cruciaal voor het verversen van de sessie
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    /*
     * Match alle paden behalve static files en afbeeldingen
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}