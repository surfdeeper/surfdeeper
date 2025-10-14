import { defineCollection, z } from "astro:content";

// Legacy 'guides' collection removed after migration; use typed collections below

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

// Paths collection enables richer path metadata (title, description, etc.)
const paths = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    icon: z.string().optional(),
    order: z.number().optional(),
    // New typed graph fields
    type: z.literal("path").optional(),
    // Ordering is author-controlled and required; no fallback ordering
    nodes: z.array(z.string()).min(1),
  }),
});
// New: typed collections for concepts and skills
const concepts = defineCollection({
  type: "content",
  schema: z.object({
    id: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
    // typed graph fields
    type: z.literal("concept").optional(),
    dependsOn: z.array(z.string()).optional().default([]),
    leadsTo: z.array(z.string()).optional().default([]),
    related: z.array(z.string()).optional().default([]),
    paths: z.array(z.string()).optional().default([]),
    // compatibility with legacy fields
    category: z.string().optional(),
    level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    levels: z
      .array(z.enum(["beginner", "intermediate", "advanced"]))
      .optional()
      .default([]),
    aliases: z.array(z.string()).optional().default([]),
  }),
});

const skills = defineCollection({
  type: "content",
  schema: z.object({
    id: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
    // typed graph fields
    type: z.literal("skill").optional(),
    skillLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    dependsOn: z.array(z.string()).optional().default([]),
    leadsTo: z.array(z.string()).optional().default([]),
    related: z.array(z.string()).optional().default([]),
    paths: z.array(z.string()).optional().default([]),
    // compatibility with legacy fields
    category: z.string().optional(),
    level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    levels: z
      .array(z.enum(["beginner", "intermediate", "advanced"]))
      .optional()
      .default([]),
    aliases: z.array(z.string()).optional().default([]),
  }),
});

export const collections = { spots, paths, concepts, skills };
