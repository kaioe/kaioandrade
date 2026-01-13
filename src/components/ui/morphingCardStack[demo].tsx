import { MorphingCardStack } from "@/components/ui/morphing-card-stack";
import { Layers, Palette, Clock, Sparkles } from "lucide-react";

const cardData = [
  {
    id: "1",
    title: "Magnetic Dock",
    description: "Cursor-responsive scaling with smooth spring animations",
    icon: <Layers className="h-5 w-5" />,
  },
  {
    id: "2",
    title: "Gradient Mesh",
    description: "Dynamic animated gradient backgrounds that follow your cursor",
    icon: <Palette className="h-5 w-5" />,
  },
  {
    id: "3",
    title: "Pulse Timeline",
    description: "Interactive timeline with animated pulse nodes",
    icon: <Clock className="h-5 w-5" />,
  },
  {
    id: "4",
    title: "Command Menu",
    description: "Radial command palette with keyboard navigation",
    icon: <Sparkles className="h-5 w-5" />,
  },
]

export default function MorphingCardStackDemo() {
  return <MorphingCardStack cards={cardData} />;
}
