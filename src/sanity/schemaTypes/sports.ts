import { defineField, defineType } from 'sanity'

export const sports = defineType({
  name: 'sports',
  title: 'Sports Event',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' }, validation: (rule) => rule.required() }),
    defineField({ name: 'subtitle', type: 'string', description: 'e.g. T20I Finals' }),
    defineField({ name: 'desc', type: 'text' }),
    defineField({ name: 'tag', type: 'string', description: 'e.g. Live, Highlights' }),
    defineField({ name: 'accent', type: 'string', initialValue: '#1d4ed8' }),
    defineField({ name: 'img', title: 'Poster Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'heroImg', title: 'Hero Carousel Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'detailsHeroImg', title: 'Details Page Hero Background', type: 'image', options: { hotspot: true }, description: 'High-res background for the details page' }),
    defineField({
      name: 'heroVideo',
      title: 'Hero Carousel Video (Optional loop)',
      type: 'file',
      options: { accept: 'video/webm,video/mp4' },
    }),
    defineField({ name: 'eventDate', type: 'datetime' }),
    defineField({ name: 'isLive', type: 'boolean', initialValue: false }),
    defineField({ name: 'league', type: 'string', description: 'e.g. NSL, CWC' }),
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
          { title: 'Sports', value: 'sports' },
          { title: 'Specials', value: 'specials' },
        ],
      },
      initialValue: 'sports',
    }),
    defineField({
      name: 'rowName',
      title: 'Section / Row Name',
      type: 'string',
      description: 'e.g. Live Matches, Trending Highlights',
    }),
    defineField({
      name: 'monetization',
      title: 'Monetization Model',
      type: 'string',
      options: {
        list: [
          { title: 'Included in Package', value: 'package' },
          { title: 'PPV (Pay Per View)', value: 'ppv' },
          { title: 'Free', value: 'free' },
        ],
      },
      initialValue: 'package',
    }),
    defineField({
      name: 'price',
      title: 'Price (if PPV)',
      type: 'string',
      description: 'e.g. रू 499',
      hidden: ({ document }) => document?.monetization === 'package' || document?.monetization === 'free',
    }),
    defineField({
      name: 'video',
      title: 'Video File',
      type: 'file',
      options: { accept: 'video/webm,video/mp4' }
    }),
  ],
})
