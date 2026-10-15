import { supabase } from "@/integrations/supabase/client";

export type ContactWho = "member" | "provider" | "other";

export async function submitContactMessage(args: {
  who: ContactWho;
  fullName: string;
  phone: string;
  topic: string;
  message: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc(
    "submit_contact_message" as never,
    {
      p_who: args.who,
      p_full_name: args.fullName,
      p_phone: args.phone,
      p_topic: args.topic,
      p_message: args.message,
    } as never,
  );
  if (error) throw new Error(error.message);
  return data as string;
}
