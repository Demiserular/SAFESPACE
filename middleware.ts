import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware is used to handle authentication redirects
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Get the pathname
  const { pathname } = req.nextUrl;

  // Auth routes that don't require authentication
  const authRoutes = ['/login', '/signup'];

  // Check if there's a session cookie - Supabase uses cookies that start with 'sb-'
  // We need to check for access token and refresh token
  const hasSupabaseCookies = Array.from(req.cookies.getAll())
    .some(cookie => 
      (cookie.name.startsWith('sb-') && cookie.name.includes('auth')) || 
      cookie.name.includes('access_token') || 
      cookie.name.includes('refresh_token')
    );

  // If the user is on an auth route but is already authenticated, redirect to home
  if (authRoutes.includes(pathname) && hasSupabaseCookies) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return res;
}

// Only run the middleware on specific routes
export const config = {
  matcher: ['/login', '/signup'],
};
