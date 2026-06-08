"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  ImagePlus,
  Library,
  RefreshCw,
  Search,
  Upload,
  Video as VideoIcon,
} from "lucide-react";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import VideoCard from "@/components/VideoCard";
import type { Video } from "@/types";

function toNumber(value: string | number | null | undefined) {
  const numericValue = typeof value === "string" ? Number(value) : value ?? 0;
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0 min";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const { isSignedIn } = useUser();

  const fetchVideos = useCallback(async () => {
    await Promise.resolve();
    setError(null);

    try {
      const response = await axios.get<Video[]>("/api/videos");

      if (!Array.isArray(response.data)) {
        throw new Error("Unexpected response format");
      }

      setVideos(response.data);
    } catch (fetchError) {
      console.error(fetchError);
      setError("Failed to fetch videos. Check the API route and database connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      fetchVideos();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [fetchVideos]);

  const filteredVideos = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return videos;
    }

    return videos.filter((video) => {
      return [video.title, video.description, video.publicId]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery));
    });
  }, [query, videos]);

  const stats = useMemo(() => {
    const originalTotal = videos.reduce(
      (total, video) => total + toNumber(video.originalSize),
      0,
    );
    const compressedTotal = videos.reduce(
      (total, video) => total + toNumber(video.compressedSize),
      0,
    );
    const totalDuration = videos.reduce(
      (total, video) => total + toNumber(video.duration),
      0,
    );

    const savedBytes = Math.max(0, originalTotal - compressedTotal);

    return {
      count: videos.length,
      savedBytes,
      totalDuration,
    };
  }, [videos]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchVideos();
  };

  const handleDownload = useCallback((url: string, title: string) => {
    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title.replace(/[\\/:*?"<>|]/g, "-")}.mp4`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (downloadError) {
      console.error(downloadError);
      alert("Failed to download video");
    }
  }, []);

  return (
    <main className="min-h-screen bg-base-200">
      <header className="sticky top-0 z-20 border-b border-base-300 bg-base-100/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <a href="/home" className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-content">
              <VideoIcon size={20} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-bold text-base-content">
                Cloudinary SaaS
              </span>
              <span className="block truncate text-xs text-base-content/60">
                Media compression workspace
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-2 md:flex">
            <a href="/home" className="btn btn-ghost btn-sm">
              <Library size={16} />
              Library
            </a>
            <a href="/video-upload" className="btn btn-ghost btn-sm">
              <Upload size={16} />
              Video upload
            </a>
            <a href="/social-share" className="btn btn-ghost btn-sm">
              <ImagePlus size={16} />
              Social images
            </a>
          </nav>

          <div className="flex items-center gap-2">
            {isSignedIn ? (
              <UserButton />
            ) : (
              <SignInButton mode="modal">
                <button className="btn btn-primary btn-sm" type="button">
                  Sign in
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-7 px-4 py-6 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-primary">Video Library</p>
            <h1 className="mt-1 text-2xl font-bold tracking-normal text-base-content sm:text-4xl">
              Manage compressed Cloudinary videos
            </h1>
            <p className="mt-3 text-sm leading-6 text-base-content/65 sm:text-base">
              Review uploaded videos, compare compression savings, and download
              final assets from one focused workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleRefresh}
              disabled={loading || refreshing}
            >
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : undefined}
              />
              Refresh
            </button>
            <a href="/video-upload" className="btn btn-primary">
              <Upload size={18} />
              Upload video
            </a>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-base-300 bg-base-100 p-4 shadow-sm">
            <p className="text-sm text-base-content/60">Videos</p>
            <p className="mt-2 text-2xl font-bold text-base-content">{stats.count}</p>
          </div>
          <div className="rounded-lg border border-base-300 bg-base-100 p-4 shadow-sm">
            <p className="text-sm text-base-content/60">Storage saved</p>
            <p className="mt-2 text-2xl font-bold text-base-content">
              {formatBytes(stats.savedBytes)}
            </p>
          </div>
          <div className="rounded-lg border border-base-300 bg-base-100 p-4 shadow-sm">
            <p className="text-sm text-base-content/60">Runtime</p>
            <p className="mt-2 text-2xl font-bold text-base-content">
              {formatDuration(stats.totalDuration)}
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <label className="input input-bordered flex w-full items-center gap-2 sm:max-w-md">
            <Search size={18} className="text-base-content/40" />
            <input
              type="search"
              className="grow"
              placeholder="Search title, description, or public ID"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <p className="text-sm text-base-content/60">
            Showing {filteredVideos.length} of {videos.length}
          </p>
        </section>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-lg border border-base-300 bg-base-100"
              >
                <div className="aspect-video rounded-t-lg bg-base-300" />
                <div className="space-y-4 p-4">
                  <div className="h-4 w-2/3 rounded bg-base-300" />
                  <div className="h-3 w-full rounded bg-base-300" />
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-14 rounded bg-base-300" />
                    <div className="h-14 rounded bg-base-300" />
                    <div className="h-14 rounded bg-base-300" />
                  </div>
                </div>
              </div>
            ))}
          </section>
        ) : filteredVideos.length > 0 ? (
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onDownload={handleDownload}
              />
            ))}
          </section>
        ) : (
          <section className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-base-300 bg-base-100 px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <VideoIcon size={22} />
            </span>
            <h2 className="mt-4 text-xl font-semibold text-base-content">
              {query ? "No matching videos" : "No videos uploaded yet"}
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-base-content/60">
              {query
                ? "Try a different search term or clear the search field."
                : "Upload your first video to create a compressed Cloudinary asset and start building the library."}
            </p>
            {!query && (
              <a href="/video-upload" className="btn btn-primary mt-5">
                <Upload size={18} />
                Upload video
              </a>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
