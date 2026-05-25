export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
} as const

export const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
} as const

export const fadeInDown = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0 },
} as const

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1 },
} as const

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
} as const

export const springTransition = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 32,
}

export const smoothTransition = {
  duration: 0.35,
  ease: [0.25, 0.46, 0.45, 0.94] as const,
}
