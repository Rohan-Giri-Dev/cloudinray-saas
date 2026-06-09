"use client";

import { useCallback, useMemo, useState } from "react";
import { getCldImageUrl, getCldVideoUrl } from "next-cloudinary";
import { Clock, Download, FileDown, FileUp } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { filesize } from "filesize";

dayjs.extend(relativeTime);

export type VideoCardVideo = {
  id: string;
  title: string;
  description?: string | null;
  publicId: string;
  originalSize: string | number;
  compressedSize: string | number;
  duration: number;
  createdAt: string | Date;
};

interface VideoCardProps {
  video: VideoCardVideo;
  onDownload: (url: string, title: string) => void;
}

function toNumber(value: string | number | null | undefined) {
  const numericValue = typeof value === "string" ? Number(value) : value ?? 0;
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

export default function VideoCard({ video, onDownload }: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const originalSize = toNumber(video.originalSize);
  const compressedSize = toNumber(video.compressedSize);

  const thumbnailUrl = useMemo(() => {
    return getCldImageUrl({
      src: video.publicId,
      width: 640,
      height: 360,
      crop: "fill",
      gravity: "auto",
      format: "jpg",
      quality: "auto",
      assetType: "video",
    });
  }, [video.publicId]);

  const previewVideoUrl = useMemo(() => {
    return getCldVideoUrl({
      src: video.publicId,
      width: 640,
      height: 360,
      crop: "fill",
      gravity: "auto",
      rawTransformations: ["e_preview:duration_8:max_seg_4:min_seg_dur_1"],
    });
  }, [video.publicId]);

  const fullVideoUrl = useMemo(() => {
    return getCldVideoUrl({
      src: video.publicId,
      width: 1920,
      height: 1080,
    });
  }, [video.publicId]);

  const handleDownload = useCallback(() => {
    onDownload(fullVideoUrl, video.title);
  }, [fullVideoUrl, onDownload, video.title]);

  const compressionPercentage =
    originalSize > 0 && compressedSize > 0
      ? Math.max(
          0,
          Math.round((1 - compressedSize / originalSize) * 100),
        )
      : 0;

  return (
    <article
      className="group card overflow-hidden rounded-lg border border-base-300 bg-base-100 text-base-content shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <figure className="relative aspect-video bg-base-300">
        {isHovered && !previewError ? (
          <video
            src={previewVideoUrl}
            poster={thumbnailUrl}
            muted
            loop
            playsInline
            autoPlay
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            onError={() => setPreviewError(true)}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={video.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            onError={() => setPreviewError(true)}
          />
        )}

        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />

        <div className="absolute bottom-3 right-3 rounded-md bg-black/75 px-2 py-1 text-xs font-semibold text-white shadow-sm">
          {formatDuration(video.duration)}
        </div>

        {compressionPercentage > 0 && (
          <div className="absolute left-3 top-3 rounded-md bg-success/95 px-2 py-1 text-xs font-semibold text-success-content shadow-sm">
            {compressionPercentage}% smaller
          </div>
        )}
      </figure>

      <div className="card-body gap-4 p-4 sm:p-5">
        <div className="min-w-0">
          <h2 className="line-clamp-1 text-base font-semibold text-base-content">
            {video.title}
          </h2>
          {video.description && (
            <p className="mt-1 line-clamp-2 text-sm text-base-content/60">
              {video.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="min-w-0 rounded-md border border-base-300 bg-base-200/60 p-2">
            <div className="flex items-center gap-1 text-base-content/50">
              <FileUp size={14} />
              Original
            </div>
            <p className="mt-1 font-semibold">{filesize(originalSize)}</p>
          </div>

          <div className="min-w-0 rounded-md border border-base-300 bg-base-200/60 p-2">
            <div className="flex items-center gap-1 text-base-content/50">
              <FileDown size={14} />
              Final
            </div>
            <p className="mt-1 font-semibold">{filesize(compressedSize)}</p>
          </div>

          <div className="min-w-0 rounded-md border border-base-300 bg-base-200/60 p-2">
            <div className="flex items-center gap-1 text-base-content/50">
              <Clock size={14} />
              Added
            </div>
            <p className="mt-1 truncate font-semibold">
              {dayjs(video.createdAt).fromNow()}
            </p>
          </div>
        </div>

        <div className="card-actions flex-nowrap items-center justify-between gap-3">
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-base-content/50">
            {video.publicId}
          </span>

          <button
            type="button"
            className="btn btn-primary btn-sm shrink-0"
            onClick={handleDownload}
            aria-label={`Download ${video.title}`}
            title="Download video"
          >
            <Download size={16} />
            Download
          </button>
        </div>
      </div>
    </article>
  );
}
