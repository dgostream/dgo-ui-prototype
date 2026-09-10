import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    if (path.startsWith('/admin') && path !== '/admin/login') {
        const isLoggedIn = request.cookies.get('admin_session')?.value === 'true';
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    // Also protect the API routes so outsiders can't write to sanity
    if (path.startsWith('/api/admin') && path !== '/api/admin/login') {
        const isLoggedIn = request.cookies.get('admin_session')?.value === 'true';
        if (!isLoggedIn) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/api/admin/:path*'],
}
