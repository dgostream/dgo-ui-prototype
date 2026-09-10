import { defineField, defineType } from 'sanity'

export const series = defineType({
  name: 'series',
  title: 'Web Series',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' }, validation: (rule) => rule.required() }),
    defineField({ name: 'subtitle', type: 'string' }),
    defineField({ name: 'desc', type: 'text' }),
    defineField({ name: 'tag', type: 'string' }),
    defineField({ name: 'accent', type: 'string' }),
    defineField({ name: 'img', title: 'Poster Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'heroImg', title: 'Hero Carousel Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'detailsHeroImg', title: 'Details Page Hero Background', type: 'image', options: { hotspot: true }, description: 'High-res background for the details page' }),
    defineField({
      name: 'heroVideo',
      title: 'Hero Carousel Video (Optional loop)',
      type: 'file',
      options: { accept: 'video/webm,video/mp4' },
    }),
    defineField({ name: 'year', type: 'string' }),
    defineField({ name: 'rating', type: 'string' }),
    defineField({
      name: 'episodes',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'id', type: 'number', title: 'Episode Number' }),
            defineField({ name: 'title', type: 'string' }),
            defineField({ name: 'duration', type: 'string' }),
            defineField({ name: 'desc', type: 'text' }),
            defineField({ name: 'thumbnail', title: 'Episode Thumbnail', type: 'image', options: { hotspot: true } }),
            defineField({
              name: 'video',
              title: 'Episode Video',
              type: 'file',
              options: { accept: 'video/webm,video/mp4' }
            }),
          ],
        },
      ],
    }),
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
          { title: 'JioHotstar', value: 'hotstar' },
          { title: 'OSR', value: 'osr' },
          { title: 'Entertainment', value: 'entertainment' },
          { title: 'Sports', value: 'sports' },
          { title: 'Specials', value: 'specials' },
          { title: 'Junior', value: 'junior' },
        ],
      },
    }),
    defineField({
      name: 'rowName',
      title: 'Section / Row Name',
      type: 'string',
      description: 'e.g. Trending Now, New Releases',
    }),
    defineField({
      name: 'monetization',
      title: 'Monetization Model',
      type: 'string',
      options: {
        list: [
          { title: 'Included in Package', value: 'package' },
          { title: 'PVOD (Premium VOD)', value: 'pvod' },
          { title: 'PPV (Pay Per View)', value: 'ppv' },
          { title: 'Free', value: 'free' },
        ],
      },
      initialValue: 'package',
    }),
    defineField({
      name: 'price',
      title: 'Price (if PVOD/PPV)',
      type: 'string',
      description: 'e.g. रू 199',
      hidden: ({ document }) => document?.monetization === 'package' || document?.monetization === 'free',
    }),
    defineField({ name: 'isJunior', title: 'Is Junior Content?', type: 'boolean', initialValue: false }),
  ],
})
