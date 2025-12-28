"use client";
import { motion, Variants } from "framer-motion";

const variants: Variants = {
    hidden: { opacity: 0, scaleY: 2, filter: "blur(10px)" }, // Stretched, transparent
    enter: { opacity: 1, scaleY: 1, filter: "none" }, // Normal, opaque
    exit: { opacity: 0, scaleY: 0, filter: "blur(10px)" }, // Shrink to nothing, transparent
};

export default function Template({ children }: { children: React.ReactNode }) {
    return (
        <motion.div variants={variants} initial="hidden" animate="enter" exit="exit" transition={{ type: "tween", ease: "easeInOut", duration: 0.2 }} className="h-full flex flex-col">
            {children}
        </motion.div>
    );
}
