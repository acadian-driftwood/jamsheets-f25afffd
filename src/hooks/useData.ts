import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type Tour = Database["public"]["Tables"]["tours"]["Row"];
type TourInsert = Database["public"]["Tables"]["tours"]["Insert"];
type Show = Database["public"]["Tables"]["shows"]["Row"];
type ShowInsert = Database["public"]["Tables"]["shows"]["Insert"];

export function useTours() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.organization.id;

  return useQuery({
    queryKey: ["tours", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("tours")
        .select("*")
        .eq("organization_id", orgId)
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data as Tour[];
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
      const { data, error } = await supabase
        .from("tours")
        .insert({ ...tour, organization_id: currentOrg.organization.id, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tours"] }),
  });
}

export function useShows(tourId?: string) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.organization.id;

  return useQuery({
    queryKey: ["shows", orgId, tourId],
    queryFn: async () => {
      if (!orgId) return [];
      let q = supabase
        .from("shows")
        .select("*")
        .eq("organization_id", orgId)
        .order("date", { ascending: true });
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
      const { data, error } = await supabase
        .from("shows")
        .select("*")
        .eq("organization_id", orgId)
        .gte("date", today)
        .order("date", { ascending: true });
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
      const { data, error } = await supabase
        .from("shows")
        .select("*")
        .eq("organization_id", orgId)
        .lt("date", yesterday)
        .order("date", { ascending: false });
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
      const { data, error } = await supabase
        .from("shows")
        .insert({ ...show, organization_id: currentOrg.organization.id, created_by: user.id })
        .select()
        .single();
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

export function useShowSchedule(showId: string) {
  return useQuery({
    queryKey: ["show-schedule", showId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("show_schedule_items")
        .select("*")
        .eq("show_id", showId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!showId,
  });
}

export function useShowHotel(showId: string) {
  return useQuery({
    queryKey: ["show-hotel", showId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("show_hotels")
        .select("*")
        .eq("show_id", showId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!showId,
  });
}

export function useShowContacts(showId: string) {
  return useQuery({
    queryKey: ["show-contacts", showId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("show_contacts")
        .select("*")
        .eq("show_id", showId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!showId,
  });
}

export function useShowGuestList(showId: string) {
  return useQuery({
    queryKey: ["show-guests", showId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("show_guest_list_entries")
        .select("*, requester:profiles!show_guest_list_entries_requested_by_fkey(full_name)")
        .eq("show_id", showId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!showId,
  });
}

export function useTourTimeline(tourId: string) {
  return useQuery({
    queryKey: ["tour-timeline", tourId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tour_timeline_items")
        .select("*")
        .eq("tour_id", tourId)
        .order("date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!tourId,
  });
}
