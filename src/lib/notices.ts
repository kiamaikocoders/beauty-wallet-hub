import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { playNotificationSound } from "@/lib/notification-sound";
import { publishNotice } from "@/lib/notice-server";
import { listenForForegroundPush } from "@/lib/push";

export type Notice = {
  id: string;
  kind: string;
  title: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
};

const heard = new Set<string>();

function hear(id: string) {
  if (!id || heard.has(id)) return false;
  heard.add(id);
  playNotificationSound();
  return true;
}

export function announce(event: string, ref = "") {
  void (async () => {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (!accessToken) return;
    const result = await publishNotice({
      data: { accessToken, event, ref, origin: window.location.origin },
    });
    if (!result.ok) console.info("[notices]", result.error);
  })().catch((err) => {
    console.info("[notices]", err instanceof Error ? err.message : err);
  });
}

export async function loadNotices(): Promise<Notice[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, kind, title, body, href, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(40);
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    href: row.href,
    readAt: row.read_at,
    createdAt: row.created_at,
  }));
}

export async function markNoticeRead(id: string) {
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).is("read_at", null);
}

export async function markAllNoticesRead() {
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
}

/** Live unread count, chime, and toast. Returns a cleanup function. */
export async function watchNotices(onUnread: (count: number) => void) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) return () => {};

  const refresh = async () => {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null);
    onUnread(count ?? 0);
  };
  await refresh();

  const channel = supabase
    .channel(`notices:${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      (payload) => {
        const row = payload.new as { id?: string; title?: string; body?: string };
        if (row.id && hear(row.id)) {
          toast(row.title || "Beauty Wallet", { description: row.body || "" });
        }
        void refresh();
      },
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      () => {
        void refresh();
      },
    );
  await new Promise<void>((resolve) => {
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") resolve();
    });
  });

  const stopPush = await listenForForegroundPush((note) => {
    if (note.id && !hear(note.id)) return;
    if (!note.id) playNotificationSound();
    toast(note.title, { description: note.body });
  });

  return () => {
    stopPush();
    void supabase.removeChannel(channel);
  };
}
