import type { InterventionMedia } from '@/types/entities/intervention.types'
import type { InterventionFormValues } from '@/modules/interventions/types/intervention-module.types'
import type { Intervention } from '@/types/entities'
import { normalizeInterventionMedia } from '@/modules/interventions/field/utils/media-utils'
import { photoDebug } from '@/modules/interventions/field/utils/photo-debug'
import { InterventionPhotoGallery } from '@/modules/interventions/field/components/InterventionPhotoGallery'
import { SignaturePad } from '@/modules/interventions/field/components/SignaturePad'
import { AiDiagnosticWidget } from '@/modules/ai/components/AiDiagnosticWidget'

type InterventionFieldSectionProps = {
  media: InterventionMedia
  onChange: (media: InterventionMedia) => void
  disabled?: boolean
  formValues?: InterventionFormValues
  intervention?: Intervention | null
  onApplyAiField?: (field: 'diagnostic' | 'technicianNotes', value: string) => void
}

export function InterventionFieldSection({
  media,
  onChange,
  disabled,
  formValues,
  intervention,
  onApplyAiField,
}: InterventionFieldSectionProps) {
  const normalized = normalizeInterventionMedia(media)

  const update = (patch: Partial<InterventionMedia>) => {
    onChange({ ...normalized, ...patch })
  }

  return (
    <section className="space-y-6">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Photos terrain
        </h4>
        <p className="mt-1 text-xs text-text-muted">
          Stockage local immédiat · synchronisation cloud à venir
        </p>
      </div>

      <InterventionPhotoGallery
        photos={normalized.photos ?? []}
        onPhotosChange={(updater) => {
          const nextPhotos = updater(normalized.photos ?? [])
          photoDebug.log('FieldSection photos', nextPhotos.length)
          update({ photos: nextPhotos })
        }}
        disabled={disabled}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SignaturePad
          label="Signature client"
          value={normalized.clientSignature}
          onChange={(clientSignature) => update({ clientSignature })}
        />
        <SignaturePad
          label="Signature technicien"
          value={normalized.technicianSignature}
          onChange={(technicianSignature) => update({ technicianSignature })}
        />
      </div>

      {formValues ? (
        <AiDiagnosticWidget
          values={formValues}
          intervention={intervention}
          disabled={disabled}
          onApplyField={onApplyAiField}
        />
      ) : null}
    </section>
  )
}
