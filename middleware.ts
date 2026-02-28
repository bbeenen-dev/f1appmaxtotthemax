import { createServerClient } from '@supabase/ssr' // Verwijder NextRequest hier
import { NextResponse, type NextRequest } from 'next/server' // Voeg hem hier toe

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
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Belangrijk: Gebruik getUser() voor veiligheid, niet getSession()
  const { data: { user } } = await supabase.auth.getUser()

  // BESCHERMING:
  // Als een gebruiker naar /races/... gaat en niet is ingelogd -> naar /login
  if (!user && request.nextUrl.pathname.startsWith('/races')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // Optioneel: onthoud waar de gebruiker heen wilde
    url.searchParams.set('next', request.nextUrl.pathname) 
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match alle paden behalve statische bestanden
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}