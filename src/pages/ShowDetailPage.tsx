import { useState, useRef, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusChip } from "@/components/shared/StatusChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin, Hotel, Phone, Mail, Edit2, Clock, Plus, Trash2, Check, X,
  UserPlus, Car, Coffee, ShoppingBag, DollarSign, ChevronDown, ChevronUp, Guitar
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useShow, useUpdateShow,
  useShowSchedule, useCreateScheduleItem, useDeleteScheduleItem,
  useShowHotel, useUpsertHotel, useDeleteHotel,
  useShowContacts, useCreateContact, useDeleteContact,
  useShowGuestList, useRequestGuest, useUpdateGuestStatus, useDeleteGuest,
  
  useShowOperations, useUpsertOperation, useDeleteShow,
} from "@/hooks/useData";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { format, parseISO, isToday } from "date-fns";
import { toast } from "sonner";
import { EditShowModal } from "@/components/modals/EditShowModal";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePrompt } from "@/components/shared/UpgradePrompt";
import { ShowSwipeNav } from "@/components/tour/ShowSwipeNav";

// ─── Readiness Indicator ─────────────────────────────────
function ReadinessBar({ showId }: { showId: string }) {
  const { data: schedule } = useShowSchedule(showId);
  const { data: hotel } = useShowHotel(showId);
  const { data: contacts } = useShowContacts(showId);
  const { data: guests } = useShowGuestList(showId);
  

  const items = [
    { label: "Schedule", ready: (schedule?.length || 0) > 0 },
    { label: "Hotel", ready: !!hotel },
    { label: "Contacts", ready: (contacts?.length || 0) > 0 },
    { label: "Guest List", ready: (guests?.length || 0) > 0 },
    
  ];

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 px-1">
      {items.map((item) => (
        <StatusChip
          key={item.label}
          label={item.label}
          variant={item.ready ? "success" : "muted"}
          dot
        />
      ))}
    </div>
  );
}

// ─── Collapsible Section ─────────────────────────────────
function Section({ title, icon: Icon, children, defaultOpen = false, count }: { title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean; count?: number }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-border last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3.5 text-sm font-medium transition-colors"
      >
        <span className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
          {count !== undefined && count > 0 && (
            <span className="text-[11px] text-muted-foreground font-normal">{count}</span>
          )}
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="pb-4">{children}</div>}
    </section>
  );
}

// ─── Paid-Only Section (shows UpgradePrompt on Free) ─────
function PaidSection({ title, icon, children, defaultOpen, count }: { title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean; count?: number }) {
  const { plan } = useSubscription();
  const isFree = plan === "free";

  return (
    <Section title={title} icon={icon} defaultOpen={defaultOpen} count={isFree ? undefined : count}>
      {isFree ? (
        <UpgradePrompt feature={title} currentPlan="free" requiredPlan="band" />
      ) : (
        children
      )}
    </Section>
  );
}

