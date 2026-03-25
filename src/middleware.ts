import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public paths that don't require auth
  const publicPaths = ['/login', '/signup', '/auth/callback', '/auth/confirm']
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p))

  // Unauthenticated user → redirect to login
  if (!user && !isPublicPath) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated user on login/signup → redirect to hub
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const hubUrl = request.nextUrl.clone()
    hubUrl.pathname = '/hub'
    return NextResponse.redirect(hubUrl)
  }

  // Root → redirect to hub
  if (pathname === '/') {
    const hubUrl = request.nextUrl.clone()
    hubUrl.pathname = user ? '/hub' : '/login'
    return NextResponse.redirect(hubUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
