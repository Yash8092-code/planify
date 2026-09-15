"use client";

import React from "react";
import { motion } from "framer-motion";
import { Pin, MoreVertical, Pencil, Trash2, Calendar } from "lucide-react";
import { Note } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, current: boolean) => void;
}

export function NoteCard({
  note,
  onEdit,
  onDelete,
  onTogglePin,
}: NoteCardProps) {
  const formattedDate = new Date(note.updated_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      onClick={() => onEdit(note)}
      className={cn(
        "group relative flex flex-col justify-between rounded-xl border p-4 cursor-pointer transition-all duration-200",
        note.is_pinned
          ? "bg-card border-primary/30 shadow-xs ring-1 ring-primary/20"
          : "bg-card border-border hover:border-primary/40 hover:shadow-xs"
      )}
    >
      <div>
        {/* Header: Title + Pin Button + Menu */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {note.title}
          </h3>

          <div
            className="flex items-center gap-1 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => onTogglePin(note.id, note.is_pinned)}
              className={cn(
                "h-7 w-7 flex items-center justify-center rounded-md transition-colors",
                note.is_pinned
                  ? "text-primary hover:bg-primary/10"
                  : "text-muted-foreground/50 hover:text-foreground opacity-0 group-hover:opacity-100"
              )}
              title={note.is_pinned ? "Unpin note" : "Pin note"}
            >
              <Pin className={cn("h-3.5 w-3.5", note.is_pinned && "fill-primary")} />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground/60 hover:text-foreground"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={() => onEdit(note)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTogglePin(note.id, note.is_pinned)}>
                  <Pin className="mr-2 h-3.5 w-3.5" />
                  {note.is_pinned ? "Unpin" : "Pin to Top"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(note.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content Snippet */}
        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-4">
          {note.content || "Empty note..."}
        </p>
      </div>

      {/* Footer: Tags + Timestamp */}
      <div className="space-y-2 pt-2 border-t border-border/40">
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {note.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-4.5 bg-muted/60 text-muted-foreground font-normal"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
          <Calendar className="h-3 w-3" />
          <span>{formattedDate}</span>
        </div>
      </div>
    </motion.div>
  );
}
