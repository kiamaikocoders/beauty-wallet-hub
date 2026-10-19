import { useEffect, useState } from "react";
import { buttonClass } from "@/components/site/primitives";
import {
  listBookingMessages,
  postBookingMessage,
  type BookingMessage,
} from "@/lib/booking-messages";

export function BookingThread({ bookingId }: { bookingId: string }) {
  const [messages, setMessages] = useState<BookingMessage[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listBookingMessages(bookingId).then(setMessages);
  }, [bookingId]);

  async function send() {
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    try {
      await postBookingMessage(bookingId, text);
      setBody("");
      setMessages(await listBookingMessages(bookingId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send that message.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[20px] border border-border bg-card p-5">
      <h2 className="type-h4">Messages</h2>
      <p className="mt-1 type-caption text-muted-foreground">
        Align the visit here before anyone arrives. Beauty Wallet can read this thread.
      </p>
      <ul className="mt-4 flex max-h-72 flex-col gap-3 overflow-auto">
        {messages.map((message) => (
          <li
            key={message.id}
            className={message.mine ? "self-end text-right" : "self-start text-left"}
          >
            <p className="type-caption text-muted-foreground">{message.sender}</p>
            <p className="mt-1 inline-block max-w-[280px] rounded-2xl bg-muted px-3 py-2 type-body-s">
              {message.body}
            </p>
          </li>
        ))}
        {messages.length === 0 && (
          <li className="type-body-s text-muted-foreground">No messages yet.</li>
        )}
      </ul>
      <div className="mt-4 flex gap-2">
        <input
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write a message"
          className="h-11 flex-1 rounded-full border border-border bg-background px-4 type-body-s"
          onKeyDown={(event) => {
            if (event.key === "Enter") void send();
          }}
        />
        <button
          type="button"
          disabled={busy || body.trim().length === 0}
          onClick={() => void send()}
          className={buttonClass({ size: "s" })}
        >
          Send
        </button>
      </div>
      {error && <p className="mt-2 type-caption text-destructive">{error}</p>}
    </section>
  );
}
