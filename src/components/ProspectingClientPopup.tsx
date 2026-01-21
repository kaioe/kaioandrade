"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { XIcon } from "@/components/ui/icons/x"
import { GripIcon } from "@/components/ui/icons/grip"
import { cn } from "@/lib/utils"

interface ProspectingClientPopupProps {
  isOpen: boolean
  onClose: () => void
}

const FloatingInput = ({
  label,
  id,
  type = "text",
  textarea = false,
  required = false
}: {
  label: string;
  id: string;
  type?: string;
  textarea?: boolean;
  required?: boolean;
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const [value, setValue] = useState("")

  const InputComponent = textarea ? "textarea" : "input"

  return (
    <div className="relative w-full">
      <InputComponent
        id={id}
        type={textarea ? undefined : type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          "w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl outline-none transition-all duration-200",
          "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
          textarea ? "min-h-[120px] resize-none" : "h-12",
          (isFocused || value) && "pt-6 pb-2"
        )}
        required={required}
      />
      <label
        htmlFor={id}
        className={cn(
          "absolute left-4 transition-all duration-200 pointer-events-none text-gray-400 font-mono text-sm",
          (isFocused || value)
            ? "top-1.5 text-[10px] uppercase tracking-wider text-blue-500 font-bold"
            : "top-1/2 -translate-y-1/2"
        )}
      >
        {label}
      </label>
    </div>
  )
}

export function ProspectingClientPopup({ isOpen, onClose }: ProspectingClientPopupProps) {

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
          {/* Backdrop (semi-transparent) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/5 dark:bg-black/20 backdrop-blur-[2px] pointer-events-auto"
          />

          {/* Draggable Popup */}
          <motion.div
            drag
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md mx-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 shadow-2xl rounded-[2rem] overflow-hidden pointer-events-auto"
          >
            {/* Header / Drag Handle */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors group">
                  <GripIcon size={18} className="text-gray-400 group-hover:text-blue-500" />
                </div>
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-gray-500">Contact Request</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
              >
                <XIcon size={18} className="text-gray-400 group-hover:text-red-500" />
              </button>
            </div>

            {/* Form Content */}
            <form className="p-8 space-y-4" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
              <div className="grid grid-cols-1 gap-4">
                <FloatingInput id="name" label="Full Name" required />
                <div className="grid grid-cols-2 gap-4">
                  <FloatingInput id="mobile" label="Mobile" type="tel" />
                  <FloatingInput id="email" label="Email Address" type="email" required />
                </div>
                <FloatingInput id="message" label="Project Details / Message" textarea required />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>SEND MESSAGE</span>
              </motion.button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
