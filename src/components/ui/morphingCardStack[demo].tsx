import { MorphingCardStack } from "@/components/ui/morphing-card-stack";
import { LayersIcon } from "@/components/ui/icons/layers";
import { ContrastIcon } from "@/components/ui/icons/contrast";
import { ClockIcon } from "@/components/ui/icons/clock";
import { SparklesIcon } from "@/components/ui/icons/sparkles";

const cardData = [
  {
    id: "1",
    title: "Magnetic Dock",
    description: "Cursor-responsive scaling with smooth spring animations",
    icon: <LayersIcon className="h-5 w-5" size={20} />,
  },
  {
    id: "2",
    title: "Gradient Mesh",
    description: "Dynamic animated gradient backgrounds that follow your cursor",
    icon: <ContrastIcon className="h-5 w-5" size={20} />,
  },
  {
    id: "3",
    title: "Pulse Timeline",
    description: "Interactive timeline with animated pulse nodes",
    icon: <ClockIcon className="h-5 w-5" size={20} />,
  },
  {
    id: "4",
    title: "Command Menu",
    description: "Radial command palette with keyboard navigation",
    icon: <SparklesIcon className="h-5 w-5" size={20} />,
  },
]

export default function MorphingCardStackDemo() {
  return <MorphingCardStack cards={cardData} />;
}
