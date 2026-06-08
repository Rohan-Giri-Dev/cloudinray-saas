"use client";

import { useState, type ChangeEvent } from "react";
import { CldImage, getCldImageUrl } from "next-cloudinary";

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

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setIsUploading(true);

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
      alert("Failed to upload image");
    } finally {
      setIsUploading(false);
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
      alert("Failed to download image");
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Social Media Image Creator
      </h1>

      <div className="card">
        <div className="card-body">
          <h2 className="card-title mb-4">Upload an Image</h2>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Choose an image file</span>
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="file-input file-input-bordered file-input-primary w-full"
            />
          </div>

          {isUploading && (
            <div className="mt-4">
              <progress className="progress progress-primary w-full"></progress>
            </div>
          )}

          {uploadedImage && (
            <div className="mt-6">
              <h2 className="card-title mb-4">Select Social Media Format</h2>

              <div className="form-control">
                <select
                  className="select select-bordered w-full"
                  value={selectedFormat}
                  onChange={handleFormatChange}
                >
                  {Object.keys(socialFormats).map((format) => (
                    <option key={format} value={format}>
                      {format}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 relative">
                <h3 className="text-lg font-semibold mb-2">Preview:</h3>

                <div className="flex justify-center">
                  {isTransforming && (
                    <div className="absolute inset-0 flex items-center justify-center bg-base-100 bg-opacity-50 z-10">
                      <span className="loading loading-spinner loading-lg"></span>
                    </div>
                  )}

                  <CldImage
                    key={`${uploadedImage}-${selectedFormat}`}
                    width={socialFormats[selectedFormat].width}
                    height={socialFormats[selectedFormat].height}
                    src={uploadedImage}
                    sizes="100vw"
                    alt="transformed image"
                    crop="fill"
                    gravity="auto"
                    className="max-w-full h-auto rounded-lg"
                    onLoad={() => setIsTransforming(false)}
                    onError={() => setIsTransforming(false)}
                  />
                </div>
              </div>

              <div className="card-actions justify-end mt-6">
                <button className="btn btn-primary" onClick={handleDownload}>
                  Download for {selectedFormat}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
