import { type SchemaTypeDefinition } from 'sanity'
import { content } from './content'
import { movie } from './movie'
import { series } from './series'
import { sports } from './sports'
import { special } from './special'
import { liveChannel } from './liveChannel'
import { heroCarousel } from './heroCarousel'
import { sectionStack } from './sectionStack'
import { verticalSettings } from './verticalSettings'
import { adSettings } from './adSettings'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [content, movie, series, sports, special, liveChannel, heroCarousel, sectionStack, verticalSettings, adSettings],
}
