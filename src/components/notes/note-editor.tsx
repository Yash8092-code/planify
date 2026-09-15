"use client";

import React, { useState, useEffect } from "react";
import { Note } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Pin, X, Plus, AlertCircle, Type } from "lucide-react";
import { cn } from "@/lib/utils";

interface NoteEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    title: string;
    content: string;
    tags: string[];
    is_pinned: boolean;
  }) => Promise<void>;
  note?: Note | null;
}

export function NoteEditorDialog({
  isOpen,
  onClose,
  onSave,
  note,
}: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content || "");
      setTags(note.tags || []);
      setIsPinned(note.is_pinned || false);
    } else {
      setTitle("");
      setContent("");
      setTags([]);
      setIsPinned(false);
    }
    setTagInput("");
    setError(null);
  }, [note, isOpen]);

  const handleAddTag = () => {
    const clean = tagInput.trim().toLowerCase().replace(/^#/, "");
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput("");
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Note title is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        id: note?.id,
        title: title.trim(),
        content,
        tags,
        is_pinned: isPinned,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save note");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stats
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
          <DialogTitle className="text-base font-semibold">
            {note ? "Edit Note" : "New Note"}
          </DialogTitle>

          <button
            type="button"
            onClick={() => setIsPinned(!isPinned)}
            className={cn(
              "flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border transition-colors",
              isPinned
                ? "border-primary/40 bg-primary/10 text-primary font-medium"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
            title={isPinned ? "Unpin note" : "Pin to top"}
          >
            <Pin className={cn("h-3.5 w-3.5", isPinned && "fill-primary")} />
            <span>{isPinned ? "Pinned" : "Pin"}</span>
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-3">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title Input */}
          <Input
            placeholder="Note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-base font-medium h-11 border-border/80"
            autoFocus
          />

          {/* Content Area */}
          <Textarea
            placeholder="Write your thoughts, plans, markdown notes, ideas..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="text-sm resize-none font-normal leading-relaxed border-border/80"
          />

          {/* Tag Manager */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add a tag and press Enter (e.g. work, ideas)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                className="h-8 text-xs flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                className="h-8 text-xs gap-1"
              >
                <Plus className="h-3 w-3" />
                Add
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs px-2 py-0.5 gap-1 bg-primary/10 text-primary border border-primary/20"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive transition-colors ml-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer: Word count + Actions */}
        <DialogFooter className="flex flex-row items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Type className="h-3 w-3" />
              {wordCount} words
            </span>
            <span>•</span>
            <span>{charCount} chars</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : note ? "Save Changes" : "Create Note"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
