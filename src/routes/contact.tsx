import { createFileRoute } from "@tanstack/react-router";
import { SitePage } from "@/components/site/SitePage";
import { ContactPage } from "@/components/site/contact/ContactPage";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Beauty Wallet" },
      {
        name: "description",
        content:
          "Real people in Nairobi, seven days a week. Call, WhatsApp, email or send us a message.",
      },
    ],
  }),
  component: ContactRoute,
});

function ContactRoute() {
  return (
    <SitePage>
      <ContactPage />
    </SitePage>
  );
}
