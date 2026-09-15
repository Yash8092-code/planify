"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { AnimatePresence } from "framer-motion";
import {
  FolderOpen,
  Search,
  SlidersHorizontal,
  Upload,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { UploadZone } from "@/components/documents/upload-zone";
import { DocumentCard } from "@/components/documents/document-card";
import { Document as DocumentType } from "@/lib/types";
import { toast } from "sonner";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to fetch documents");
  return json.data as DocumentType[];
};

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<string>("recent");
  const [showUploadZone, setShowUploadZone] = useState(false);

  const queryParams = new URLSearchParams();
  if (sortOrder) queryParams.set("sort", sortOrder);

  const { data: documents, error, isLoading, mutate } = useSWR<DocumentType[]>(
    `/api/documents?${queryParams.toString()}`,
    fetcher
  );

  const filteredDocs = useMemo(() => {
    if (!documents) return [];
    if (!searchQuery.trim()) return documents;
    const q = searchQuery.toLowerCase();
    return documents.filter((d) => d.file_name.toLowerCase().includes(q));
  }, [documents, searchQuery]);

  const handleRename = async (id: string, newName: string) => {
    try {
      const res = await fetch("/api/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, file_name: newName }),
      });
      if (!res.ok) throw new Error("Failed to rename file");
      toast.success("Document renamed");
      mutate();
    } catch (err) {
      toast.error("Failed to rename document");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete document");
      toast.success("Document deleted");
      mutate();
    } catch (err) {
      toast.error("Failed to delete document");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Store, view, and organize your files, contracts, and receipts
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setShowUploadZone(!showUploadZone)}
          className="gap-1.5 h-9 text-xs shadow-xs self-start sm:self-auto"
        >
          <Upload className="h-4 w-4" />
          {showUploadZone ? "Hide Uploader" : "Upload File"}
        </Button>
      </div>

      {/* Upload Dropzone (Collapsible or always available when toggled) */}
      {showUploadZone && (
        <div className="animate-in fade-in-50 duration-200">
          <UploadZone
            onUploadSuccess={() => {
              mutate();
              setShowUploadZone(false);
            }}
          />
        </div>
      )}

      {/* Search & Sort Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-36 h-9 text-xs">
              <SlidersHorizontal className="h-3 w-3 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently Added</SelectItem>
              <SelectItem value="name">File Name</SelectItem>
              <SelectItem value="size">File Size</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Document Cards List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : filteredDocs.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={searchQuery ? "No matching files" : "No documents uploaded"}
          description={
            searchQuery
              ? "No files match your search criteria. Try a different search."
              : "Upload PDFs, reference documents, scans, or images for quick access."
          }
          actionLabel={!searchQuery ? "Upload First Document" : undefined}
          onAction={!searchQuery ? () => setShowUploadZone(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {filteredDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onRename={handleRename}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
