import { defineField, defineType } from 'sanity'

export const content = defineType({
  name: 'content',
  title: 'Content',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
    }),
    defineField({
      name: 'desc',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'tag',
      title: 'Tag',
      type: 'string',
    }),
    defineField({
      name: 'accent',
      title: 'Accent Color',
      type: 'string',
      description: 'Hex color code (e.g. #E50914)',
    }),
    defineField({
      name: 'img',
      title: 'Cover Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'type',
      title: 'Content Type',
      type: 'string',
      options: {
        list: [
          { title: 'Movie', value: 'movie' },
          { title: 'Series', value: 'series' },
          { title: 'Sports', value: 'sports' },
          { title: 'Special', value: 'special' },
          { title: 'Live', value: 'live' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'string',
    }),
    defineField({
      name: 'rating',
      title: 'Rating',
      type: 'string',
    }),
    defineField({
      name: 'duration',
      title: 'Duration',
      type: 'string',
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'string',
    }),
    defineField({
      name: 'isPPV',
      title: 'Is PPV',
      type: 'boolean',
    }),
    defineField({
      name: 'cast',
      title: 'Cast',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'director',
      title: 'Director',
      type: 'string',
    }),
    defineField({
      name: 'genres',
      title: 'Genres',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'episodes',
      title: 'Episodes',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'id', type: 'number', title: 'Episode Number' }),
            defineField({ name: 'title', type: 'string', title: 'Title' }),
            defineField({ name: 'duration', type: 'string', title: 'Duration' }),
            defineField({ name: 'desc', type: 'text', title: 'Description' }),
          ],
        },
      ],
      hidden: ({ document }) => document?.type !== 'series',
    }),
  ],
})
