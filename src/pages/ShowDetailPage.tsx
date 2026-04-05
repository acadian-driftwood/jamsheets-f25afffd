import { useState, useRef } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusChip } from "@/components/shared/StatusChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin, Hotel, Phone, Mail, Edit2, Clock, Plus, Trash2, Check, X,
  UserPlus, FileText, Upload, Car, Coffee, ShoppingBag, DollarSign, ChevronDown, ChevronUp, Guitar
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useShow, useUpdateShow,
  useShowSchedule, useCreateScheduleItem, useDeleteScheduleItem,
  useShowHotel, useUpsertHotel, useDeleteHotel,
  useShowContacts, useCreateContact, useDeleteContact,
  useShowGuestList, useRequestGuest, useUpdateGuestStatus, useDeleteGuest,
  useShowDocuments, useUploadDocument, useDeleteDocument,
  useShowOperations, useUpsertOperation,
} from "@/hooks/useData";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { format, parseISO, isToday } from "date-fns";
import { toast } from "sonner";
import { EditShowModal } from "@/components/modals/EditShowModal";

// ─── Collapsible Section ─────────────────────────────────
function Section({ title, icon: Icon, children, defaultOpen = false }: { title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pt-1 pb-2">{children}</div>}
    </section>
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
        <Input placeholder="Hotel name" value={form.hotel_name} onChange={e => setForm({ ...form, hotel_name: e.target.value })} className="h-10" />
        <Input placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="h-10" />
        <Input placeholder="Confirmation #" value={form.confirmation_number} onChange={e => setForm({ ...form, confirmation_number: e.target.value })} className="h-10" />
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Check-in time" value={form.check_in} onChange={e => setForm({ ...form, check_in: e.target.value })} className="h-10" />
          <Input placeholder="Check-out time" value={form.check_out} onChange={e => setForm({ ...form, check_out: e.target.value })} className="h-10" />
        </div>
        <Textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={upsert.isPending || !form.hotel_name.trim()}>
            <Check className="h-3.5 w-3.5 mr-1" /> Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><X className="h-3.5 w-3.5 mr-1" /> Cancel</Button>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <Button size="sm" variant="outline" onClick={startEdit} className="gap-1.5">
        <Plus className="h-3.5 w-3.5" /> Add Hotel
      </Button>
    );
  }

  return (
    <div className="card-elevated relative">
      <div className="absolute top-2 right-2 flex gap-1">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={startEdit}><Edit2 className="h-3 w-3" /></Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={async () => { await remove.mutateAsync({ id: hotel.id, showId }); toast.success("Hotel removed"); }}><Trash2 className="h-3 w-3" /></Button>
      </div>
      <p className="font-semibold text-sm">{hotel.hotel_name}</p>
      {hotel.address && <p className="text-xs text-muted-foreground mt-0.5">{hotel.address}</p>}
      {hotel.confirmation_number && <p className="text-xs text-muted-foreground">Conf #{hotel.confirmation_number}</p>}
      <p className="text-xs text-muted-foreground">
        {hotel.check_in && `Check-in ${hotel.check_in}`}
        {hotel.check_in && hotel.check_out && " · "}
        {hotel.check_out && `Check-out ${hotel.check_out}`}
      </p>
      {hotel.notes && <p className="text-xs text-muted-foreground mt-1">{hotel.notes}</p>}
    </div>
  );
}

// ─── Schedule Section ────────────────────────────────────
function ScheduleSection({ showId }: { showId: string }) {
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
      toast.success("Schedule item added");
    } catch { toast.error("Failed to add item"); }
  };

  return (
    <div>
      {items && items.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm mb-3">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between px-3 py-2.5 border-b last:border-b-0">
              <div className="flex items-center gap-3">
                <span className="w-[60px] text-xs font-medium tabular-nums text-muted-foreground">
                  {item.starts_at ? (() => { try { return format(parseISO(item.starts_at), "h:mm a"); } catch { return item.starts_at; } })() : "—"}
                </span>
                <span className="text-sm font-medium">{item.title}</span>
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
            <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="h-9 w-28" />
            <Input placeholder="Item title" value={title} onChange={e => setTitle(e.target.value)} className="h-9 flex-1" autoFocus />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={create.isPending || !title.trim()}><Check className="h-3.5 w-3.5 mr-1" /> Add</Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}><X className="h-3.5 w-3.5 mr-1" /> Cancel</Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add Item</Button>
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
            <div key={c.id} className="card-elevated relative">
              <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7 text-destructive" onClick={() => remove.mutate({ id: c.id, showId })}>
                <Trash2 className="h-3 w-3" />
              </Button>
              <p className="font-semibold text-sm">{c.name}</p>
              {c.role && <p className="text-xs text-muted-foreground">{c.role}</p>}
              <div className="mt-1.5 flex gap-2">
                {c.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium"><Phone className="h-3 w-3" />{c.phone}</a>}
                {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium"><Mail className="h-3 w-3" />{c.email}</a>}
              </div>
            </div>
          ))}
        </div>
      )}
      {adding ? (
        <div className="space-y-2">
          <Input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-9" autoFocus />
          <Input placeholder="Role (e.g. Promoter)" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="h-9" />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="h-9" />
            <Input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="h-9" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={create.isPending || !form.name.trim()}><Check className="h-3.5 w-3.5 mr-1" /> Add</Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}><X className="h-3.5 w-3.5 mr-1" /> Cancel</Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add Contact</Button>
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
      toast.success("Guest requested");
    } catch { toast.error("Failed to add guest"); }
  };

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">Total: {totalGuests} guests across {guests?.length || 0} requests</p>
      {guests && guests.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden mb-3">
          {guests.map(entry => (
            <div key={entry.id} className="flex items-center justify-between px-3 py-2.5 border-b last:border-b-0">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{entry.guest_name}</p>
                <p className="text-xs text-muted-foreground">
                  +{entry.guest_count} · {entry.requested_by === user?.id ? "You" : (entry.requester as any)?.full_name || "Member"}
                </p>
                {entry.notes && <p className="text-xs text-muted-foreground italic">{entry.notes}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                {isAdmin && entry.status === "pending" && (
                  <>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => updateStatus.mutate({ id: entry.id, status: "confirmed", showId })}><Check className="h-3.5 w-3.5" /></Button>
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
      )}
      {adding ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input placeholder="Guest name" value={name} onChange={e => setName(e.target.value)} className="h-9 flex-1" autoFocus />
            <Input type="number" min="1" placeholder="#" value={count} onChange={e => setCount(e.target.value)} className="h-9 w-16" />
          </div>
          <Input placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} className="h-9" />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={request.isPending || !name.trim()}><Check className="h-3.5 w-3.5 mr-1" /> Request</Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}><X className="h-3.5 w-3.5 mr-1" /> Cancel</Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Request Guests</Button>
      )}
    </div>
  );
}

