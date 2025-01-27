import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const publicRoutes = ['/', '/login', '/register']

  if (!publicRoutes.includes(path)) {
    const session = request.cookies.get('session')
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  return NextResponse.next()
}