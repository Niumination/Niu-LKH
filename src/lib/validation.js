import { z } from 'zod'

/**
 * Shared Zod schemas for Niu-LKH data.
 * These are the single source of truth for entry/profile validation.
 *
 * @typedef {import('zod').infer<typeof lkhEntrySchema>} LkhEntryInput
 * @typedef {import('zod').infer<typeof lkhEntrySchema>} LkhEntry
 * @typedef {import('zod').infer<typeof profileSchema>} LkhProfile
 * @typedef {import('zod').infer<typeof lkhEntrySchema> & { id?: string; createdAt?: string }} StoredLkhEntry
 */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
const time = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Format jam harus HH:MM')
  .refine((value) => {
    const [hours, minutes] = value.split(':').map(Number)
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
  }, 'Jam tidak valid')
  .optional()
  .or(z.literal(''))
const optionalText = z.string().trim().max(500, 'Maksimal 500 karakter')

const validatePeriodRange = (value, ctx) => {
  if (value.periodeMulai && value.periodeSelesai && value.periodeSelesai < value.periodeMulai) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['periodeSelesai'],
      message: 'Periode selesai tidak boleh sebelum periode mulai',
    })
  }
}

export const profileSchema = z
  .object({
    nama: z.string().trim().min(1, 'Nama wajib diisi').max(120, 'Nama maksimal 120 karakter'),
    nip: z.string().trim().min(1, 'NIP wajib diisi').max(30, 'NIP maksimal 30 karakter'),
    gol: z.string().trim().max(50).default(''),
    jabatan: z.string().trim().max(120).default(''),
    unitKerja: z.string().trim().max(160).default(''),
    periodeMulai: isoDate.optional().or(z.literal('')),
    periodeSelesai: isoDate.optional().or(z.literal('')),
  })
  .superRefine(validatePeriodRange)

export const lkhEntrySchema = z.object({
  nama: z.string().trim().min(1, 'Nama wajib diisi').max(120, 'Nama maksimal 120 karakter'),
  nip: z.string().trim().min(1, 'NIP wajib diisi').max(30, 'NIP maksimal 30 karakter'),
  gol: optionalText.default(''),
  jabatan: optionalText.default(''),
  unitKerja: optionalText.default(''),
  tanggal: isoDate,
  jam: time.or(z.literal('')),
  uraianKegiatan: z.string().trim().min(1, 'Uraian kegiatan wajib diisi').max(1000, 'Uraian maksimal 1000 karakter'),
  tempat: z.string().trim().min(1, 'Tempat wajib diisi').max(160, 'Tempat maksimal 160 karakter'),
  penjab: z.string().trim().min(1, 'Penanggung jawab wajib diisi').max(120, 'Penanggung jawab maksimal 120 karakter'),
  dasarSurat: z.string().trim().max(300).default(''),
  outputHasilKerja: z.string().trim().min(1, 'Output/hasil kerja wajib diisi').max(500, 'Output maksimal 500 karakter'),
  buktiDukung: z.string().max(2_000_000, 'Bukti dukung terlalu besar').default(''),
})

export const lkhFormSchema = lkhEntrySchema
  .extend({
    periodeMulai: isoDate.optional().or(z.literal('')),
    periodeSelesai: isoDate.optional().or(z.literal('')),
  })
  .superRefine(validatePeriodRange)

/** Validate raw LKH entry input. Always use safeParse for user input. */
export function validateLkh(input) {
  return lkhEntrySchema.safeParse(input)
}

/** Validate raw profile input. Always use safeParse for user input. */
export function validateProfile(input) {
  return profileSchema.safeParse(input)
}

/** Coerce + sanitize a JSON-parsed seed entry into a StoredLkhEntry. */
export function parseSeedEntry(input) {
  const parsed = lkhEntrySchema.safeParse(input)
  if (!parsed.success) return null
  return {
    ...parsed.data,
    id: input.id || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: input.createdAt || new Date().toISOString(),
  }
}
