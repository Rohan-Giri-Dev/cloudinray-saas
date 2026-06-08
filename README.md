# Cloudinary SaaS

A Next.js media workspace for uploading, compressing, previewing, transforming, and downloading Cloudinary assets.

The app currently supports:

- Video uploads to Cloudinary with automatic quality/format optimization.
- Saved video metadata in PostgreSQL through Prisma.
- A video library dashboard with search, stats, hover previews, and download actions.
- Social image uploads with Cloudinary resizing/cropping presets.
- Clerk authentication for protected upload workflows.
- DaisyUI/Tailwind styling with a dark theme enabled by default.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- DaisyUI 5
- Clerk for auth
- Cloudinary and next-cloudinary for media storage and delivery
- Prisma 7 with PostgreSQL
- Prisma PostgreSQL adapter
- Axios for client-side API requests
- Lucide React icons

## Main Features

### Video Library

Route: `/home`

The home dashboard fetches videos from `/api/videos` and displays:

- Total video count.
- Estimated storage saved.
- Total video runtime.
- Search by title, description, or Cloudinary public ID.
- Video cards with thumbnail preview, hover preview, metadata, and download action.

### Video Upload

Route: `/video-upload`

The upload page supports:

- File picker and drag/drop upload.
- Video-only validation.
- 70 MB max file size validation.
- Title and description metadata.
- Local video preview before upload.
- Upload progress.
- Cloudinary result summary after upload.

The upload endpoint stores the optimized Cloudinary result in the database.

### Social Image Creator

Route: `/social-share`

This page uploads an image to Cloudinary and lets the user generate social-media-ready crops:

- Instagram Square
- Instagram Portrait
- Instagram Post
- Twitter Header
- Facebook Cover

The transformed image can be downloaded from the browser.

## API Routes

### `GET /api/videos`

Returns all saved videos, newest first.

Response shape:

```ts
Video[]
```

### `POST /api/video-upload`

Protected by Clerk auth.

Accepts `multipart/form-data`:

```txt
file: File
title: string
description: string
originalSize: string
```

Uploads the video to Cloudinary under:

```txt
video-uploads
```

Cloudinary transformations:

```ts
quality: "auto"
fetch_format: "mp4"
```

Then creates a `Video` record in PostgreSQL.

### `POST /api/image-upload`

Protected by Clerk auth.

Accepts `multipart/form-data`:

```txt
file: File
```

Uploads the image to Cloudinary under:

```txt
next-coloudinary-uploads
```

Returns:

```json
{
  "publicId": "cloudinary/public/id"
}
```

## Database Model

The Prisma schema defines one main model:

```prisma
model Video {
  id             String   @id @default(cuid())
  title          String
  description    String?
  publicId       String
  originalSize   String
  compressedSize String
  duration       Float
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

Notes:

- `publicId` is the Cloudinary public ID.
- `originalSize` is stored as a string because form data arrives as text.
- `compressedSize` stores the Cloudinary result byte size as a string.
- `duration` is stored as a number in seconds.

## Project Structure

```txt
app/
  (app)/
    home/page.tsx              Video library dashboard
    social-share/page.tsx      Social image creator
    video-upload/page.tsx      Video upload UI
  (auth)/
    sign-in/[[...sign-in]]     Clerk sign-in page
    sign-up/[[...sign-up]]     Clerk sign-up page
  api/
    image-upload/route.ts      Image upload API
    video-upload/route.ts      Video upload API
    videos/route.ts            Video listing API
  globals.css                  Global Tailwind/DaisyUI styles
  layout.tsx                   Root layout, Clerk provider, theme

components/
  VideoCard.tsx                Reusable video card UI

generated/
  prisma/                      Generated Prisma client

lib/
  prisma.ts                    Prisma client configured with PostgreSQL adapter

prisma/
  schema.prisma                Database schema
  migrations/                  Database migrations

types/
  index.ts                     Shared app types
