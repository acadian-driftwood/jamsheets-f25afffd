import { PageHeader } from "@/components/layout/PageHeader";
import { StatusChip } from "@/components/shared/StatusChip";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import {
  MapPin, Calendar, Hotel, Phone, Mail, UserPlus, FileText, Guitar, Edit2, Clock
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useShow, useShowSchedule, useShowHotel, useShowContacts, useShowGuestList } from "@/hooks/useData";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO, isToday } from "date-fns";

export default function ShowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: show, isLoading } = useShow(id!);
  const { data: schedule } = useShowSchedule(id!);
  const { data: hotel } = useShowHotel(id!);
  const { data: contacts } = useShowContacts(id!);
  const { data: guestList } = useShowGuestList(id!);

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="h-8 w-48 animate-pulse rounded bg-muted mt-8" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="page-container">
        <PageHeader title="Show not found" back />
      </div>
    );
  }

  const showDate = parseISO(show.date + "T00:00:00");
  const today = isToday(showDate);

  const formatTime = (iso: string) => {
    try {
      return format(parseISO(iso), "h:mm a");
    } catch {
      return iso;
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title={show.venue}
        subtitle={show.city || undefined}
        back
        action={
          <Button variant="ghost" size="icon">
            <Edit2 className="h-4 w-4" />
          </Button>
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

      {/* Schedule */}
      {schedule && schedule.length > 0 && (
        <section className="mt-6">
          <p className="section-title px-4">Schedule</p>
          <div className="mx-4 rounded-xl border bg-card shadow-sm">
            {schedule.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-4 py-3 border-b last:border-b-0">
                <span className="w-[72px] text-sm font-medium tabular-nums text-muted-foreground">
                  {item.starts_at ? formatTime(item.starts_at) : "—"}
                </span>
                <span className="text-sm font-medium">{item.title}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Hotel */}
      {hotel && (
        <section className="mt-6">
          <p className="section-title px-4">Hotel</p>
          <div className="mx-4 card-elevated">
            <div className="flex items-start gap-3">
              <Hotel className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold text-sm">{hotel.hotel_name}</p>
                {hotel.address && <p className="text-xs text-muted-foreground">{hotel.address}</p>}
                {hotel.confirmation_number && <p className="text-xs text-muted-foreground">Conf #{hotel.confirmation_number}</p>}
                <p className="text-xs text-muted-foreground">
                  {hotel.check_in && `Check-in ${hotel.check_in}`}
                  {hotel.check_in && hotel.check_out && " · "}
                  {hotel.check_out && `Check-out ${hotel.check_out}`}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Contacts */}
      {contacts && contacts.length > 0 && (
        <section className="mt-6">
          <p className="section-title px-4">Contacts</p>
          <div className="mx-4 space-y-2">
            {contacts.map((contact) => (
              <div key={contact.id} className="card-elevated">
                <p className="font-semibold text-sm">{contact.name}</p>
                {contact.role && <p className="text-xs text-muted-foreground">{contact.role}</p>}
                <div className="mt-2 flex gap-2">
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium">
                      <Phone className="h-3 w-3" /> Call
                    </a>
                  )}
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium">
                      <Mail className="h-3 w-3" /> Email
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Guest List */}
      {guestList && guestList.length > 0 && (
        <section className="mt-6">
          <p className="section-title px-4">Guest List</p>
          <div className="mx-4 rounded-xl border bg-card shadow-sm overflow-hidden">
            {guestList.map((entry) => {
              const requesterName = entry.requested_by === user?.id 
                ? "You" 
                : (entry.requester as any)?.full_name || "Unknown";
              return (
                <div key={entry.id} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0">
                  <div>
                    <p className="text-sm font-medium">{entry.guest_name}</p>
                    <p className="text-xs text-muted-foreground">
                      +{entry.guest_count} · Requested by {requesterName}
                    </p>
                  </div>
                  <StatusChip
                    label={entry.status === "confirmed" ? "Confirmed" : entry.status === "declined" ? "Declined" : "Pending"}
                    variant={entry.status === "confirmed" ? "success" : entry.status === "declined" ? "destructive" : "warning"}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Gear */}
      {show.gear_notes && (
        <section className="mt-6">
          <p className="section-title px-4">Gear</p>
          <div className="mx-4 card-elevated">
            <div className="flex items-start gap-3">
              <Guitar className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground leading-relaxed">{show.gear_notes}</p>
            </div>
          </div>
        </section>
      )}

      {/* Notes */}
      {show.notes && (
        <section className="mt-6">
          <p className="section-title px-4">Notes</p>
          <div className="mx-4 card-elevated">
            <p className="text-sm text-muted-foreground leading-relaxed">{show.notes}</p>
          </div>
        </section>
      )}
    </div>
  );
}
