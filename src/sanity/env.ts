export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-02-05'

const rawProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || ''
const rawDataset = process.env.NEXT_PUBLIC_SANITY_DATASET || ''

/** Pages/CI have no .env.local — keep createClient valid and skip CMS fetches. */
export const isSanityConfigured = Boolean(rawProjectId) && rawProjectId !== 'placeholder'

export const dataset = rawDataset || 'production'
export const projectId = rawProjectId || 'placeholder'

export const useCdn = false
