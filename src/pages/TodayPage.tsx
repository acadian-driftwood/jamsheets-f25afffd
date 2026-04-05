import { PageHeader } from "@/components/layout/PageHeader";
import { InfoCard } from "@/components/shared/InfoCard";
import { StatusChip } from "@/components/shared/StatusChip";
import { EmptyState } from "@/components/shared/EmptyState";
import { Calendar, MapPin, Clock, Music, Plane, Hotel } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Demo data - will be replaced with real data from backend
const todayShow = {
  id: "1",
  venue: "The Fillmore",
  city: "San Francisco, CA",
  date: "Today",
  loadIn: "2:00 PM",
  soundcheck: "4:00 PM",
  doors: "7:00 PM",
  showtime: "8:00 PM",
};

const upcomingSchedule = [
  { time: "2:00 PM", title: "Load In", type: "schedule" as const },
  { time: "4:00 PM", title: "Soundcheck", type: "schedule" as const },
  { time: "5:30 PM", title: "Dinner", type: "schedule" as const },
  { time: "7:00 PM", title: "Doors", type: "schedule" as const },
  { time: "8:00 PM", title: "Showtime", type: "schedule" as const },
];

export default function TodayPage() {
  const navigate = useNavigate();

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Today"
        subtitle={new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      />

      {/* Today's Show */}
      <section className="mt-6">
        <p className="section-title">Tonight's Show</p>
        <InfoCard
          title={todayShow.venue}
          subtitle={todayShow.city}
          onClick={() => navigate("/shows/1")}
          chip={<StatusChip label="Show Day" variant="accent" />}
        >
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Doors {todayShow.doors}
            </span>
            <span className="flex items-center gap-1">
              <Music className="h-3.5 w-3.5" />
              Show {todayShow.showtime}
            </span>
          </div>
        </InfoCard>
      </section>

      {/* Today's Schedule */}
      <section className="mt-6">
        <p className="section-title">Schedule</p>
        <div className="rounded-xl border bg-card shadow-sm">
          {upcomingSchedule.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-4 py-3 border-b last:border-b-0"
            >
              <span className="w-[72px] text-sm font-medium tabular-nums text-muted-foreground">
                {item.time}
              </span>
              <span className="text-sm font-medium">{item.title}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Info */}
      <section className="mt-6">
        <p className="section-title">Quick Info</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="card-elevated flex items-start gap-3">
            <Hotel className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Hotel</p>
              <p className="text-sm font-medium">Hotel Nikko</p>
              <p className="text-xs text-muted-foreground">Conf #4821</p>
            </div>
          </div>
          <div className="card-elevated flex items-start gap-3">
            <Plane className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Travel</p>
              <p className="text-sm font-medium">No travel today</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
