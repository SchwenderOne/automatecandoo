import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema from the original template
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Post generation schema for our application
export const postGenerations = pgTable("post_generations", {
  id: serial("id").primaryKey(),
  sourceUrl: text("source_url").notNull(),
  generatedPost: text("generated_post").notNull(),
  originalPost: text("original_post").notNull(), // Originaler Post vor Bearbeitung
  hotelName: text("hotel_name"),
  hotelCategory: text("hotel_category"),
  destination: text("destination"),
  features: jsonb("features").$type<{icon: string, text: string}[]>(),
  customSections: jsonb("custom_sections").$type<{title: string, items: {icon: string, text: string}[]}[]>(), // Benutzerdefinierte Abschnitte
  createdAt: text("created_at").notNull(),
});

export const insertPostGenerationSchema = createInsertSchema(postGenerations).omit({
  id: true,
});

// Request schema for post generation
export const generatePostSchema = z.object({
  url: z.string().url("Eine gültige URL ist erforderlich"),
  useEmojis: z.boolean().default(true),
  style: z.enum(["enthusiastic", "elegant", "family", "adventure"]).default("enthusiastic"),
});

// Response schema for post generation
export const postGenerationResponseSchema = z.object({
  generatedPost: z.string(),
  originalPost: z.string(), // Originaler Post vor Bearbeitung
  sourceInfo: z.object({
    hotelName: z.string(),
    hotelCategory: z.string().optional(),
    destination: z.string(),
    featuresWithIcons: z.array(z.object({
      icon: z.string(),
      text: z.string()
    })),
    customSections: z.array(z.object({
      title: z.string(),
      items: z.array(z.object({
        icon: z.string(),
        text: z.string()
      }))
    })).optional().default([]),
    originalUrl: z.string()
  })
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPostGeneration = z.infer<typeof insertPostGenerationSchema>;
export type PostGeneration = typeof postGenerations.$inferSelect;
export type GeneratePostRequest = z.infer<typeof generatePostSchema>;
export type PostGenerationResponse = z.infer<typeof postGenerationResponseSchema>;
