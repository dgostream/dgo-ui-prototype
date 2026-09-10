import { defineField, defineType } from 'sanity'

export const heroCarousel = defineType({
  name: 'heroCarousel',
  title: 'Hero Carousel',
  type: 'document',
  fields: [
    defineField({
      name: 'vertical',
      title: 'Vertical / Tab',
      type: 'string',
      options: {
        list: [
          { title: 'JioHotstar', value: 'hotstar' },
          { title: 'OSR', value: 'osr' },
          { title: 'Entertainment', value: 'entertainment' },
          { title: 'Sports', value: 'sports' },
          { title: 'Specials', value: 'specials' },
          { title: 'Junior', value: 'junior' },
          { title: 'Live TV', value: 'live' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'items',
      title: 'Carousel Items',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [
            { type: 'movie' },
            { type: 'series' },
            { type: 'sports' },
            { type: 'special' },
            { type: 'content' },
          ],
        },
      ],
      validation: (rule) => rule.max(5),
    }),
  ],
})
