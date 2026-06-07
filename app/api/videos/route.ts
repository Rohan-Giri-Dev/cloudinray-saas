import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const videos = await prisma.video.findMany({
            orderBy: {createdAt: "desc"}
        })

        return NextResponse.json(videos)
        
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ error: `Error fetching videos: ${message}` }, { status: 500 })
    }
}


/*
Why We Did This
We want to show videos on our webpage.
But our webpage (React) can't fetch videos from the database directly. So we created this API route which does one simple job —

"Go to the database, grab all videos, newest first, and send them back."

Now our frontend can just call /api/videos and get the videos as JSON, ready to display.
That's it.


1)
const videos = await prisma.video.findMany({
    orderBy: { createdAt: "desc" }
})

prisma.video → refers to your video table/model in the database
findMany → fetch all records (like SELECT * FROM videos)
orderBy: { createdAt: "desc" } → newest videos first

2)
The Response
typescriptreturn NextResponse.json(videos)
Sends the videos array back as a JSON response to whoever called this API.

3)
const message = error instanceof Error ? error.message : 'Unknown error'
return NextResponse.json({ error: `Error fetching videos: ${message}` }, { status: 500 })

error instanceof Error → checks if the error is a proper Error object, because sometimes errors can be strings or unknown types
If something goes wrong, it sends back a 500 status with a readable error message

Someone calls GET /api/videos
        ↓
Prisma fetches all videos from DB
sorted by newest first
        ↓
Success → return videos as JSON
Failure → return error message with status 500

*/