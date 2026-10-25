import type { Metadata } from "next";
import SeoStaticPage from "@/src/components/SeoStaticPage";

export const dynamic='force-dynamic';

export const metadata: Metadata = { title: "Submit an Organ Request", description: "Submit an organ pre-request for admin review before public registry listing.", alternates: { canonical: "/request-organ" } };

export default function RequestOrganPage() {
  return <SeoStaticPage pageKey="request-organ" eyebrow="Request organ" title="Submit a Future Organ Request" description="Patients or families may submit organ pre-requests for admin verification. Approved requests can appear in the public registry with limited safe information." />;
}
