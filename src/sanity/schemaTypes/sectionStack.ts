import { defineField, defineType } from 'sanity'

export const sectionStack = defineType({
  name: 'sectionStack',
  title: 'Content Row / Stack',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({ 
      name: 'vertical', 
      type: 'string', 
      options: {
        list: [
          { title: 'JioHotstar', value: 'hotstar' },
          { title: 'OSR', value: 'osr' },
          { title: 'Entertainment', value: 'entertainment' },
          { title: 'Sports', value: 'sports' },
          { title: 'Specials', value: 'specials' },
          { title: 'Junior', value: 'junior' },
        ]
      }
    }),
    defineField({
      name: 'icon',
      type: 'string',
      description: 'Lucide icon name (e.g. Star, Flame, Trophy)',
    }),
    defineField({
      name: 'items',
      title: 'Content Items',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [
            { type: 'movie' }, 
            { type: 'series' }, 
            { type: 'sports' }, 
            { type: 'special' }, 
            { type: 'content' }
          ],
        },
      ],
    }),
    defineField({
      name: 'fomoType',
      title: 'FOMO Badge',
      type: 'string',
      options: {
        list: [
          { title: 'None', value: 'none' },
          { title: 'Leaving Soon', value: 'leaving' },
          { title: 'Exclusive', value: 'exclusive' },
        ]
      }
    }),
  ],
})
