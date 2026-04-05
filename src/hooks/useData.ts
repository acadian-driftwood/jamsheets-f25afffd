import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type Tour = Database["public"]["Tables"]["tours"]["Row"];
type TourInsert = Database["public"]["Tables"]["tours"]["Insert"];
type Show = Database["public"]["Tables"]["shows"]["Row"];
type ShowInsert = Database["public"]["Tables"]["shows"]["Insert"];

// ─── Tours ───────────────────────────────────────────────
export function useTours() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.organization.id;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  return useQuery({
    queryKey: ["tours", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from("tours").select("*").eq("organization_id", orgId).order("start_date", { ascending: true });
      if (error) throw error;
      return (data as Tour[]).filter((t) => {
        if (t.status === "completed" || t.status === "archived") return false;
        if (t.end_date && t.end_date < yesterday) return false;
        return true;
      });
    },
    enabled: !!orgId,
  });
}

export function useArchivedTours() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.organization.id;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  return useQuery({
    queryKey: ["tours", "archived", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from("tours").select("*").eq("organization_id", orgId).order("start_date", { ascending: false });
      if (error) throw error;
      return (data as Tour[]).filter((t) => {
        return t.status === "completed" || t.status === "archived" || (t.end_date && t.end_date < yesterday);
      });
    },
    enabled: !!orgId,
  });
}

export function useCreateTour() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (tour: Omit<TourInsert, "organization_id" | "created_by">) => {
      if (!currentOrg || !user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("tours").insert({ ...tour, organization_id: currentOrg.organization.id, created_by: user.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tours"] }),
  });
}
export function useUpdateTour() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Tour>) => {
      const { data, error } = await supabase.from("tours").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["tours"] });
      qc.invalidateQueries({ queryKey: ["tour", data.id] });
    },
  });
}

// ─── Shows ───────────────────────────────────────────────
export function useShows(tourId?: string) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.organization.id;
  return useQuery({
    queryKey: ["shows", orgId, tourId],
    queryFn: async () => {
      if (!orgId) return [];
      let q = supabase.from("shows").select("*").eq("organization_id", orgId).order("date", { ascending: true });
      if (tourId) q = q.eq("tour_id", tourId);
      const { data, error } = await q;
      if (error) throw error;
      return data as Show[];
    },
    enabled: !!orgId,
  });
}

export function useUpcomingShows() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.organization.id;
  const today = new Date().toISOString().split("T")[0];
  return useQuery({
    queryKey: ["shows", "upcoming", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from("shows").select("*").eq("organization_id", orgId).gte("date", today).order("date", { ascending: true });
      if (error) throw error;
      return data as Show[];
    },
    enabled: !!orgId,
  });
}

export function useArchivedShows() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.organization.id;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  return useQuery({
    queryKey: ["shows", "archived", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from("shows").select("*").eq("organization_id", orgId).lt("date", yesterday).order("date", { ascending: false });
      if (error) throw error;
      return data as Show[];
    },
    enabled: !!orgId,
  });
}

export function useShow(id: string) {
  return useQuery({
    queryKey: ["show", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("shows").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Show;
    },
    enabled: !!id,
  });
}

export function useCreateShow() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (show: Omit<ShowInsert, "organization_id" | "created_by">) => {
      if (!currentOrg || !user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("shows").insert({ ...show, organization_id: currentOrg.organization.id, created_by: user.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shows"] }),
  });
}

export function useUpdateShow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Show>) => {
      const { data, error } = await supabase.from("shows").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["shows"] });
      qc.invalidateQueries({ queryKey: ["show", data.id] });
    },
  });
}

export function useDeleteShow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shows").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shows"] }),
  });
}

// ─── Show Schedule ───────────────────────────────────────
export function useShowSchedule(showId: string) {
  return useQuery({
    queryKey: ["show-schedule", showId],
    queryFn: async () => {
      const { data, error } = await supabase.from("show_schedule_items").select("*").eq("show_id", showId).order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!showId,
  });
}

export function useCreateScheduleItem() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (item: { show_id: string; title: string; starts_at?: string | null; ends_at?: string | null; sort_order?: number }) => {
      if (!currentOrg) throw new Error("No org");
      const { data, error } = await supabase.from("show_schedule_items").insert({ ...item, organization_id: currentOrg.organization.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["show-schedule", data.show_id] }),
  });
}

export function useUpdateScheduleItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; show_id: string; title?: string; starts_at?: string | null; ends_at?: string | null; sort_order?: number }) => {
      const { data, error } = await supabase.from("show_schedule_items").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["show-schedule", data.show_id] }),
  });
}

export function useDeleteScheduleItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, showId }: { id: string; showId: string }) => {
      const { error } = await supabase.from("show_schedule_items").delete().eq("id", id);
      if (error) throw error;
      return showId;
    },
    onSuccess: (showId) => qc.invalidateQueries({ queryKey: ["show-schedule", showId] }),
  });
}

