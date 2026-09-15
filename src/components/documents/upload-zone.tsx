"use client";

import React, { useState, useRef } from "react";
import { Upload, File, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { formatFileSize } from "@/lib/utils";

interface UploadZoneProps {
  onUploadSuccess: () => void;
}

export function UploadZone({ onUploadSuccess }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFile = async (file: File) => {
    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`File is too large (${formatFileSize(file.size)}). Max allowed is 10MB.`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(25);

    try {
      const formData = new FormData();
      formData.append("file", file);

      setUploadProgress(60);

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(90);

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Upload failed");
      }

      setUploadProgress(100);
      toast.success(`"${file.name}" uploaded successfully!`);
      onUploadSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload file";
      toast.error(msg);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 600);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isUploading && fileInputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
        isDragging
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-border/80 hover:border-primary/50 hover:bg-muted/30"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.svg,.webp,.csv"
      />

      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
        <Upload className="h-6 w-6" />
      </div>

      <h3 className="text-sm font-semibold mb-1">
        {isUploading ? "Uploading Document..." : "Click or drag & drop files here"}
      </h3>
      <p className="text-xs text-muted-foreground text-center max-w-sm">
        Supports PDF, Word, text, images, and spreadsheets up to 10MB each
      </p>

      {isUploading && (
        <div className="w-full max-w-xs mt-4 space-y-1">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-[11px] text-muted-foreground text-center">
            {uploadProgress}% complete
          </p>
        </div>
      )}
    </div>
  );
}
