import { defineField, defineType } from 'sanity'

export const liveChannel = defineType({
  name: 'liveChannel',
  title: 'Live TV Channel',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'genre', type: 'string', options: {
      list: ['News', 'Sports', 'Entertainment', 'Junior', 'Infotainment']
    }}),
    defineField({ name: 'logo', type: 'image' }),
    defineField({ name: 'currentProgram', type: 'string' }),
    defineField({ name: 'startTime', type: 'string' }),
    defineField({ name: 'endTime', type: 'string' }),
    defineField({ name: 'progress', type: 'number', validation: (rule) => rule.min(0).max(100) }),
    defineField({ name: 'viewers', type: 'string', description: 'e.g. 1.2M' }),
    defineField({ name: 'isLive', type: 'boolean', initialValue: true }),
  ],
})
