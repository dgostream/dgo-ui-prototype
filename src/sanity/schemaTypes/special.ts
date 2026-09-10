import { defineField, defineType } from 'sanity'

export const special = defineType({
  name: 'special',
  title: 'Special / PVOD',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' }, validation: (rule) => rule.required() }),
    defineField({ name: 'subtitle', type: 'string' }),
    defineField({ name: 'desc', type: 'text' }),
    defineField({ name: 'tag', type: 'string', initialValue: 'PVOD • Exclusive' }),
    defineField({ name: 'accent', type: 'string', initialValue: '#f59e0b' }),
    defineField({ name: 'img', title: 'Poster Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'heroImg', title: 'Hero Carousel Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'detailsHeroImg', title: 'Details Page Hero Background', type: 'image', options: { hotspot: true }, description: 'High-res background for the details page' }),
    defineField({
      name: 'heroVideo',
      title: 'Hero Carousel Video (Optional loop)',
      type: 'file',
      options: { accept: 'video/webm,video/mp4' },
    }),
    defineField({ name: 'price', type: 'string', description: 'e.g. रू 199' }),
    defineField({ name: 'isPPV', type: 'boolean', initialValue: true }),
    defineField({ name: 'eventDate', type: 'datetime' }),
    defineField({
      name: 'isHero',
      title: 'Show in Hero Carousel?',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'targetTab',
      title: 'Target Tab / Vertical',
      type: 'string',
      options: {
        list: [
          { title: 'Specials', value: 'specials' },
          { title: 'Entertainment', value: 'entertainment' },
        ],
      },
      initialValue: 'specials',
    }),
    defineField({
      name: 'rowName',
      title: 'Section / Row Name',
      type: 'string',
      description: 'e.g. Exclusive Standups, Live Concerts',
    }),
    defineField({
      name: 'monetization',
      title: 'Monetization Model',
      type: 'string',
      options: {
        list: [
          { title: 'PVOD (Premium VOD)', value: 'pvod' },
          { title: 'PPV (Pay Per View)', value: 'ppv' },
          { title: 'Included in Package', value: 'package' },
        ],
      },
      initialValue: 'pvod',
    }),
    defineField({
      name: 'video',
      title: 'Video File',
      type: 'file',
      options: { accept: 'video/webm,video/mp4' }
    }),
  ],
})
