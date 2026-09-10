import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId, useCdn } from '../env'

export const client = createClient({
  apiVersion,
  dataset,
  projectId,
  useCdn,
  perspective: 'published',
})

export const writeClient = createClient({
  apiVersion,
  dataset,
  projectId,
  useCdn: false, // Must be false for mutations
  token: process.env.SANITY_API_WRITE_TOKEN,
})
