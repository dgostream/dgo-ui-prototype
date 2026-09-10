import { defineField, defineType } from 'sanity'

export const adSettings = defineType({
  name: 'adSettings',
  title: 'Ad Configuration',
  type: 'document',
  fields: [
    defineField({
      name: 'prerollVideo',
      title: 'Pre-roll Video',
      type: 'file',
      options: { accept: 'video/webm,video/mp4' },
      description: 'Default video for pre-roll ads'
    }),
    defineField({
      name: 'midrollVideo',
      title: 'Mid-roll Video',
      type: 'file',
      options: { accept: 'video/webm,video/mp4' },
      description: 'Default video for mid-roll ads'
    }),
    defineField({
      name: 'pauseAdImage',
      title: 'Pause Ad Billboard',
      type: 'image',
      description: 'Fullscreen image for pause ads'
    }),
    defineField({
      name: 'heroCarouselAd',
      title: 'Hero Carousel Ad',
      description: 'Ad slide injected into the main hero carousel',
      type: 'object',
      fields: [
        defineField({ name: 'image', type: 'image' }),
        defineField({ name: 'link', type: 'url' }),
        defineField({ 
          name: 'order', 
          type: 'number', 
          title: 'Slide Order', 
          description: 'Position in carousel (e.g. 2 for second slide)',
          initialValue: 2 
        }),
        defineField({ name: 'active', type: 'boolean', initialValue: true })
      ]
    }),
    defineField({
      name: 'homeBackgroundAd',
      title: 'Home: Background Takeover',
      description: 'Subtle background image for the home page',
      type: 'image'
    }),
    defineField({
      name: 'feedAd',
      title: 'Home: In-Feed Ad Card',
      description: 'Ad card injected into content carousels (Poster style)',
      type: 'object',
      fields: [
        defineField({ name: 'image', type: 'image' }),
        defineField({ name: 'title', type: 'string' }),
        defineField({ name: 'brand', type: 'string' }),
        defineField({ name: 'link', type: 'url' }),
        defineField({ name: 'active', type: 'boolean', initialValue: true })
      ]
    }),
    defineField({
      name: 'sponsorLogo',
      title: 'Global Sponsor Logo',
      type: 'image',
      description: 'Watermark/Sponsor logo for live events or sports takeovers'
    }),
    defineField({
      name: 'footerBannerAd',
      title: 'Footer Banner Ad',
      type: 'image',
      description: 'Classic banner ad slot placed globally near the footer'
    }),
    defineField({
      name: 'matchHubBannerAd',
      title: 'Match centre banner',
      type: 'image',
      description: '4:1 banner for sports / live match centre placements'
    }),
    defineField({
      name: 'inStreamAd',
      title: 'In-Stream Overlay Ad',
      type: 'image',
      description: 'Animated or static L-bar overlay during continuous playback'
    }),
  ],
})