// ─── Show Hotel ──────────────────────────────────────────
export function useShowHotel(showId: string) {
  return useQuery({
    queryKey: ["show-hotel", showId],
    queryFn: async () => {
      const { data, error } = await supabase.from("show_hotels").select("*").eq("show_id", showId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!showId,
  });
}

export function useUpsertHotel() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async ({ id, show_id, ...fields }: { id?: string; show_id: string; hotel_name: string; address?: string | null; confirmation_number?: string | null; check_in?: string | null; check_out?: string | null; notes?: string | null }) => {
      if (!currentOrg) throw new Error("No org");
      if (id) {
        const { data, error } = await supabase.from("show_hotels").update(fields).eq("id", id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from("show_hotels").insert({ ...fields, show_id, organization_id: currentOrg.organization.id }).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["show-hotel", data.show_id] }),
  });
}

export function useDeleteHotel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, showId }: { id: string; showId: string }) => {
      const { error } = await supabase.from("show_hotels").delete().eq("id", id);
      if (error) throw error;
      return showId;
    },
    onSuccess: (showId) => qc.invalidateQueries({ queryKey: ["show-hotel", showId] }),
  });
}

// ─── Show Contacts ───────────────────────────────────────
export function useShowContacts(showId: string) {
  return useQuery({
    queryKey: ["show-contacts", showId],
    queryFn: async () => {
      const { data, error } = await supabase.from("show_contacts").select("*").eq("show_id", showId).order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!showId,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (contact: { show_id: string; name: string; role?: string | null; phone?: string | null; email?: string | null; notes?: string | null }) => {
      if (!currentOrg) throw new Error("No org");
      const { data, error } = await supabase.from("show_contacts").insert({ ...contact, organization_id: currentOrg.organization.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["show-contacts", data.show_id] }),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, showId }: { id: string; showId: string }) => {
      const { error } = await supabase.from("show_contacts").delete().eq("id", id);
      if (error) throw error;
      return showId;
    },
    onSuccess: (showId) => qc.invalidateQueries({ queryKey: ["show-contacts", showId] }),
  });
}

// ─── Guest List ──────────────────────────────────────────
export function useShowGuestList(showId: string) {
  return useQuery({
    queryKey: ["show-guests", showId],
    queryFn: async () => {
      const { data, error } = await supabase.from("show_guest_list_entries").select("*, requester:profiles!show_guest_list_entries_requested_by_fkey(full_name)").eq("show_id", showId).order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!showId,
  });
}

export function useRequestGuest() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (entry: { show_id: string; guest_name: string; guest_count?: number; notes?: string | null }) => {
      if (!currentOrg || !user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("show_guest_list_entries").insert({ ...entry, organization_id: currentOrg.organization.id, requested_by: user.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["show-guests", data.show_id] }),
  });
}

export function useUpdateGuestStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, showId }: { id: string; status: "pending" | "confirmed" | "declined"; showId: string }) => {
      const { error } = await supabase.from("show_guest_list_entries").update({ status }).eq("id", id);
      if (error) throw error;
      return showId;
    },
    onSuccess: (showId) => qc.invalidateQueries({ queryKey: ["show-guests", showId] }),
  });
}

export function useDeleteGuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, showId }: { id: string; showId: string }) => {
      const { error } = await supabase.from("show_guest_list_entries").delete().eq("id", id);
      if (error) throw error;
      return showId;
    },
    onSuccess: (showId) => qc.invalidateQueries({ queryKey: ["show-guests", showId] }),
  });
}


// ─── Show Operations ─────────────────────────────────────
export function useShowOperations(showId: string) {
  return useQuery({
    queryKey: ["show-ops", showId],
    queryFn: async () => {
      const { data, error } = await supabase.from("show_operations").select("*").eq("show_id", showId).order("section");
      if (error) throw error;
      return data;
    },
    enabled: !!showId,
  });
}

export function useUpsertOperation() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async ({ id, show_id, section, content }: { id?: string; show_id: string; section: string; content: string }) => {
      if (!currentOrg) throw new Error("No org");
      if (id) {
        const { data, error } = await supabase.from("show_operations").update({ content }).eq("id", id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from("show_operations").insert({ show_id, section, content, organization_id: currentOrg.organization.id }).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["show-ops", data.show_id] }),
  });
}

// ─── Tour Timeline ───────────────────────────────────────
export function useTourTimeline(tourId: string) {
  return useQuery({
    queryKey: ["tour-timeline", tourId],
    queryFn: async () => {
      const { data, error } = await supabase.from("tour_timeline_items").select("*").eq("tour_id", tourId).order("date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!tourId,
  });
}
