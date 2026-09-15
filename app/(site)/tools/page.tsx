import DevGateForm from "@/modules/DevGate/DevGateForm";
import { isGateConfigured, isGateOpen, isLocalDev } from "@/lib/devGate/server";
import { notFound } from "next/navigation";
import ToolsPageClient from "./ToolsPageClient";

export default async function ToolsPage() {
  if (isLocalDev() || (await isGateOpen("merge"))) {
    return <ToolsPageClient />;
  }
  if (!isGateConfigured("merge")) {
    notFound();
  }
  return <DevGateForm gate="merge" />;
}