```

## Environment Variables

Create a `.env` file in the project root.

Do not commit real secret values.

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
NEXT_PUBLIC_CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

Important:

- `CLOUDINARY_API_SECRET` must stay server-only.
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is used on the client to build public delivery URLs.
- Clerk keys are required for protected routes and upload APIs.

## Getting Started

Install dependencies:

```bash
npm install
```

Generate the Prisma client:

```bash
npx prisma generate
```

Run migrations:

```bash
npx prisma migrate dev
```

Start the development server:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000/home
```

## Scripts

```bash
npm run dev
```

Starts the local Next.js development server.

```bash
npm run build
```

Creates a production build and runs TypeScript checks.

```bash
npm run start
```

Starts the production server after a successful build.

```bash
npm run lint
```

Runs ESLint.

## Prisma Workflow

After changing `prisma/schema.prisma`, run:

```bash
npx prisma generate
```

If the database schema changed, also run:

```bash
npx prisma migrate dev
```

The generated client is output to:

```txt
generated/prisma
```

The app imports Prisma from:

```ts
import { prisma } from "@/lib/prisma";
```

## Cloudinary Workflow

Video upload flow:

```txt
Browser form
  -> POST /api/video-upload
  -> Clerk auth check
  -> Cloudinary upload_stream
  -> Prisma video.create
  -> Video appears in /home
```

Image upload flow:

```txt
Browser form
  -> POST /api/image-upload
  -> Clerk auth check
  -> Cloudinary upload_stream
  -> publicId returned
  -> next-cloudinary renders transformations
```

## Authentication

Clerk is initialized in `app/layout.tsx`.

The middleware/proxy config controls route access:

- `/sign-in` and `/sign-up` are public.
- `/home` is public.
- `/api/videos` is public.
- Upload routes require a signed-in user.

If uploads return `401 Unauthorized`, sign in first and confirm Clerk environment variables are configured.

## Theme

The root layout currently sets:

```tsx
data-theme="dark"
```

DaisyUI theme tokens are used throughout the dashboard and cards:

- `bg-base-100`
- `bg-base-200`
- `border-base-300`
- `text-base-content`
- `btn-primary`

To switch the default theme, update `data-theme` in `app/layout.tsx`.

Available DaisyUI themes configured in `app/globals.css`:

```txt
light
dark
cupcake
```

## Troubleshooting

### `Cloudinary credentials not found`

Confirm these variables exist in `.env`:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
NEXT_PUBLIC_CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

Restart the dev server after changing `.env`.

### `Unauthorized`

The upload APIs require Clerk auth.

Check:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
```

Then sign in before uploading.

### Prisma type mismatch

If TypeScript says Prisma fields do not match `schema.prisma`, regenerate the client:

```bash
npx prisma generate
```

If the database itself is out of sync, run:

```bash
npx prisma migrate dev
```

### Upload succeeds but video does not appear

Check:

- `POST /api/video-upload` returns a video object.
- `GET /api/videos` returns the uploaded video.
- `DATABASE_URL` points to the same database used by migrations.
- `publicId`, `originalSize`, `compressedSize`, and `duration` are saved.

### Social image preview does not render

Check that `/api/image-upload` returns:

```json
{
  "publicId": "..."
}
```

The social image page expects `publicId`.

## Deployment Notes

Before deploying:

1. Add all environment variables to the hosting provider.
2. Run or apply Prisma migrations against the production database.
3. Confirm Cloudinary API credentials are configured.
4. Confirm Clerk production keys and redirect URLs are configured.
5. Run a local production check:

```bash
npm run build
```

## Useful Local URLs

```txt
http://localhost:3000/home
http://localhost:3000/video-upload
http://localhost:3000/social-share
http://localhost:3000/sign-in
http://localhost:3000/sign-up
```

## Development Notes

- Keep API secrets out of client components.
- Use `@/lib/prisma` for database access.
- Regenerate Prisma after schema changes.
- Keep Cloudinary upload logic inside server API routes.
- Use `VideoCard` for video library cards instead of duplicating card UI.
