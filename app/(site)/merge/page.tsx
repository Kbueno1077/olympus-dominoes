import { notFound } from "next/navigation";
import MergePageClient from "./MergePageClient";

export default function MergePage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <MergePageClient />;
}
