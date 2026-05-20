import { motion } from 'framer-motion'

interface FlipCardProps {
  isFlipped: boolean
  front: React.ReactNode
  back: React.ReactNode
  className?: string
}

export function FlipCard({ isFlipped, front, back, className }: FlipCardProps) {
  return (
    <div className={className} style={{ perspective: 1200 }}>
      <div style={{ position: 'relative' }}>
        {/* Front face */}
        <motion.div
          initial={false}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          style={{
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {front}
        </motion.div>

        {/* Back face */}
        <motion.div
          initial={false}
          animate={{ rotateY: isFlipped ? 0 : -180 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          style={{
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            position: 'absolute',
            inset: 0,
          }}
        >
          {back}
        </motion.div>
      </div>
    </div>
  )
}
