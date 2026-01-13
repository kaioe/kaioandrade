import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SimpleTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
}

export const SimpleTooltip = ({ children, content }: SimpleTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-flex items-center justify-center w-fit"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full pb-2 left-1/2 -translate-x-6 w-max max-w-xs z-50"
          >
            <div className="relative bg-white/90 backdrop-blur-md border border-white/20 shadow-xl rounded-xl p-4 text-xs text-left">
              {content}
              <div className="absolute left-6 -bottom-1.5 w-3 h-3 bg-white/90 rotate-45 -translate-x-1/2 border-r border-b border-white/20" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
