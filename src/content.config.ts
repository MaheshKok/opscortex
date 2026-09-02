import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const courses = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/courses' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'All levels']),
    hours: z.number(),
    price: z.number(),
    order: z.number(),
    featured: z.boolean().default(false),
    tags: z.array(z.string()),
    outcomes: z.array(z.string()),
    curriculum: z.array(
      z.object({ title: z.string(), lessons: z.array(z.string()) }),
    ),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    minutes: z.number(),
  }),
});

export const collections = { courses, posts };
