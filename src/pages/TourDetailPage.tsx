import { useState, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EditTourModal } from "@/components/modals/EditTourModal";
import { StatusChip } from "@/components/shared/StatusChip";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Plus, Music, Plane, Car, Coffee, MapPin, Pencil, ChevronRight, GripVertical } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useShows, useTourTimeline } from "@/hooks/useData";
import { CreateShowModal } from "@/components/modals/CreateShowModal";
import { CreateTravelModal } from "@/components/modals/CreateTravelModal";
import { CreateDayOffModal } from "@/components/modals/CreateDayOffModal";
import { QuickAddSheet } from "@/components/tour/QuickAddSheet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { format, parseISO, eachDayOfInterval } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type MergedItem = {
  id: string;
  type: string;
  date: string;
  title: string;
  subtitle?: string;
  timeStart?: string;
  showId?: string;
  sortOrder: number;
  source: "show" | "timeline";
};

function SortableItem({
  item,
  isPrivileged,
  showGrip,
  navigate,
  typeIcon,
  chipLabel,
  chipVariant,
  dotColor,
}: {
  item: MergedItem;
  isPrivileged: boolean;
  showGrip: boolean;
  navigate: (path: string) => void;
  typeIcon: (type: string) => any;
  chipLabel: (type: string) => string;
  chipVariant: (type: string) => "accent" | "warning" | "muted";
  dotColor: (type: string) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.9 : 1,
  };

  const Icon = typeIcon(item.type);
  const isShow = item.type === "show";
  const isOffDay = item.type === "off_day";

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <span
        className={cn(
          "absolute -left-[calc(1.25rem+5px)] top-3 timeline-dot",
          dotColor(item.type)
        )}
      />

      {isOffDay ? (
        <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
          {showGrip && isPrivileged && (
            <button {...attributes} {...listeners} className="touch-none cursor-grab active:cursor-grabbing p-0.5 -ml-1">
              <GripVertical className="h-4 w-4 text-muted-foreground/40" />
            </button>
          )}
          <Coffee className="h-3.5 w-3.5" />
          <span>Day off</span>
        </div>
      ) : (
        <div className={cn("flex items-center gap-0", isDragging && "shadow-lg rounded-xl")}>
          {showGrip && isPrivileged && (
            <button {...attributes} {...listeners} className="touch-none cursor-grab active:cursor-grabbing p-0.5 -ml-1 shrink-0">
              <GripVertical className="h-4 w-4 text-muted-foreground/40" />
            </button>
          )}
          <button
            onClick={isShow ? () => navigate(`/shows/${item.showId}`) : undefined}
            className={cn(
              "w-full rounded-xl border bg-card p-3 text-left transition-all press-scale",
              isShow && "active:bg-muted/40"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold truncate">{item.title}</span>
                  <StatusChip label={chipLabel(item.type)} variant={chipVariant(item.type)} />
                </div>
                {item.subtitle && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{item.subtitle}</p>
                )}
                {item.timeStart && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">{item.timeStart}</p>
                )}
              </div>
              {isShow && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />}
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

export default function TourDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [showTravel, setShowTravel] = useState(false);
  const [showDayOff, setShowDayOff] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [travelSubtype, setTravelSubtype] = useState<string | undefined>();
  const { currentOrg } = useOrg();
  const qc = useQueryClient();

  const isPrivileged = currentOrg && ["owner", "admin", "tm"].includes(currentOrg.role);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const { data: tour } = useQuery({
    queryKey: ["tour", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("tours").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const deleteTour = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tours").delete().eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tours"] });
      toast.success("Tour deleted");
      navigate("/tours");
    },
  });

  const handleDelete = () => {
    if (!tour || !confirm(`Delete "${tour.name}" and all its shows? This cannot be undone.`)) return;
    deleteTour.mutate();
  };

  const { data: shows, isLoading: showsLoading } = useShows(id);
  const { data: timelineItems } = useTourTimeline(id!);

  // Merge shows + timeline items
  const merged: MergedItem[] = useMemo(() => {
    const items: MergedItem[] = [];
    shows?.forEach((s) => {
      items.push({
        id: s.id,
        type: "show",
        date: s.date,
        title: s.venue,
        subtitle: s.city || undefined,
        showId: s.id,
        sortOrder: (s as any).sort_order ?? 0,
        source: "show",
      });
    });
    timelineItems?.forEach((t) => {
      items.push({
        id: t.id,
        type: t.type,
        date: t.date,
        title: t.title,
        subtitle: t.subtitle || undefined,
        timeStart: t.time_start || undefined,
        sortOrder: (t as any).sort_order ?? 0,
        source: "timeline",
      });
    });
    items.sort((a, b) => a.date.localeCompare(b.date) || a.sortOrder - b.sortOrder);
    return items;
  }, [shows, timelineItems]);

  // Build full date range
  const allDays = useMemo(() => {
    if (!tour?.start_date || !tour?.end_date) return [];
    try {
      return eachDayOfInterval({
        start: parseISO(tour.start_date + "T00:00:00"),
        end: parseISO(tour.end_date + "T00:00:00"),
      }).map((d) => format(d, "yyyy-MM-dd"));
    } catch {
      return [];
    }
  }, [tour?.start_date, tour?.end_date]);

  // Group items by date
  const itemsByDate = useMemo(() => {
    const map: Record<string, MergedItem[]> = {};
    merged.forEach((item) => {
      if (!map[item.date]) map[item.date] = [];
      map[item.date].push(item);
    });
    return map;
  }, [merged]);

  // Stats
  const stats = useMemo(() => {
    const showDays = new Set<string>();
    const travelDays = new Set<string>();
    const offDays = new Set<string>();
    merged.forEach((item) => {
      if (item.type === "show") showDays.add(item.date);
      else if (item.type === "off_day") offDays.add(item.date);
      else travelDays.add(item.date);
    });
    const emptyCount = allDays.filter((d) => !itemsByDate[d]?.length).length;
    return { total: allDays.length, shows: showDays.size, travel: travelDays.size, off: offDays.size, empty: emptyCount };
  }, [merged, allDays, itemsByDate]);

  const formatDates = () => {
    if (!tour?.start_date) return "";
    const start = format(parseISO(tour.start_date + "T00:00:00"), "MMM d");
    if (!tour?.end_date) return start;
    return `${start} – ${format(parseISO(tour.end_date + "T00:00:00"), "MMM d, yyyy")}`;
  };

  const dotColor = (type: string) => {
    if (type === "show") return "bg-accent";
    if (type === "flight") return "bg-accent/60";
    if (type === "driving") return "bg-warning";
    return "bg-muted-foreground/30";
  };

  const typeIcon = (type: string) => {
    if (type === "show") return Music;
    if (type === "flight") return Plane;
    if (type === "driving") return MapPin;
    if (type === "off_day") return Coffee;
    return Car;
  };

  const chipLabel = (type: string) => {
    if (type === "show") return "Show";
    if (type === "off_day") return "Day off";
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const chipVariant = (type: string): "accent" | "warning" | "muted" => {
    if (type === "show" || type === "flight") return "accent";
    if (type === "driving") return "warning";
    return "muted";
  };

  const handleQuickAdd = (date: string) => {
    setSelectedDate(date);
    setQuickAddOpen(true);
  };

  const handleQuickAddSelect = (type: "show" | "flight" | "rental" | "driving" | "day_off") => {
    if (type === "show") {
      setShowCreate(true);
    } else if (type === "day_off") {
      setShowDayOff(true);
    } else {
      setTravelSubtype(type);
      setShowTravel(true);
    }
  };

  const handleDragEnd = useCallback(
    async (event: DragEndEvent, date: string) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const dayItems = itemsByDate[date];
      if (!dayItems) return;

      const oldIndex = dayItems.findIndex((i) => i.id === active.id);
      const newIndex = dayItems.findIndex((i) => i.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(dayItems, oldIndex, newIndex);

      // Persist sort_order updates
      const updates = reordered.map((item, idx) => ({
        id: item.id,
        sortOrder: idx,
        source: item.source,
      }));

      try {
        await Promise.all(
          updates.map((u) => {
            const table = u.source === "show" ? "shows" : "tour_timeline_items";
            return supabase
              .from(table)
              .update({ sort_order: u.sortOrder } as any)
              .eq("id", u.id)
              .throwOnError();
          })
        );
        qc.invalidateQueries({ queryKey: ["shows"] });
        qc.invalidateQueries({ queryKey: ["tour-timeline", id] });
      } catch {
        toast.error("Failed to reorder items");
      }
    },
    [itemsByDate, id, qc]
  );

  // Determine which days to render
  const daysToRender = allDays.length > 0 ? allDays : Object.keys(itemsByDate).sort();

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title={tour?.name || "Tour"}
        subtitle={formatDates()}
        back
        sticky
        action={
          isPrivileged ? (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowEdit(true)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          ) : undefined
        }
      />

      {/* Summary bar */}
      {allDays.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
          <span>{stats.total} days</span>
          <span>·</span>
          <span>{stats.shows} shows</span>
          <span>·</span>
          <span>{stats.travel} travel</span>
          <span>·</span>
          <span>{stats.off} off</span>
          {stats.empty > 0 && (
            <>
              <span>·</span>
              <span className="text-warning">{stats.empty} empty</span>
            </>
          )}
        </div>
      )}

      <section className="mt-4">
        {showsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : daysToRender.length === 0 ? (
          <EmptyState
            icon={Music}
            title="Nothing planned yet"
            description="Add shows and travel to build your tour timeline."
            action={
              <Button size="sm" className="rounded-xl" onClick={() => setShowCreate(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Show
              </Button>
            }
          />
        ) : (
          <div className="space-y-0">
            {daysToRender.map((date) => {
              const items = itemsByDate[date] || [];
              const isEmpty = items.length === 0;
              const showGrip = items.length >= 2;

              return (
                <div key={date}>
                  <p className="date-divider">
                    {format(parseISO(date + "T00:00:00"), "EEE, MMM d")}
                  </p>

                  <div className="relative ml-3 border-l border-border pl-5 space-y-2 pb-4">
                    {isEmpty ? (
                      /* Empty day */
                      <div className="relative">
                        <span className="absolute -left-[calc(1.25rem+5px)] top-3 timeline-dot bg-muted-foreground/20" />
                        {isPrivileged ? (
                          <button
                            onClick={() => handleQuickAdd(date)}
                            className="w-full rounded-xl border border-dashed border-border/60 bg-muted/20 p-3 text-left transition-all hover:bg-muted/40"
                          >
                            <div className="flex items-center gap-2.5">
                              <Plus className="h-4 w-4 text-muted-foreground/50" />
                              <span className="text-xs text-muted-foreground">Nothing planned</span>
                            </div>
                          </button>
                        ) : (
                          <div className="py-2 text-xs text-muted-foreground pl-1">Nothing planned</div>
                        )}
                      </div>
                    ) : showGrip && isPrivileged ? (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(e) => handleDragEnd(e, date)}
                      >
                        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                          {items.map((item) => (
                            <SortableItem
                              key={item.id}
                              item={item}
                              isPrivileged={!!isPrivileged}
                              showGrip={showGrip}
                              navigate={navigate}
                              typeIcon={typeIcon}
                              chipLabel={chipLabel}
                              chipVariant={chipVariant}
                              dotColor={dotColor}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    ) : (
                      items.map((item) => {
                        const Icon = typeIcon(item.type);
                        const isShow = item.type === "show";
                        const isOffDay = item.type === "off_day";

                        return (
                          <div key={item.id} className="relative">
                            <span
                              className={cn(
                                "absolute -left-[calc(1.25rem+5px)] top-3 timeline-dot",
                                dotColor(item.type)
                              )}
                            />

                            {isOffDay ? (
                              <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                                <Coffee className="h-3.5 w-3.5" />
                                <span>Day off</span>
                              </div>
                            ) : (
                              <button
                                onClick={isShow ? () => navigate(`/shows/${item.showId}`) : undefined}
                                className={cn(
                                  "w-full rounded-xl border bg-card p-3 text-left transition-all press-scale",
                                  isShow && "active:bg-muted/40"
                                )}
                              >
                                <div className="flex items-center gap-2.5">
                                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-semibold truncate">{item.title}</span>
                                      <StatusChip label={chipLabel(item.type)} variant={chipVariant(item.type)} />
                                    </div>
                                    {item.subtitle && (
                                      <p className="text-xs text-muted-foreground truncate mt-0.5">{item.subtitle}</p>
                                    )}
                                    {item.timeStart && (
                                      <p className="text-[11px] text-muted-foreground mt-0.5">{item.timeStart}</p>
                                    )}
                                  </div>
                                  {isShow && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />}
                                </div>
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}

                    {/* Quick-add on filled days too */}
                    {!isEmpty && isPrivileged && (
                      <div className="relative">
                        <button
                          onClick={() => handleQuickAdd(date)}
                          className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors pl-0.5"
                        >
                          <Plus className="h-3 w-3" /> Add
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Danger Zone */}
      {isPrivileged && tour && (
        <section className="mt-10 rounded-2xl border border-destructive/20 p-4">
          <p className="text-xs font-semibold text-destructive mb-2">Danger Zone</p>
          <p className="text-xs text-muted-foreground mb-3">
            Permanently delete this tour and all its data.
          </p>
          <Button size="sm" variant="destructive" className="rounded-xl text-xs" onClick={handleDelete}>
            Delete Tour
          </Button>
        </section>
      )}

      <CreateShowModal open={showCreate} onOpenChange={setShowCreate} defaultTourId={id} defaultDate={selectedDate || undefined} />
      {id && <CreateTravelModal open={showTravel} onOpenChange={setShowTravel} tourId={id} defaultDate={selectedDate || undefined} />}
      {id && <CreateDayOffModal open={showDayOff} onOpenChange={setShowDayOff} tourId={id} defaultDate={selectedDate || undefined} />}
      {tour && <EditTourModal open={showEdit} onOpenChange={setShowEdit} tour={tour} />}
      <QuickAddSheet
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        date={selectedDate ? format(parseISO(selectedDate + "T00:00:00"), "EEE, MMM d") : ""}
        onSelect={handleQuickAddSelect}
      />
    </div>
  );
}
