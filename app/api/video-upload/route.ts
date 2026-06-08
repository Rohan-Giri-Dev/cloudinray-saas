import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 70 * 1024 * 1024;

// Configuration
cloudinary.config({ 
        cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET 
});

interface CloudinaryUploadResult {
    public_id: string,
    bytes: number,
    duration?: number
}

export async function POST(request: NextRequest){

    try {
    const {userId} = await auth()

    if(!userId){
        return NextResponse.json({error: "Unauthorized"}, {status: 401})
    }

    if(
        !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
        !process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET 
    ){
        return NextResponse.json({error: "Cloudinary credentials not found"}, {status: 500})
    }

        const formData = await request.formData()
        const file = formData.get('file')
        const title = formData.get('title')
        const description = formData.get('description')
        const originalSize = formData.get('originalSize')


        if(!(file instanceof File)){
            return NextResponse.json({error: "File not found"}, {status: 400})
        }

        if(file.size > MAX_FILE_SIZE){
            return NextResponse.json({error: "Video file is too large"}, {status: 400})
        }

        const normalizedTitle = typeof title === "string" ? title.trim() : ""

        if(!normalizedTitle){
            return NextResponse.json({error: "Title is required"}, {status: 400})
        }
        
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const result = await new Promise<CloudinaryUploadResult>(
            (resolve, reject) => {
                const uploadStream =  cloudinary.uploader.upload_stream(
                    {   resource_type: "video",
                        folder: "video-uploads",
                        transformation: [
                            {
                                quality: "auto",
                                fetch_format: "mp4"
                            }
                        ]
                    },
                    (error, result) => {
                        if(error) reject(error);
                        else resolve(result as CloudinaryUploadResult);
                    }
                )
                uploadStream.end(buffer)
            }
        )

        const video = await prisma.video.create({
            data: {
                title: normalizedTitle,
                description: typeof description === "string" ? description.trim() : "",
                publicId: result.public_id,
                originalSize: typeof originalSize === "string" ? originalSize : String(file.size),
                compressedSize: String(result.bytes) ,
                duration: result.duration || 0
            }
        })

        return NextResponse.json(video)

    } catch (error) {
        const message = error instanceof Error ? error.message : "Upload video failed"
        console.log("Upload video failed ", error);
        return NextResponse.json({error: message}, {status: 500})
    }
}
