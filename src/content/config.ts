import { defineCollection, z } from 'astro:content';

const guides = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    order: z.number().optional(),
  }),
});

const spots = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
    skillLevels: z.array(z.enum(['beginner', 'intermediate', 'advanced'])),
    waveType: z.string(),
    bottom: z.string(),
    bestSize: z.string(),
    bestTide: z.string(),
    bestWind: z.string(),
    bestSeason: z.string(),
    swellDirection: z.string(),
    hazards: z.array(z.string()),
    parking: z.string(),
    facilities: z.string().optional(),
  }),
});

export const collections = { guides, spots };


