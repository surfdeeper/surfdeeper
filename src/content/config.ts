import { defineCollection, z } from "astro:content";

const guides = defineCollection({
  type: "content",
  schema: z.object({
    // End-state fields (kept optional during migration)
    id: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
    kind: z.enum(["section", "concept"]).optional(),
    order: z.number().optional(),
    level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    levels: z
      .array(z.enum(["beginner", "intermediate", "advanced"]))
      .optional()
      .default([]),
    threads: z.array(z.string()).optional().default([]),
    dependsOn: z.array(z.string()).optional().default([]),
    leadsTo: z.array(z.string()).optional().default([]),
    appliesTo: z.array(z.string()).optional().default([]),
    aliases: z.array(z.string()).optional().default([]),
  }),
});

const spots = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
    skillLevels: z.array(z.enum(["beginner", "intermediate", "advanced"])),
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
