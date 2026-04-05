import { PageHeader } from "@/components/layout/PageHeader";
import { StatusChip } from "@/components/shared/StatusChip";
import { Button } from "@/components/ui/button";
import {
  MapPin, Clock, Calendar, Hotel, Users, ListMusic, FileText, Guitar,
  Phone, Mail, UserPlus, Check, X, Edit2
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

const demoShow = {
  venue: "The Fillmore",
  city: "San Francisco, CA",
  address: "1805 Geary Blvd, San Francisco, CA 94115",
  date: "Jun 15, 2025",
  tourName: "West Coast Summer 2025",
  capacity: "1,150",
  schedule: [
    { time: "2:00 PM", title: "Load In" },
    { time: "4:00 PM", title: "Soundcheck" },
    { time: "5:30 PM", title: "Dinner" },
    { time: "7:00 PM", title: "Doors" },
    { time: "8:00 PM", title: "Showtime" },
    { time: "10:30 PM", title: "Load Out" },
  ],
  hotel: {
    name: "Hotel Nikko San Francisco",
    address: "222 Mason St, San Francisco, CA",
    confirmation: "4821-ABCD",
    checkIn: "3:00 PM",
    checkOut: "11:00 AM",
  },
  contacts: [
    { name: "Sarah Chen", role: "Venue Manager", phone: "(415) 555-0123", email: "sarah@fillmore.com" },
    { name: "Mike Torres", role: "Sound Engineer", phone: "(415) 555-0456", email: "mike@fillmore.com" },
  ],
  guestList: [
    { name: "You", guests: 2, status: "confirmed" as const },
    { name: "Alex Rivera", guests: 1, status: "pending" as const },
    { name: "Jamie Park", guests: 3, status: "confirmed" as const },
  ],
  gearNotes: "Backline provided: Ampeg SVT, Marshall JCM800 full stack. Bring own guitars, pedals, snare, cymbals.",
};

export default function ShowDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title={demoShow.venue}
        subtitle={demoShow.city}
        back
        action={
          <Button variant="ghost" size="icon">
            <Edit2 className="h-4 w-4" />
          </Button>
        }
      />

      {/* Meta */}
      <div className="mt-2 flex flex-wrap gap-2 px-4">
        <StatusChip label="Show Day" variant="accent" />
        <StatusChip label={demoShow.tourName} variant="muted" />
      </div>

      <div className="mt-4 flex items-center gap-3 px-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{demoShow.date}</span>
        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{demoShow.capacity} cap</span>
      </div>

      {/* Schedule */}
      <section className="mt-6">
        <p className="section-title px-4">Schedule</p>
        <div className="mx-4 rounded-xl border bg-card shadow-sm">
          {demoShow.schedule.map((item, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-b-0">
              <span className="w-[72px] text-sm font-medium tabular-nums text-muted-foreground">{item.time}</span>
              <span className="text-sm font-medium">{item.title}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Hotel */}
      <section className="mt-6">
        <p className="section-title px-4">Hotel</p>
        <div className="mx-4 card-elevated">
          <div className="flex items-start gap-3">
            <Hotel className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold text-sm">{demoShow.hotel.name}</p>
              <p className="text-xs text-muted-foreground">{demoShow.hotel.address}</p>
              <p className="text-xs text-muted-foreground">Conf #{demoShow.hotel.confirmation}</p>
              <p className="text-xs text-muted-foreground">Check-in {demoShow.hotel.checkIn} · Check-out {demoShow.hotel.checkOut}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contacts */}
      <section className="mt-6">
        <p className="section-title px-4">Contacts</p>
        <div className="mx-4 space-y-2">
          {demoShow.contacts.map((contact, i) => (
            <div key={i} className="card-elevated">
              <p className="font-semibold text-sm">{contact.name}</p>
              <p className="text-xs text-muted-foreground">{contact.role}</p>
              <div className="mt-2 flex gap-2">
                <a href={`tel:${contact.phone}`} className="flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium">
                  <Phone className="h-3 w-3" /> Call
                </a>
                <a href={`mailto:${contact.email}`} className="flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium">
                  <Mail className="h-3 w-3" /> Email
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Guest List */}
      <section className="mt-6">
        <p className="section-title px-4 flex items-center justify-between">
          <span>Guest List</span>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
            <UserPlus className="h-3.5 w-3.5" /> Request
          </Button>
        </p>
        <div className="mx-4 rounded-xl border bg-card shadow-sm overflow-hidden">
          {demoShow.guestList.map((entry, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0">
              <div>
                <p className="text-sm font-medium">{entry.name}</p>
                <p className="text-xs text-muted-foreground">+{entry.guests} guest{entry.guests !== 1 ? "s" : ""}</p>
              </div>
              <StatusChip
                label={entry.status === "confirmed" ? "Confirmed" : "Pending"}
                variant={entry.status === "confirmed" ? "success" : "warning"}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Gear */}
      <section className="mt-6">
        <p className="section-title px-4">Gear</p>
        <div className="mx-4 card-elevated">
          <div className="flex items-start gap-3">
            <Guitar className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground leading-relaxed">{demoShow.gearNotes}</p>
          </div>
        </div>
      </section>

      {/* Documents */}
      <section className="mt-6">
        <p className="section-title px-4 flex items-center justify-between">
          <span>Documents</span>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
            <FileText className="h-3.5 w-3.5" /> Upload
          </Button>
        </p>
        <div className="mx-4 rounded-xl border bg-card shadow-sm">
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Stage Plot.pdf</p>
              <p className="text-xs text-muted-foreground">Uploaded Jun 10</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Contract - Fillmore.pdf</p>
              <p className="text-xs text-muted-foreground">Uploaded Jun 8</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
