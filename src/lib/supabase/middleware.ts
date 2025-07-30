// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define routes that require authentication
  const protectedRoutes = [
    '/admin',
    '/settings',
    '/members',
    '/hunts/create',
    '/hunts/edit',
    '/maintenance/create',
    '/maintenance/edit',
    '/profile'
  ]

  // Define public routes that don't need authentication
  const publicRoutes = [
    '/',
    '/calendar',
    '/about',
    '/auth'
  ]

  const pathname = request.nextUrl.pathname

  // Check if the current path requires authentication
  const requiresAuth = protectedRoutes.some(route => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/auth'))

  // If user is not authenticated and trying to access a protected route
  if (!user && requiresAuth) {
    // Instead of redirecting to /login, redirect to home with a query param
    // Your main page can detect this and auto-open the login modal
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('auth', 'required')
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}