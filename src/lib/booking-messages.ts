import { supabase } from "@/integrations/supabase/client";

export type BookingMessage = {
  id: string;
  body: string;
  created_at: string;
  mine: boolean;
  sender: string;
};

export async function listBookingMessages(bookingId: string): Promise<BookingMessage[]> {
  const { data, error } = await supabase.rpc(
    "list_booking_messages" as never,
    { p_booking_id: bookingId } as never,
  );
  if (error || !Array.isArray(data)) return [];
  return data as BookingMessage[];
}

export async function postBookingMessage(bookingId: string, body: string): Promise<void> {
  const { error } = await supabase.rpc(
    "post_booking_message" as never,
    { p_booking_id: bookingId, p_body: body } as never,
  );
  if (error) throw error;
}
