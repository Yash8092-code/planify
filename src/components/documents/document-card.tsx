"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileCode,
  File as FileIcon,
  Download,
  MoreVertical,
  Pencil,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Document as DocumentType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatFileSize } from "@/lib/utils";

interface DocumentCardProps {
  document: DocumentType;
  onRename: (id: string, newName: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function DocumentCard({
  document: doc,
  onRename,
  onDelete,
}: DocumentCardProps) {
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [newName, setNewName] = useState(doc.file_name);
  const [isRenaming, setIsRenaming] = useState(false);

  const getDocIcon = () => {
    const type = doc.file_type || "";
    if (type.startsWith("image/")) return <ImageIcon className="h-6 w-6 text-indigo-500" />;
    if (type.includes("pdf")) return <FileText className="h-6 w-6 text-rose-500" />;
    if (type.includes("sheet") || type.includes("csv") || type.includes("excel"))
      return <FileSpreadsheet className="h-6 w-6 text-emerald-500" />;
    if (type.includes("json") || type.includes("javascript") || type.includes("html"))
      return <FileCode className="h-6 w-6 text-amber-500" />;
    return <FileIcon className="h-6 w-6 text-primary" />;
  };

  const handleSaveRename = async () => {
    if (!newName.trim()) return;
    setIsRenaming(true);
    try {
      await onRename(doc.id, newName.trim());
      setIsRenameOpen(false);
    } finally {
      setIsRenaming(false);
    }
  };

  const formattedDate = new Date(doc.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const viewUrl = `/api/documents/${doc.id}/view`;
  const downloadUrl = `/api/documents/${doc.id}/view?download=1`;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -2 }}
        className="group relative flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-xs transition-all"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted/60">
            {getDocIcon()}
          </div>

          <div className="min-w-0 flex-1">
            <h4
              className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors cursor-pointer"
              title={doc.file_name}
              onClick={() => window.open(viewUrl, "_blank")}
            >
              {doc.file_name}
            </h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>{formatFileSize(doc.file_size)}</span>
              <span>•</span>
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0 ml-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => window.open(downloadUrl, "_blank")}
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => window.open(viewUrl, "_blank")}>
                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                Open File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(downloadUrl, "_blank")}>
                <Download className="mr-2 h-3.5 w-3.5" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsRenameOpen(true)}>
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(doc.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* Rename Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Rename Document</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new file name..."
              className="h-10"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRenameOpen(false)}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveRename}
              disabled={isRenaming || !newName.trim()}
            >
              {isRenaming ? "Renaming..." : "Save Name"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
