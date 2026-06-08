"use client";

import axios from "axios";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";

const MAX_FILE_SIZE = 70 * 1024 * 1024;
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

type UploadedVideo = {
  id: string;
  title: string;
  description: string | null;
  publicId: string;
  originalSize: string;
  compressedSize: string;
  duration: number;
  createdAt: string;
};

function formatBytes(value: number | string | null | undefined) {
  const bytes = typeof value === "string" ? Number(value) : value ?? 0;

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const precision = unitIndex === 0 || size >= 10 ? 0 : 1;
  return `${size.toFixed(precision)} ${units[unitIndex]}`;
}

function formatDuration(value: number | null | undefined) {
  const seconds = Number(value ?? 0);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

function getUploadErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ error?: string }>(error)) {
    return error.response?.data?.error ?? error.message;
  }

  return error instanceof Error ? error.message : "Upload failed";
}

export default function VideoUpload() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<UploadedVideo | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const updatePreviewUrl = (selectedFile: File | null) => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    previewUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
  };

  const uploadedVideoUrl = useMemo(() => {
    if (!CLOUDINARY_CLOUD_NAME || !uploadedVideo?.publicId) {
      return null;
    }

    const publicId = uploadedVideo.publicId
      .split("/")
      .map(encodeURIComponent)
      .join("/");

    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/${publicId}.mp4`;
  }, [uploadedVideo]);

  const canUpload = Boolean(file && title.trim() && !isUploading);

  const selectFile = (selectedFile: File) => {
    setError(null);
    setUploadedVideo(null);
    setUploadProgress(0);

    if (!selectedFile.type.startsWith("video/")) {
      setFile(null);
      updatePreviewUrl(null);
      setError("Please choose a video file.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      updatePreviewUrl(null);
      setError(`Video must be ${formatBytes(MAX_FILE_SIZE)} or smaller.`);
      return;
    }

    setFile(selectedFile);
    updatePreviewUrl(selectedFile);
    setTitle((currentTitle) => {
      if (currentTitle.trim()) return currentTitle;

      return selectedFile.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]+/g, " ")
        .trim();
    });
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      selectFile(selectedFile);
    }

    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const selectedFile = event.dataTransfer.files?.[0];

    if (selectedFile) {
      selectFile(selectedFile);
    }
  };

  const clearForm = () => {
    setFile(null);
    updatePreviewUrl(null);
    setTitle("");
    setDescription("");
    setError(null);
    setUploadedVideo(null);
    setUploadProgress(0);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file || !title.trim()) return;

    setIsUploading(true);
    setError(null);
    setUploadedVideo(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("originalSize", file.size.toString());

    try {
      const response = await axios.post<UploadedVideo>(
        "/api/video-upload",
        formData,
        {
          onUploadProgress: (progressEvent) => {
            if (!progressEvent.total) return;

            setUploadProgress(
              Math.round((progressEvent.loaded * 100) / progressEvent.total),
            );
          },
        },
      );

      setUploadedVideo(response.data);
      setUploadProgress(100);
    } catch (uploadError) {
      setError(getUploadErrorMessage(uploadError));
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-base-200">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-base-300 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Cloudinary SaaS</p>
            <h1 className="mt-1 text-2xl font-bold tracking-normal text-base-content sm:text-3xl">
              Video Upload
            </h1>
          </div>

          <a href="/home" className="btn btn-ghost btn-sm self-start sm:self-auto">
            View library
          </a>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
          <form
            onSubmit={handleSubmit}
            className="card border border-base-300 bg-base-100 shadow-sm"
          >
            <div className="card-body gap-5">
              <div>
                <h2 className="card-title text-xl">Upload details</h2>
                <p className="mt-1 text-sm text-base-content/60">
                  MP4, MOV, WEBM, or another browser-supported video format.
                </p>
              </div>

              <label
                htmlFor="video-file"
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-5 text-center transition ${
                  isDragging
                    ? "border-primary bg-primary/10"
                    : "border-base-300 bg-base-200/60 hover:border-primary hover:bg-primary/5"
                }`}
              >
                <input
                  ref={fileInputRef}
                  id="video-file"
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <span className="text-base font-semibold text-base-content">
                  {file ? file.name : "Select video"}
                </span>
                <span className="mt-2 text-sm text-base-content/60">
                  {file
                    ? `${formatBytes(file.size)} selected`
                    : `Maximum size ${formatBytes(MAX_FILE_SIZE)}`}
                </span>
              </label>

              {file && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-base-300 bg-base-200/50 p-3">
                    <p className="text-xs font-medium uppercase text-base-content/50">
                      Size
                    </p>
                    <p className="mt-1 font-semibold">{formatBytes(file.size)}</p>
                  </div>
                  <div className="rounded-lg border border-base-300 bg-base-200/50 p-3">
                    <p className="text-xs font-medium uppercase text-base-content/50">
                      Type
                    </p>
                    <p className="mt-1 truncate font-semibold">
                      {file.type || "video"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-base-300 bg-base-200/50 p-3">
                    <p className="text-xs font-medium uppercase text-base-content/50">
                      Limit
                    </p>
                    <p className="mt-1 font-semibold">
                      {formatBytes(MAX_FILE_SIZE)}
                    </p>
                  </div>
                </div>
              )}

              <div className="form-control">
                <label className="label" htmlFor="title">
                  <span className="label-text font-medium">Title</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="input input-bordered w-full"
                  placeholder="Campaign recap"
                  maxLength={120}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label" htmlFor="description">
                  <span className="label-text font-medium">Description</span>
                  <span className="label-text-alt">{description.length}/240</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="textarea textarea-bordered min-h-28 w-full resize-none"
                  placeholder="Short context for your team"
                  maxLength={240}
                />
              </div>

              {isUploading && (
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium">Uploading</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <progress
                    className="progress progress-primary w-full"
                    value={uploadProgress}
                    max={100}
                  />
                </div>
              )}

              {error && <div className="alert alert-error text-sm">{error}</div>}

              {uploadedVideo && (
                <div className="alert alert-success">
                  <div>
                    <p className="font-semibold">Upload complete</p>
                    <p className="text-sm">
                      {uploadedVideo.title} is ready in Cloudinary.
                    </p>
                  </div>
                </div>
              )}

              <div className="card-actions justify-end">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={clearForm}
                  disabled={isUploading || (!file && !title && !description)}
                >
                  Clear
                </button>
                <button
                  type="submit"
                  className="btn btn-primary min-w-36"
                  disabled={!canUpload}
                >
                  {isUploading && (
                    <span className="loading loading-spinner loading-sm" />
                  )}
                  Upload video
                </button>
              </div>
            </div>
          </form>

          <aside className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body gap-5">
              <div>
                <h2 className="card-title text-xl">Preview</h2>
                <p className="mt-1 text-sm text-base-content/60">
                  Local preview before upload, Cloudinary result after save.
                </p>
              </div>

              <div className="aspect-video overflow-hidden rounded-lg border border-base-300 bg-base-300">
                {previewUrl ? (
                  <video
                    src={previewUrl}
                    controls
                    className="h-full w-full bg-black object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-base-content/60">
                    No video selected
                  </div>
                )}
              </div>

              <div className="divider my-0" />

              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-base-content/50">Original</dt>
                  <dd className="mt-1 font-semibold">
                    {formatBytes(uploadedVideo?.originalSize ?? file?.size)}
                  </dd>
                </div>
                <div>
                  <dt className="text-base-content/50">Compressed</dt>
                  <dd className="mt-1 font-semibold">
                    {formatBytes(uploadedVideo?.compressedSize)}
                  </dd>
                </div>
                <div>
                  <dt className="text-base-content/50">Duration</dt>
                  <dd className="mt-1 font-semibold">
                    {formatDuration(uploadedVideo?.duration)}
                  </dd>
                </div>
                <div>
                  <dt className="text-base-content/50">Status</dt>
                  <dd className="mt-1 font-semibold">
                    {uploadedVideo ? "Saved" : file ? "Ready" : "Waiting"}
                  </dd>
                </div>
              </dl>

              {uploadedVideo && (
                <div className="rounded-lg border border-base-300 bg-base-200/60 p-4">
                  <p className="text-xs font-medium uppercase text-base-content/50">
                    Public ID
                  </p>
                  <p className="mt-2 break-all font-mono text-sm">
                    {uploadedVideo.publicId}
                  </p>

                  {uploadedVideoUrl && (
                    <a
                      href={uploadedVideoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline btn-sm mt-4"
                    >
                      Open video
                    </a>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
