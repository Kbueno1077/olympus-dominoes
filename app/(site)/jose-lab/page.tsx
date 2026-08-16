import { notFound } from "next/navigation";
import JoseLabPageClient from "./JoseLabPageClient";

export default function JoseLabPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <JoseLabPageClient />;
}