// ─── Hotel Section ───────────────────────────────────────
function HotelSection({ showId }: { showId: string }) {
  const { data: hotel } = useShowHotel(showId);
  const upsert = useUpsertHotel();
  const remove = useDeleteHotel();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ hotel_name: "", address: "", confirmation_number: "", check_in: "", check_out: "", notes: "" });

  const startEdit = () => {
    if (hotel) {
      setForm({ hotel_name: hotel.hotel_name, address: hotel.address || "", confirmation_number: hotel.confirmation_number || "", check_in: hotel.check_in || "", check_out: hotel.check_out || "", notes: hotel.notes || "" });
    } else {
      setForm({ hotel_name: "", address: "", confirmation_number: "", check_in: "", check_out: "", notes: "" });
    }
    setEditing(true);
  };

  const handleSave = async () => {
    if (!form.hotel_name.trim()) return;
    try {
      await upsert.mutateAsync({
        id: hotel?.id,
        show_id: showId,
        hotel_name: form.hotel_name.trim(),
        address: form.address.trim() || null,
        confirmation_number: form.confirmation_number.trim() || null,
        check_in: form.check_in.trim() || null,
        check_out: form.check_out.trim() || null,
        notes: form.notes.trim() || null,
      });
      toast.success("Hotel saved");
      setEditing(false);
    } catch { toast.error("Failed to save hotel"); }
  };

  if (editing) {
    return (
      <div className="space-y-3">
        <Input placeholder="Hotel name" value={form.hotel_name} onChange={e => setForm({ ...form, hotel_name: e.target.value })} className="h-11 rounded-xl" autoFocus />
        <Input placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="h-11 rounded-xl" />
        <Input placeholder="Confirmation #" value={form.confirmation_number} onChange={e => setForm({ ...form, confirmation_number: e.target.value })} className="h-11 rounded-xl" />
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Check-in time" value={form.check_in} onChange={e => setForm({ ...form, check_in: e.target.value })} className="h-11 rounded-xl" />
          <Input placeholder="Check-out time" value={form.check_out} onChange={e => setForm({ ...form, check_out: e.target.value })} className="h-11 rounded-xl" />
        </div>
        <Textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="rounded-xl" />
        <div className="flex gap-2">
          <Button size="sm" className="rounded-xl" onClick={handleSave} disabled={upsert.isPending || !form.hotel_name.trim()}>
            <Check className="h-3.5 w-3.5 mr-1" /> Save
          </Button>
          <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => setEditing(false)}><X className="h-3.5 w-3.5 mr-1" /> Cancel</Button>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <button onClick={startEdit} className="text-xs text-accent font-medium hover:underline">
        + Add hotel
      </button>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-4 relative">
      <div className="absolute top-3 right-3 flex gap-1">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={startEdit}><Edit2 className="h-3 w-3" /></Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={async () => { await remove.mutateAsync({ id: hotel.id, showId }); toast.success("Hotel removed"); }}><Trash2 className="h-3 w-3" /></Button>
      </div>
      <p className="font-semibold text-sm">{hotel.hotel_name}</p>
      {hotel.address && <p className="text-xs text-muted-foreground mt-0.5">{hotel.address}</p>}
      {hotel.confirmation_number && <p className="text-xs text-muted-foreground">Conf #{hotel.confirmation_number}</p>}
      <p className="text-xs text-muted-foreground">
        {hotel.check_in && `In ${hotel.check_in}`}
        {hotel.check_in && hotel.check_out && " · "}
        {hotel.check_out && `Out ${hotel.check_out}`}
      </p>
      {hotel.notes && <p className="text-xs text-muted-foreground mt-1 italic">{hotel.notes}</p>}
    </div>
  );
}

// ─── Schedule Section ────────────────────────────────────
function ScheduleSection({ showId, timezone }: { showId: string; timezone?: string }) {
  const { data: items } = useShowSchedule(showId);
  const create = useCreateScheduleItem();
  const remove = useDeleteScheduleItem();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");

  const handleAdd = async () => {
    if (!title.trim()) return;
    try {
      await create.mutateAsync({ show_id: showId, title: title.trim(), starts_at: time || null, sort_order: (items?.length || 0) });
      setTitle(""); setTime(""); setAdding(false);
      toast.success("Added");
    } catch { toast.error("Failed to add item"); }
  };

  return (
    <div>
      {items && items.length > 0 && (
        <div className="rounded-2xl border bg-card shadow-sm mb-3 overflow-hidden">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0">
              <div className="flex items-center gap-3">
                <span className="w-[56px] text-xs font-medium tabular-nums text-muted-foreground">
                  {item.starts_at ? (() => { try { return format(parseISO(item.starts_at), "h:mm a"); } catch { return item.starts_at; } })() : "—"}
                </span>
                <span className="text-sm">{item.title}</span>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0" onClick={() => remove.mutate({ id: item.id, showId })}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      {adding ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="h-10 w-28 rounded-xl" />
            <Input placeholder="Item title" value={title} onChange={e => setTitle(e.target.value)} className="h-10 flex-1 rounded-xl" autoFocus />
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="rounded-xl" onClick={handleAdd} disabled={create.isPending || !title.trim()}><Check className="h-3.5 w-3.5 mr-1" /> Add</Button>
            <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => setAdding(false)}><X className="h-3.5 w-3.5 mr-1" /> Cancel</Button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="text-xs text-accent font-medium hover:underline">
          + Add item
        </button>
      )}
    </div>
  );
}

