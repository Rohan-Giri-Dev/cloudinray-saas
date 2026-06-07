import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
    '/sign-in(.*)',
  '/sign-up(.*)',
    '/',
    '/home'
])

const isPublicApiRoute = createRouteMatcher([
    '/api/videos'
])

export default clerkMiddleware(async (auth, req) => {
    const {userId} = await auth();
    const currentUrl = new URL (req.url)

    const isHomePage = currentUrl.pathname === '/home'
    const isApiRequest = currentUrl.pathname.startsWith("/api")

    // if user is logged in and accessing a public route but not the home page
    if(userId && isPublicRoute(req) && !isHomePage){
        return NextResponse.redirect(new URL("/home", req.url))
    }

    // not logged in
    if(!userId){
        //if user is not logged in an trying to access a protected route
        if(!isPublicRoute(req) && !isPublicApiRoute(req)) {
            return NextResponse.redirect(new URL('/sign-in', req.url))
        }

        //if the request is for a procted API and the user is not  logged in

        if(isApiRequest && !isPublicApiRoute(req)){
            return NextResponse.redirect(new URL("/sign-in", req.url))
        }
    }

    return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Always run for Clerk-specific frontend API routes
    '/__clerk/(.*)',
  ],
}

/*
Notes

1)

isPublic means what pages are we allowing 
Example: 
User opens /signin
Allowed

User opens /signup
Allowed

User opens /dashboard
Not allowed unless logged in

req — The Request Object
This is the same NextRequest you'd get in any Next.js middleware. It contains everything about the incoming HTTP request:

auth — Clerk's Auth Function
This is not built-in. Clerk injects this. When you await auth(), it returns session info that Clerk has already resolved from the request's cookies/token:
const { userId } = await auth();
// userId is null if not logged in
// userId is a string like "user_2abc..." if logged in


2)
createRouteMatcher is a Clerk utilty that return a function

const isPublicRoute = createRouteMatcher(['/signin', '/signup']) . this is a function now with Clerk utility

Now isPublicRoute is a function. When you call it:
isPublicRoute(req)

Clerk internally checks for the req.url, req.nexturl.pathname automatically and checks it againts the given array 

*/