'use client';

import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/route";

interface UploadThingUploadProps {
  onUpload: (url: string) => void;
  currentImage?: string;
}

export default function UploadThingUpload({ onUpload, currentImage }: UploadThingUploadProps) {
  return (
    <div>
      {currentImage && (
        <div className="mb-4">
          <img
            src={currentImage}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>
      )}
      
      <UploadButton<OurFileRouter, "imageUploader">
        endpoint="imageUploader"
        onClientUploadComplete={(res) => {
          if (res && res[0]) {
            onUpload(res[0].url);
            alert("Upload completo!");
          }
        }}
        onUploadError={(error: Error) => {
          alert(`Erro: ${error.message}`);
        }}
        appearance={{
          button: "w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition",
          allowedContent: "text-sm text-gray-500 mt-2"
        }}
      />
    </div>
  );
}
