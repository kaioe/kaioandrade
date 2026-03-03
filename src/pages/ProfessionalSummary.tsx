import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const specializations = [
	"Cloud infrastructure and deployment (Google Cloud, server environments)",
	"Modern web stacks (React, Next.js, SSR architectures)",
	"API integrations and SaaS platform development",
	"Payment systems integration (e.g., Stripe)",
	"DevOps workflows and scalable hosting strategies",
	"Technical planning and long-term system design",
];

export default function ProfessionalSummary() {
	return (
		<div className="min-h-screen bg-zinc-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
			{/* Background Ambience */}
			<div className="absolute inset-0 z-0">
				<div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-800/20 rounded-full blur-[120px]" />
				<div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px]" />
				<div
					className="grid-effect absolute inset-0 opacity-[0.04]"
					style={{
						backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #666 1px, transparent 1px)",
						backgroundSize: "32px 32px",
					}}
				/>
			</div>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8, ease: "easeOut" }}
				className="max-w-3xl w-full relative z-10"
			>
				{/* Header with back link */}
				<div className="flex justify-center mb-8">
					<Link
						to="/"
						className="bg-white border border-gray-200 shadow-sm px-4 py-1.5 rounded-full flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
					>
						<span className="text-xs font-bold tracking-widest text-gray-500 dark:text-gray-400 uppercase">← Kaio Andrade</span>
					</Link>
				</div>

				<div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 md:p-12 space-y-6">
					<h1 className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-gray-100">
						Professional Summary – Senior IT Consultant
					</h1>

					<p className="text-gray-600 dark:text-gray-300 leading-relaxed">
						I am a Senior IT Consultant with a strategic mindset and a hands-on approach to building scalable, secure, and high-performing digital solutions. With extensive experience across web infrastructure, cloud environments, SaaS architecture, and modern development frameworks, I help businesses translate complex technical challenges into practical, future-ready systems.
					</p>

					<p className="text-gray-600 dark:text-gray-300 leading-relaxed">
						My work bridges business objectives and technology execution. I collaborate closely with stakeholders to design architectures that are not only technically sound but commercially aligned — whether launching new platforms, optimizing legacy systems, or improving performance, security, and automation.
					</p>

					<div>
						<h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">I specialize in:</h2>
						<ul className="space-y-2 list-none">
							{specializations.map((item, i) => (
								<li key={i} className="flex gap-2 text-gray-600 dark:text-gray-300">
									<span className="text-blue-500 dark:text-blue-400 mt-1.5 shrink-0">•</span>
									<span>{item}</span>
								</li>
							))}
						</ul>
					</div>

					<p className="text-gray-600 dark:text-gray-300 leading-relaxed">
						Beyond implementation, I provide strategic guidance — advising on tech stack selection, cost optimization, scalability planning, and risk mitigation. My goal is always to build solutions that grow with the business, reduce technical debt, and create long-term operational efficiency.
					</p>

					<p className="text-gray-600 dark:text-gray-300 leading-relaxed italic border-l-4 border-blue-500 dark:border-blue-400 pl-4">
						I believe technology should empower teams, simplify processes, and create measurable impact — not complexity.
					</p>
				</div>

				<p className="text-center mt-8">
					<Link to="/" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-mono transition-colors">
						← Back to home
					</Link>
				</p>
			</motion.div>
		</div>
	);
}
