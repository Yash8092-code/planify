"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Pin,
  StickyNote,
  SlidersHorizontal,
  FolderPlus,
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
import { NoteCard } from "@/components/notes/note-card";
import { NoteEditorDialog } from "@/components/notes/note-editor";
import { Note } from "@/lib/types";
import { toast } from "sonner";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to fetch notes");
  return json.data as Note[];
};

export default function NotesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("recent");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const queryParams = new URLSearchParams();
  if (sortOrder) queryParams.set("sort", sortOrder);
  if (selectedTag && selectedTag !== "all") queryParams.set("tag", selectedTag);

  const { data: notes, error, isLoading, mutate } = useSWR<Note[]>(
    `/api/notes?${queryParams.toString()}`,
    fetcher
  );

  // Extract unique tags from notes
  const allTags = useMemo(() => {
    if (!notes) return [];
    const tagSet = new Set<string>();
    notes.forEach((n) => {
      if (Array.isArray(n.tags)) {
        n.tags.forEach((t) => tagSet.add(t));
      }
    });
    return Array.from(tagSet);
  }, [notes]);

  // Filter notes by search text
  const filteredNotes = useMemo(() => {
    if (!notes) return [];
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.tags && n.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }, [notes, searchQuery]);

  const pinnedNotes = filteredNotes.filter((n) => n.is_pinned);
  const regularNotes = filteredNotes.filter((n) => !n.is_pinned);

  // Note actions
  const handleSaveNote = async (data: {
    id?: string;
    title: string;
    content: string;
    tags: string[];
    is_pinned: boolean;
  }) => {
    try {
      if (data.id) {
        // Update
        const res = await fetch("/api/notes", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update note");
        toast.success("Note updated!");
      } else {
        // Create
        const res = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to create note");
        toast.success("Note created!");
      }
      mutate();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save note";
      toast.error(msg);
      throw err;
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const res = await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note");
      toast.success("Note deleted");
      mutate();
    } catch (err) {
      toast.error("Failed to delete note");
    }
  };

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    try {
      const res = await fetch("/api/notes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_pinned: !currentPinned }),
      });
      if (!res.ok) throw new Error("Failed to toggle pin");
      toast.success(currentPinned ? "Unpinned note" : "Pinned note to top");
      mutate();
    } catch (err) {
      toast.error("Failed to update pin status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Notes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Capture thoughts, meeting briefs, plans, and documentation
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setEditingNote(null);
            setIsEditorOpen(true);
          }}
          className="gap-1.5 h-9 text-xs shadow-xs self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          New Note
        </Button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes or tags..."
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
              <SelectItem value="recent">Recently Updated</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tags Filter Strip */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedTag("all")}
            className={`px-3 py-1 rounded-full border transition-colors whitespace-nowrap ${
              selectedTag === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border hover:border-primary/40 text-muted-foreground"
            }`}
          >
            All Notes
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1 rounded-full border transition-colors whitespace-nowrap ${
                selectedTag === tag
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border hover:border-primary/40 text-muted-foreground"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Notes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      ) : filteredNotes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title={searchQuery ? "No matching notes" : "No notes yet"}
          description={
            searchQuery
              ? "No notes found matching your search term. Try a different query."
              : "Start jotting down thoughts, meeting summaries, or personal knowledge."
          }
          actionLabel={!searchQuery ? "Create First Note" : undefined}
          onAction={
            !searchQuery
              ? () => {
                  setEditingNote(null);
                  setIsEditorOpen(true);
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Pinned Section */}
          {pinnedNotes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Pin className="h-3.5 w-3.5 fill-primary" />
                <span>PINNED ({pinnedNotes.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {pinnedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onEdit={(n) => {
                        setEditingNote(n);
                        setIsEditorOpen(true);
                      }}
                      onDelete={handleDeleteNote}
                      onTogglePin={handleTogglePin}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Regular Section */}
          {regularNotes.length > 0 && (
            <div className="space-y-3">
              {pinnedNotes.length > 0 && (
                <div className="text-xs font-semibold text-muted-foreground">
                  OTHER NOTES ({regularNotes.length})
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {regularNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onEdit={(n) => {
                        setEditingNote(n);
                        setIsEditorOpen(true);
                      }}
                      onDelete={handleDeleteNote}
                      onTogglePin={handleTogglePin}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Editor Modal */}
      <NoteEditorDialog
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingNote(null);
        }}
        onSave={handleSaveNote}
        note={editingNote}
      />
    </div>
  );
}
