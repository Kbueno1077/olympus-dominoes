import DevGateForm from "@/modules/DevGate/DevGateForm";
import { isGateConfigured, isGateOpen, isLocalDev } from "@/lib/devGate/server";
import { notFound } from "next/navigation";
import MergePageClient from "./MergePageClient";

export default function MergePage() {
  if (isLocalDev() || isGateOpen("merge")) {
    return <MergePageClient />;
  }
  if (!isGateConfigured("merge")) {
    notFound();
  }
  return <DevGateForm gate="merge" />;
}
