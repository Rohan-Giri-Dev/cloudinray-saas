"use client";

import { useState, type ChangeEvent } from "react";
import { CldImage, getCldImageUrl } from "next-cloudinary";
import {
  Download,
  ImagePlus,
  LayoutTemplate,
  Library,
  Upload,
} from "lucide-react";

const socialFormats = {
  "Instagram Square (1:1)": {
    width: 1080,
    height: 1080,
  },
  "Instagram Portrait (4:5)": {
    width: 1080,
    height: 1350,
  },
  "Instagram Post (16:9)": {
    width: 1200,
    height: 675,
  },
  "Twitter Header (3:1)": {
    width: 1500,
    height: 500,
  },
  "Facebook Cover (205:78)": {
    width: 820,
    height: 312,
  },
} as const;

type SocialFormat = keyof typeof socialFormats;

export default function Socialshare() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const [selectedFormat, setSelectedFormat] = useState<SocialFormat>(
    "Instagram Square (1:1)",
  );

  const [isUploading, setIsUploading] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDimensions = socialFormats[selectedFormat];
  const canDownload = Boolean(uploadedImage && !isTransforming);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/image-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();

      if (!data.publicId) {
        throw new Error("No publicId returned from server");
      }

      setIsTransforming(true);
      setUploadedImage(data.publicId);
    } catch (error) {
      console.error(error);
      setError("Failed to upload image");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleFormatChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (uploadedImage) {
      setIsTransforming(true);
    }

    setSelectedFormat(event.target.value as SocialFormat);
  };

  const handleDownload = async () => {
    if (!uploadedImage) return;

    const { width, height } = socialFormats[selectedFormat];

    const imageUrl = getCldImageUrl({
      src: uploadedImage,
      width,
      height,
      crop: "fill",
      gravity: "auto",
      format: "png",
    });

    try {
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error("Failed to download image");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedFormat
        .replace(/[():]/g, "")
        .replace(/\s+/g, "_")
        .toLowerCase()}.png`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      setError("Failed to download image");
    }
  };

  return (
    <main className="min-h-screen bg-base-200">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-base-300 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Cloudinary SaaS</p>
            <h1 className="mt-1 text-2xl font-bold tracking-normal text-base-content sm:text-3xl">
              Social Image Studio
            </h1>
          </div>

          <nav className="flex flex-wrap gap-2">
            <a href="/home" className="btn btn-ghost btn-sm">
              <Library size={16} />
              Library
            </a>
            <a href="/video-upload" className="btn btn-ghost btn-sm">
              <Upload size={16} />
              Video upload
            </a>
          </nav>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(300px,0.82fr)_minmax(0,1.18fr)]">
          <section className="card rounded-lg border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body gap-5">
              <div>
                <h2 className="card-title text-xl">Source image</h2>
                <p className="mt-1 text-sm text-base-content/60">
                  Upload once, then crop for each social canvas.
                </p>
              </div>

              <label className="form-control">
                <span className="label pb-2">
                  <span className="label-text font-medium">Image file</span>
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="file-input file-input-bordered file-input-primary w-full"
                />
              </label>

              {isUploading && (
                <progress className="progress progress-primary w-full" />
              )}

              <label className="form-control">
                <span className="label pb-2">
                  <span className="label-text font-medium">Canvas</span>
                </span>
                <select
                  className="select select-bordered w-full"
                  value={selectedFormat}
                  onChange={handleFormatChange}
                >
                  {(Object.keys(socialFormats) as SocialFormat[]).map(
                    (format) => (
                      <option key={format} value={format}>
                        {format}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-base-300 bg-base-200/60 p-3">
                  <p className="text-xs font-medium uppercase text-base-content/50">
                    Width
                  </p>
                  <p className="mt-1 font-semibold">
                    {selectedDimensions.width}px
                  </p>
                </div>
                <div className="rounded-md border border-base-300 bg-base-200/60 p-3">
                  <p className="text-xs font-medium uppercase text-base-content/50">
                    Height
                  </p>
                  <p className="mt-1 font-semibold">
                    {selectedDimensions.height}px
                  </p>
                </div>
              </div>

              {error && <div className="alert alert-error text-sm">{error}</div>}

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDownload}
                disabled={!canDownload}
              >
                <Download size={18} />
                Download image
              </button>
            </div>
          </section>

          <section className="card rounded-lg border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body gap-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="card-title text-xl">Preview</h2>
                  <p className="mt-1 text-sm text-base-content/60">
                    {selectedFormat}
                  </p>
                </div>

                <div className="badge badge-outline gap-2 self-start sm:self-auto">
                  <LayoutTemplate size={14} />
                  {selectedDimensions.width} x {selectedDimensions.height}
                </div>
              </div>

              <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-lg border border-base-300 bg-base-200/70 p-4">
                {isTransforming && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-base-100/60 backdrop-blur-sm">
                    <span className="loading loading-spinner loading-lg" />
                  </div>
                )}

                {uploadedImage ? (
                  <CldImage
                    key={`${uploadedImage}-${selectedFormat}`}
                    width={selectedDimensions.width}
                    height={selectedDimensions.height}
                    src={uploadedImage}
                    sizes="(min-width: 1024px) 58vw, 100vw"
                    alt="Transformed social media image"
                    crop="fill"
                    gravity="auto"
                    className="h-auto max-h-[620px] w-full rounded-lg border border-base-300 object-contain shadow-sm"
                    onLoad={() => setIsTransforming(false)}
                    onError={() => setIsTransforming(false)}
                  />
                ) : (
                  <div className="flex flex-col items-center text-center text-base-content/60">
                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ImagePlus size={22} />
                    </span>
                    <p className="mt-3 text-sm font-medium">
                      No image selected
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
