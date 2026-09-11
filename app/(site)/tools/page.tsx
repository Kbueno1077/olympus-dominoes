import DevGateForm from "@/modules/DevGate/DevGateForm";
import { isGateConfigured, isGateOpen, isLocalDev } from "@/lib/devGate/server";
import { notFound } from "next/navigation";
import ToolsPageClient from "./ToolsPageClient";

export default function ToolsPage() {
  if (isLocalDev() || isGateOpen("merge")) {
    return <ToolsPageClient />;
  }
  if (!isGateConfigured("merge")) {
    notFound();
  }
  return <DevGateForm gate="merge" />;
}