// ─── Contacts Section ────────────────────────────────────
function ContactsSection({ showId }: { showId: string }) {
  const { data: contacts } = useShowContacts(showId);
  const create = useCreateContact();
  const remove = useDeleteContact();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", phone: "", email: "" });

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    try {
      await create.mutateAsync({ show_id: showId, name: form.name.trim(), role: form.role.trim() || null, phone: form.phone.trim() || null, email: form.email.trim() || null });
      setForm({ name: "", role: "", phone: "", email: "" }); setAdding(false);
      toast.success("Contact added");
    } catch { toast.error("Failed to add contact"); }
  };

  return (
    <div>
      {contacts && contacts.length > 0 && (
        <div className="space-y-2 mb-3">
          {contacts.map(c => (
            <div key={c.id} className="rounded-2xl border bg-card p-4 relative">
              <Button size="icon" variant="ghost" className="absolute top-3 right-3 h-7 w-7 text-destructive" onClick={() => remove.mutate({ id: c.id, showId })}>
                <Trash2 className="h-3 w-3" />
              </Button>
              <p className="font-semibold text-sm">{c.name}</p>
              {c.role && <p className="text-xs text-muted-foreground">{c.role}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                {c.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-1 rounded-xl bg-muted px-2.5 py-1.5 text-xs font-medium press-scale"><Phone className="h-3 w-3" />{c.phone}</a>}
                {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-1 rounded-xl bg-muted px-2.5 py-1.5 text-xs font-medium press-scale"><Mail className="h-3 w-3" />{c.email}</a>}
              </div>
            </div>
          ))}
        </div>
      )}
      {adding ? (
        <div className="space-y-2">
          <Input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-10 rounded-xl" autoFocus />
          <Input placeholder="Role (e.g. Promoter)" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="h-10 rounded-xl" />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="h-10 rounded-xl" />
            <Input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="h-10 rounded-xl" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="rounded-xl" onClick={handleAdd} disabled={create.isPending || !form.name.trim()}><Check className="h-3.5 w-3.5 mr-1" /> Add</Button>
            <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => setAdding(false)}><X className="h-3.5 w-3.5 mr-1" /> Cancel</Button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="text-xs text-accent font-medium hover:underline">
          + Add contact
        </button>
      )}
    </div>
  );
}

// ─── Guest List Section ──────────────────────────────────
function GuestListSection({ showId }: { showId: string }) {
  const { data: guests } = useShowGuestList(showId);
  const request = useRequestGuest();
  const updateStatus = useUpdateGuestStatus();
  const remove = useDeleteGuest();
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [count, setCount] = useState("1");
  const [notes, setNotes] = useState("");

  const isAdmin = currentOrg && ["owner", "admin", "tm"].includes(currentOrg.role);
  const totalGuests = guests?.reduce((sum, g) => sum + g.guest_count, 0) || 0;

  const handleAdd = async () => {
    if (!name.trim()) return;
    try {
      await request.mutateAsync({ show_id: showId, guest_name: name.trim(), guest_count: parseInt(count) || 1, notes: notes.trim() || null });
      setName(""); setCount("1"); setNotes(""); setAdding(false);
      toast.success("Added to guest list");
    } catch { toast.error("Failed to add guest"); }
  };

  return (
    <div>
      {guests && guests.length > 0 && (
        <>
          <p className="text-[11px] text-muted-foreground mb-2">{totalGuests} guest{totalGuests !== 1 ? "s" : ""} across {guests.length} request{guests.length !== 1 ? "s" : ""}</p>
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden mb-3">
            {guests.map(entry => (
              <div key={entry.id} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{entry.guest_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    +{entry.guest_count} · {entry.requested_by === user?.id ? "You" : (entry.requester as any)?.full_name || "Member"}
                  </p>
                  {entry.notes && <p className="text-[11px] text-muted-foreground italic mt-0.5">{entry.notes}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {isAdmin && entry.status === "pending" && (
                    <>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-success" onClick={() => updateStatus.mutate({ id: entry.id, status: "confirmed", showId })}><Check className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => updateStatus.mutate({ id: entry.id, status: "declined", showId })}><X className="h-3.5 w-3.5" /></Button>
                    </>
                  )}
                  <StatusChip
                    label={entry.status === "confirmed" ? "✓" : entry.status === "declined" ? "✗" : "…"}
                    variant={entry.status === "confirmed" ? "success" : entry.status === "declined" ? "destructive" : "warning"}
                  />
                  {isAdmin && <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove.mutate({ id: entry.id, showId })}><Trash2 className="h-3 w-3" /></Button>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {guests && guests.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground mb-2">No guest requests yet</p>
      )}
      {adding ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input placeholder="Guest name" value={name} onChange={e => setName(e.target.value)} className="h-10 flex-1 rounded-xl" autoFocus />
            <Input type="number" min="1" placeholder="#" value={count} onChange={e => setCount(e.target.value)} className="h-10 w-16 rounded-xl" />
          </div>
          <Input placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} className="h-10 rounded-xl" />
          <div className="flex gap-2">
            <Button size="sm" className="rounded-xl" onClick={handleAdd} disabled={request.isPending || !name.trim()}><Check className="h-3.5 w-3.5 mr-1" /> Add</Button>
            <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => setAdding(false)}><X className="h-3.5 w-3.5 mr-1" /> Cancel</Button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="text-xs text-accent font-medium hover:underline">
          + Add to guest list
        </button>
      )}
    </div>
  );
}


// ─── Operations Section ──────────────────────────────────
const OPS_SECTIONS = [
  { key: "parking", label: "Parking", icon: Car },
  { key: "hospitality", label: "Hospitality", icon: Coffee },
  { key: "merch", label: "Merch", icon: ShoppingBag },
  { key: "settlement", label: "Settlement", icon: DollarSign },
] as const;

function OpsSection({ showId }: { showId: string }) {
  const { data: ops } = useShowOperations(showId);
  const upsert = useUpsertOperation();
  const [editing, setEditing] = useState<string | null>(null);
  const [content, setContent] = useState("");

  const getOp = (section: string) => ops?.find(o => o.section === section);

  const handleSave = async (section: string) => {
    const existing = getOp(section);
    try {
      await upsert.mutateAsync({ id: existing?.id, show_id: showId, section, content: content.trim() });
      toast.success("Saved");
      setEditing(null);
    } catch { toast.error("Failed to save"); }
  };

  return (
    <div className="space-y-3">
      {OPS_SECTIONS.map(({ key, label, icon: Icon }) => {
        const op = getOp(key);
        const isEditing = editing === key;
        return (
          <div key={key} className="rounded-xl border p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5 text-sm font-medium"><Icon className="h-3.5 w-3.5 text-muted-foreground" />{label}</span>
              {!isEditing && (
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(key); setContent(op?.content || ""); }}>
                  <Edit2 className="h-3 w-3" />
                </Button>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <Textarea value={content} onChange={e => setContent(e.target.value)} rows={3} placeholder={`${label} notes...`} className="rounded-xl" autoFocus />
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-xl" onClick={() => handleSave(key)} disabled={upsert.isPending}><Check className="h-3.5 w-3.5 mr-1" /> Save</Button>
                  <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => setEditing(null)}><X className="h-3.5 w-3.5 mr-1" /> Cancel</Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{op?.content || "No notes yet"}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────
export default function ShowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const { currentOrg } = useOrg();
  const deleteShow = useDeleteShow();
  // Swipe navigation state
  const touchStartX = useRef(0);
  const touchDelta = useRef(0);

  const { data: show, isLoading } = useShow(id!);
  const { data: schedule } = useShowSchedule(id!);
  const { data: contacts } = useShowContacts(id!);
  const { data: guests } = useShowGuestList(id!);
  const isPrivileged = currentOrg && ["owner", "admin", "tm"].includes(currentOrg.role);

  const handleDeleteShow = async () => {
    if (!show || !confirm(`Delete "${show.venue}"? This cannot be undone.`)) return;
    try {
      await deleteShow.mutateAsync(show.id);
      toast.success("Show deleted");
      navigate(-1);
    } catch { toast.error("Failed to delete show"); }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="h-8 w-48 animate-pulse rounded bg-muted mt-8" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      </div>
    );
  }

  if (!show) {
    return <div className="page-container"><PageHeader title="Show not found" back /></div>;
  }

  const showDate = parseISO(show.date + "T00:00:00");
  const today = isToday(showDate);

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title={show.venue}
        subtitle={[show.city, format(showDate, "MMM d, yyyy"), show.capacity ? `${show.capacity.toLocaleString()} cap` : null].filter(Boolean).join(" · ")}
        back
        sticky
        action={
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditOpen(true)}>
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
        }
      />

      {/* Tour show navigation */}
      {show.tour_id && <ShowSwipeNav showId={id!} tourId={show.tour_id} />}

      {/* Status + Readiness */}
      <div className="mt-1 space-y-2">
        {today && (
          <div className="flex">
            <StatusChip label="Show Day" variant="accent" />
          </div>
        )}
        {show.address && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span>{show.address}</span>
          </div>
        )}
        <ReadinessBar showId={id!} />
      </div>

      {/* Sections */}
      <div className="mt-5">
        <Section title="Schedule" icon={Clock} defaultOpen count={schedule?.length}>
          <ScheduleSection showId={id!} />
        </Section>

        <PaidSection title="Hotel" icon={Hotel}>
          <HotelSection showId={id!} />
        </PaidSection>

        <PaidSection title="Contacts" icon={Phone} count={contacts?.length}>
          <ContactsSection showId={id!} />
        </PaidSection>

        <PaidSection title="Guest List" icon={UserPlus} count={guests?.length}>
          <GuestListSection showId={id!} />
        </PaidSection>


        <PaidSection title="Operations" icon={Car}>
          <OpsSection showId={id!} />
        </PaidSection>

        {(show.gear_notes || show.notes) && (
          <PaidSection title="Notes & Gear" icon={Guitar}>
            <div className="space-y-3">
              {show.gear_notes && (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Gear</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{show.gear_notes}</p>
                </div>
              )}
              {show.notes && (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{show.notes}</p>
                </div>
              )}
            </div>
          </PaidSection>
        )}
      </div>

      {/* Danger Zone */}
      {isPrivileged && (
        <section className="mt-10 rounded-2xl border border-destructive/20 p-4">
          <p className="text-xs font-semibold text-destructive mb-2">Danger Zone</p>
          <p className="text-xs text-muted-foreground mb-3">
            Permanently delete this show and all its data.
          </p>
          <Button size="sm" variant="destructive" className="rounded-xl text-xs" onClick={handleDeleteShow}>
            Delete Show
          </Button>
        </section>
      )}

      {show && <EditShowModal open={editOpen} onOpenChange={setEditOpen} show={show} />}
    </div>
  );
}