// ─── Documents Section ───────────────────────────────────
function DocumentsSection({ showId }: { showId: string }) {
  const { data: docs } = useShowDocuments(showId);
  const upload = useUploadDocument();
  const remove = useDeleteDocument();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await upload.mutateAsync({ showId, file });
      toast.success("Document uploaded");
    } catch { toast.error("Upload failed"); }
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    const { data, error } = await supabase.storage.from("show-documents").download(filePath);
    if (error) { toast.error("Download failed"); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a"); a.href = url; a.download = fileName; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {docs && docs.length > 0 && (
        <div className="space-y-2 mb-3">
          {docs.map(doc => (
            <div key={doc.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
              <button onClick={() => handleDownload(doc.file_path, doc.file_name)} className="flex items-center gap-2 min-w-0 text-left">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{doc.file_name}</p>
                  <p className="text-xs text-muted-foreground">{doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : ""}</p>
                </div>
              </button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0" onClick={() => remove.mutate({ id: doc.id, showId, filePath: doc.file_path })}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
      <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={upload.isPending} className="gap-1.5">
        <Upload className="h-3.5 w-3.5" /> {upload.isPending ? "Uploading..." : "Upload File"}
      </Button>
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
      toast.success(`${section} notes saved`);
      setEditing(null);
    } catch { toast.error("Failed to save"); }
  };

  return (
    <div className="space-y-3">
      {OPS_SECTIONS.map(({ key, label, icon: Icon }) => {
        const op = getOp(key);
        const isEditing = editing === key;
        return (
          <div key={key} className="rounded-lg border p-3">
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
                <Textarea value={content} onChange={e => setContent(e.target.value)} rows={3} placeholder={`${label} notes...`} autoFocus />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleSave(key)} disabled={upsert.isPending}><Check className="h-3.5 w-3.5 mr-1" /> Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="h-3.5 w-3.5 mr-1" /> Cancel</Button>
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

// We need supabase for document download
import { supabase } from "@/integrations/supabase/client";

// ─── Main Page ───────────────────────────────────────────
export default function ShowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);

  const { data: show, isLoading } = useShow(id!);

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="h-8 w-48 animate-pulse rounded bg-muted mt-8" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
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
    <div className="page-container animate-fade-in pb-24">
      <PageHeader
        title={show.venue}
        subtitle={show.city || undefined}
        back
        action={
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            {isPrivileged && (
              <Button variant="ghost" size="icon" className="text-destructive" onClick={handleDeleteShow}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        }
      />

      <div className="mt-2 flex flex-wrap gap-2 px-4">
        {today && <StatusChip label="Show Day" variant="accent" />}
        <StatusChip label={format(showDate, "MMM d, yyyy")} variant="muted" />
        {show.capacity && <StatusChip label={`${show.capacity.toLocaleString()} cap`} variant="muted" />}
      </div>

      {show.address && (
        <div className="mt-3 flex items-center gap-1.5 px-4 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span>{show.address}</span>
        </div>
      )}

      <div className="mt-4 divide-y">
        <Section title="Schedule" icon={Clock} defaultOpen>
          <ScheduleSection showId={id!} />
        </Section>

        <Section title="Hotel" icon={Hotel}>
          <HotelSection showId={id!} />
        </Section>

        <Section title="Contacts" icon={Phone}>
          <ContactsSection showId={id!} />
        </Section>

        <Section title="Guest List" icon={UserPlus} defaultOpen>
          <GuestListSection showId={id!} />
        </Section>

        <Section title="Documents" icon={FileText}>
          <DocumentsSection showId={id!} />
        </Section>

        <Section title="Operations" icon={Car}>
          <OpsSection showId={id!} />
        </Section>

        {(show.gear_notes || show.notes) && (
          <Section title="Notes & Gear" icon={Guitar}>
            <div className="space-y-3">
              {show.gear_notes && (
                <div>
                  <p className="text-xs font-medium mb-1">Gear Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{show.gear_notes}</p>
                </div>
              )}
              {show.notes && (
                <div>
                  <p className="text-xs font-medium mb-1">General Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{show.notes}</p>
                </div>
              )}
            </div>
          </Section>
        )}
      </div>

      {show && <EditShowModal open={editOpen} onOpenChange={setEditOpen} show={show} />}
    </div>
  );
}
