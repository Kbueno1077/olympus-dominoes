import DevGateForm from "@/modules/DevGate/DevGateForm";
import {
  isGateConfigured,
  isGateOpen,
  isLocalDev,
  setGateCookie,
} from "@/lib/devGate/server";
import { notFound } from "next/navigation";
import MergePageClient from "./MergePageClient";

export default function MergePage() {
  if (isLocalDev()) {
    return <MergePageClient />;
  }
  if (isGateOpen("merge")) {
    // Path `/` so Live watch APIs receive the same Tools unlock cookie.
    setGateCookie("merge");
    return <MergePageClient />;
  }
  if (!isGateConfigured("merge")) {
    notFound();
  }
  return <DevGateForm gate="merge" />;
}
