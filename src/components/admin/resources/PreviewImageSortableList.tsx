"use client";

import Image from "next/image";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { MediaPreview, PickerIconButton, PreviewCard } from "@/design-system";
import { shouldBypassImageOptimizer } from "@/lib/imageDelivery";

interface PreviewImageSortableListProps {
  images: string[];
  onReorder: (next: string[]) => void;
  onRemoveIndex: (index: number) => void;
  onSetCover?: (index: number) => void;
}

interface SortableItemProps {
  id: string;
  index: number;
  url: string;
  onRemove: (index: number) => void;
  onSetCover?: (index: number) => void;
}

function SortableItem({ id, index, url, onRemove, onSetCover }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "ring-2 ring-brand-400 rounded-xl" : undefined}
    >
      <PreviewCard className="flex items-center gap-3 border-border bg-card px-3 py-2 shadow-sm transition">
      <button
        type="button"
        className="cursor-grab text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
        aria-label="Reorder image"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <MediaPreview className="h-16 w-24 shrink-0">
        <Image
          src={url}
          alt=""
          fill
          sizes="96px"
          unoptimized={shouldBypassImageOptimizer(url)}
          className="object-cover"
        />
      </MediaPreview>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] text-foreground">{url}</p>
        {index === 0 ? (
          <p className="text-[11px] font-medium text-brand-600">Cover</p>
        ) : onSetCover ? (
          <button
            type="button"
            onClick={() => onSetCover(index)}
            className="text-[11px] text-brand-600 hover:underline"
          >
            Set as cover
          </button>
        ) : null}
      </div>

      <PickerIconButton
        onClick={() => onRemove(index)}
        tone="danger"
        aria-label="Remove image"
      >
        <Trash2 className="h-4 w-4" />
      </PickerIconButton>
      </PreviewCard>
    </div>
  );
}

export function PreviewImageSortableList({
  images,
  onReorder,
  onRemoveIndex,
  onSetCover,
}: PreviewImageSortableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((url) => url === active.id);
    const newIndex = images.findIndex((url) => url === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(images, oldIndex, newIndex);
    onReorder(next);
  }

  if (images.length === 0) {
    return null;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={images}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {images.map((url, index) => (
            <SortableItem
              key={url}
              id={url}
              index={index}
              url={url}
              onRemove={onRemoveIndex}
              onSetCover={onSetCover}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
