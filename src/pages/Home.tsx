
import HyperTextParagraph from "@/components/ui/hyper-text-with-decryption";
import { motion } from "framer-motion";
import { MorphingCardStack } from "@/components/ui/morphing-card-stack";
import { EarthIcon } from "@/components/ui/icons/earth";
import { CpuIcon } from "@/components/ui/icons/cpu";
import { BotMessageSquareIcon } from "@/components/ui/icons/bot-message-square";
import { useState } from "react";
import { ProspectingClientPopup } from "@/components/ProspectingClientPopup";

export default function DemoOne() {
	const [isPopupOpen, setIsPopupOpen] = useState(false);
	const bio = "“The best revenge is not to be like your enemy.” – Marcus Aurelius";

	// Key words to trigger the effect
	const triggers = [
		{ word: "best", initialScrambled: true },
		{ word: "not", initialScrambled: true },
		{ word: "like", initialScrambled: true },
		{ word: "enemy", initialScrambled: true },
		{ word: "–", className: "text-xs md:text-sm opacity-60", interactive: false },
		{ word: "Marcus", className: "text-xs md:text-sm opacity-60", interactive: false },
		{ word: "Aurelius", className: "text-xs md:text-sm opacity-60", interactive: false },
	];

	return (
		<div className="min-h-screen bg-zinc-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
			{/* Background Ambience */}
			<div className="absolute inset-0 z-0">
				<div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-800/20 rounded-full blur-[120px]" />
				<div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px]" />
				{/* Subtle Grid */}
				<div
					className="grid-effect absolute inset-0 opacity-[0.04]"
					style={{
						backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #666 1px, transparent 1px)",
						backgroundSize: "32px 32px",
					}}
				/>
			</div>

			{/* Card Container */}
			<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className=" hero max-w-4xl w-full relative z-10">
				{/* Header Pill */}
				<div className="flex justify-center mb-8">
					<div className="bg-white border border-gray-200 shadow-sm px-4 py-1.5 rounded-full flex items-center gap-2">
						<span className="relative flex h-2 w-2">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
							<span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
						</span>
						<span className="text-xs font-bold tracking-widest text-gray-500 uppercase">Kaio Andrade</span>
					</div>
				</div>

				{/* Main Content */}
				<div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 md:p-16">
					<HyperTextParagraph text={bio} highlightWords={triggers} className="text-2xl md:text-4xl text-gray-600 font-normal leading-[1.6]" />
				</div>

				{/* Footer */}
				<p className="text-center mt-8 text-gray-400 text-sm font-mono">IT/AI Consultant</p>
			</motion.div>

			<div className="mt-12 w-full max-w-6xl flex flex-wrap justify-center items-start gap-12 relative z-10">
				{/* Former Clients Container */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
					className="flex flex-col items-start gap-6 border-b-2 border-[#aaa] md:border-b-0 md:border-r-2 md:border-[#aaa] pb-8 md:pb-0 md:pr-12 w-full md:w-auto"
				>
					<h3 className="text-gray-400 font-mono text-sm tracking-widest uppercase">JOB DONE</h3>
					<div className="w-full max-w-sm">
						<MorphingCardStack
							cards={[
								{
									id: "qbjjc",
									title: "Queensland BJJ Circuit",
									description: (
										<div className="flex flex-col gap-1 text-xs">
											<div><span className="font-semibold">Job:</span> Event Management System & Website</div>
											<a href="http://qbjjc.com.au" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline z-50 relative pointer-events-auto">http://qbjjc.com.au</a>
										</div>
									),
									icon: <img src="/imgs/clientes/qbjjc-logo.png" alt="QBJJC Logo" className="w-full h-full object-contain" />,
								},
								{
									id: "ignite",
									title: "Ignite Travel Group",
									description: (
										<div className="flex flex-col gap-1 text-xs">
											<div><span className="font-semibold">Job:</span> Frontend Senior Developer</div>
											<a href="https://www.ignitetravel.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline z-50 relative pointer-events-auto">https://www.ignitetravel.com/</a>
										</div>
									),
									icon: <img src="/imgs/clientes/Ignite-Travel-Group-Logo-black.svg" alt="Ignite Travel Group Logo" className="w-full h-full object-contain" />,
								},
							{
								id: "pobsc",
								title: "Point of Balance Sports Centre",
								description: (
									<div className="flex flex-col gap-1 text-xs">
										<div><span className="font-semibold">Job:</span> Multi Sites Platform</div>
										<a href="https://pointofbalancesportscentre.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline z-50 relative pointer-events-auto">https://pointofbalancesportscentre.com/</a>
									</div>
								),
								icon: <img src="/imgs/clientes/pobsc-logo.jpg" alt="POBSC Logo" className="w-full h-full object-contain" />,
							},
							{
								id: "martial-arts-logbook",
								title: "Martial Arts Logbook",
								description: (
									<div className="flex flex-col gap-1 text-xs">
										<div><span className="font-semibold">Job:</span> Online Shop & Website</div>
										<a href="https://martialartslogbooks.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline z-50 relative pointer-events-auto">https://martialartslogbooks.com/</a>
									</div>
								),
								icon: <img src="/imgs/clientes/martial-arts-logbook-logo.png" alt="Martial Arts Logbook Logo" className="w-full h-full object-contain" />,
							},
							{
								id: "web-dev",
								title: "Web Development",
								description: "Full-stack development using modern technologies like React, Node.js, and TypeScript.",
								icon: <EarthIcon className="w-full h-full text-slate-700" size={40} />,
							},
								{
									id: "architecture",
									title: "System Architecture",
									description: "Designing scalable and maintainable software architectures for complex business needs.",
									icon: <CpuIcon className="w-full h-full text-slate-700" size={40} />,
								},
							]}
						/>
					</div>
				</motion.div>

				{/* WORK IN PROGRESS Container */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
					className="flex flex-col items-start gap-6 border-b-2 border-[#aaa] md:border-b-0 md:border-r-2 md:border-[#aaa] pb-8 md:pb-0 md:pr-12 w-full md:w-auto"
				>
					<h3 className="text-gray-400 font-mono text-sm tracking-widest uppercase">WORK IN PROGRESS</h3>
					<div className="w-full max-w-sm">
						<MorphingCardStack
							defaultLayout="list"
							cards={[
								{
									id: "bjjlc",
									title: "BJJ Lotus Club",
									description: (
										<div className="flex flex-col gap-1 text-xs">
											<div><span className="font-semibold">Job:</span> Online Community Platform</div>
											<a href="https://bjjlotusclub.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline z-50 relative pointer-events-auto">https://bjjlotusclub.com/</a>
										</div>
									),
									icon: <img src="/imgs/clientes/bjjlc-logo-stamp.png" alt="BJJLC Logo" className="w-full h-full object-contain" />,
								},
								{
									id: "cinematic-posters",
									title: "Cinematic Posters",
									description: (
										<div className="flex flex-col gap-1 text-xs">
											<div><span className="font-semibold">Job:</span> AI Based App</div>
											<a href="https://cinematicposters.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline z-50 relative pointer-events-auto">https://cinematicposters.com/</a>
										</div>
									),
									icon: <img src="/imgs/clientes/cinematic_posters_logo_clean.png" alt="Cinematic Posters Logo" className="w-full h-full object-contain" />,
								},
								{
									id: "aafsgc",
									title: "Accurate Accounting & Financial Services",
									description: (
										<div className="flex flex-col gap-1 text-xs">
											<div><span className="font-semibold">Job:</span> Institutional Website & SEO</div>
											<a href="/projects/aafsgc/index.html" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline z-50 relative pointer-events-auto">/projects/aafsgc/index.html</a>
										</div>
									),
									icon: <img src="/imgs/clientes/aafsgc-logo.png" alt="Accurate Accounting & Financial Services Gold Coast Logo" className="w-full h-full object-contain" />,
								},
							]}
						/>
					</div>
				</motion.div>

				{/* Prospecting Client Container */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
					className="flex flex-col items-center md:items-start gap-6 w-full md:w-auto"
				>
					<h3 className="text-gray-400 font-mono text-sm tracking-widest uppercase">Prospecting Client</h3>
					<div className="grid grid-cols-1 gap-8 md:gap-16">
						<div
							onClick={() => setIsPopupOpen(true)}
							className="p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/40 shadow-sm cursor-pointer hover:bg-white/80 transition-all duration-200"
						>
							<BotMessageSquareIcon className="w-12 h-12 text-slate-700" size={48} />
						</div>
					</div>
				</motion.div>
			</div>

			<ProspectingClientPopup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} />
		</div>
	);
}
