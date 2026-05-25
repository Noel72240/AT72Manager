import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { fadeInUp } from '@/utils/motion'

type PlaceholderPageProps = {
  title: string
  description?: string
}

export function PlaceholderPage({
  title,
  description = "Ce module est prêt à être développé dans une architecture modulaire.",
}: PlaceholderPageProps) {
  return (
    <div className="mx-auto w-full max-w-[1200px] p-6 lg:p-8">
      <motion.div variants={fadeInUp} initial="hidden" animate="visible">
        <Card title={title} description={description} hover>
          <p className="text-sm text-text-secondary">
            Bientôt disponible. La page est déjà routée et prête à accueillir ses
            composants, services, store et types dédiés.
          </p>
        </Card>
      </motion.div>
    </div>
  )
}
