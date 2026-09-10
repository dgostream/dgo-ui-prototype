import { defineField, defineType } from 'sanity'

export const verticalSettings = defineType({
  name: 'verticalSettings',
  title: 'Tab / Vertical Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Tab Name',
      type: 'string',
      options: {
        list: [
          { title: 'JioHotstar', value: 'JioHotstar' },
          { title: 'OSR', value: 'OSR' },
          { title: 'Entertainment', value: 'Entertainment' },
          { title: 'Sports', value: 'Sports' },
          { title: 'Specials', value: 'Specials' },
          { title: 'Junior', value: 'Junior' },
          { title: 'Live TV', value: 'Live TV' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tabId',
      title: 'Tab ID',
      type: 'string',
      description: 'Internal ID matching the app tabs (e.g. entertainment, sports)',
      options: {
        list: [
          { title: 'hotstar', value: 'hotstar' },
          { title: 'osr', value: 'osr' },
          { title: 'entertainment', value: 'entertainment' },
          { title: 'sports', value: 'sports' },
          { title: 'specials', value: 'specials' },
          { title: 'junior', value: 'junior' },
          { title: 'live', value: 'live' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'sections',
      title: 'Content Sections (Rows)',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'title', title: 'Section Title', type: 'string' }),
            defineField({ 
              name: 'icon', 
              title: 'Lucide Icon', 
              type: 'string',
              description: 'e.g. Flame, Star, Trophy'
            }),
            defineField({ 
              name: 'queryRowName', 
              title: 'Match Row Name', 
              type: 'string',
              description: 'Matches the "Section / Row Name" field in content documents'
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
        },
      ],
    }),
  ],
})
