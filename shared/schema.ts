import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const videos = pgTable("videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  youtubeUrl: text("youtube_url").notNull(),
  title: text("title").notNull(),
  duration: integer("duration").notNull(), // in seconds
  thumbnail: text("thumbnail"),
  channel: text("channel"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, error
});

export const selections = pgTable("selections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  startTime: integer("start_time").notNull(), // in seconds
  endTime: integer("end_time").notNull(), // in seconds
  title: text("title").notNull(),
  filename: text("filename"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, error
  filePath: text("file_path"),
  fileSize: integer("file_size"), // in bytes
});

export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  status: text("status").notNull().default("pending"), // pending, processing, completed, error
  progress: integer("progress").notNull().default(0), // 0-100
  error: text("error"),
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  status: true,
});

export const insertSelectionSchema = createInsertSchema(selections).omit({
  id: true,
  filename: true,
  status: true,
  filePath: true,
  fileSize: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  status: true,
  progress: true,
  error: true,
});

// Request/Response schemas
export const processVideoRequestSchema = z.object({
  youtubeUrl: z.string().url(),
  selections: z.array(z.object({
    startTime: z.string().regex(/^([0-5]?[0-9]):([0-5][0-9])$|^([0-1]?[0-9]):([0-5]?[0-9]):([0-5][0-9])$/),
    endTime: z.string().regex(/^([0-5]?[0-9]):([0-5][0-9])$|^([0-1]?[0-9]):([0-5]?[0-9]):([0-5][0-9])$/),
    title: z.string().min(1),
  })).min(1),
});

export const validateYoutubeUrlSchema = z.object({
  youtubeUrl: z.string().url(),
});

export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videos.$inferSelect;
export type InsertSelection = z.infer<typeof insertSelectionSchema>;
export type Selection = typeof selections.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;
export type ProcessVideoRequest = z.infer<typeof processVideoRequestSchema>;
export type ValidateYoutubeUrlRequest = z.infer<typeof validateYoutubeUrlSchema>;
