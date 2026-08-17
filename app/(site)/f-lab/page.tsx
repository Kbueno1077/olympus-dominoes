import DevGateForm from "@/modules/DevGate/DevGateForm";
import { isGateConfigured, isGateOpen, isLocalDev } from "@/lib/devGate/server";
import { notFound } from "next/navigation";
import FLabPageClient from "./FLabPageClient";

export default function FLabPage() {
  if (isLocalDev() || isGateOpen("f-lab")) {
    return <FLabPageClient />;
  }
  if (!isGateConfigured("f-lab")) {
    notFound();
  }
  return <DevGateForm gate="f-lab" />;
}
