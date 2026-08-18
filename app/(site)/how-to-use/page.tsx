import type { Metadata } from "next";
import HowToUse from "@/modules/HowToUse/HowToUse";

export const metadata: Metadata = {
  title: "How to use | Olympus Dominoes",
  description:
    "Companion site for the Olympus Dominoes app — import a save for bigger charts, keep a casual scoreboard, or play vs bots.",
};

export default function HowToUsePage() {
  return <HowToUse />;
}
