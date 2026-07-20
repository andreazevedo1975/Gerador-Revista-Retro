import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Visual Identity per user
export const visualIdentities = mysqlTable("visual_identities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  magazineName: varchar("magazineName", { length: 255 }).notNull(),
  logoUrl: text("logoUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Editorial Concepts per user
export const editorialConcepts = mysqlTable("editorial_concepts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  conceptData: json("conceptData").notNull(), // EditorialConceptData JSON
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Magazines
export const magazines = mysqlTable("magazines", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  coverImageUrl: text("coverImageUrl"),
  coverImagePrompt: text("coverImagePrompt"),
  logoUrl: text("logoUrl"),
  // Game of the Week
  gameOfTheWeekTitle: varchar("gameOfTheWeekTitle", { length: 500 }),
  gameOfTheWeekDescription: text("gameOfTheWeekDescription"),
  gameOfTheWeekImagePrompt: text("gameOfTheWeekImagePrompt"),
  gameOfTheWeekImageUrl: text("gameOfTheWeekImageUrl"),
  // Structure data (prompts, etc)
  structureData: json("structureData"), // MagazineStructure JSON
  // Status
  status: mysqlEnum("status", ["draft", "generating", "complete"]).default("draft").notNull(),
  isDeepMode: boolean("isDeepMode").default(false),
  isPublic: boolean("isPublic").default(false),
  coverTemplate: varchar("coverTemplate", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Articles within a magazine
export const articles = mysqlTable("articles", {
  id: int("id").autoincrement().primaryKey(),
  magazineId: int("magazineId").notNull(),
  articleIndex: int("articleIndex").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content"),
  tips: text("tips"),
  contentPrompt: text("contentPrompt"),
  tipsPrompt: text("tipsPrompt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Article images
export const articleImages = mysqlTable("article_images", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull(),
  imageIndex: int("imageIndex").notNull(),
  imageType: mysqlEnum("imageType", ["logo", "gameplay", "artwork"]).notNull(),
  prompt: text("prompt"),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Magazine version history
export const magazineVersions = mysqlTable("magazine_versions", {
  id: int("id").autoincrement().primaryKey(),
  magazineId: int("magazineId").notNull(),
  versionData: json("versionData").notNull(), // Full magazine snapshot
  versionLabel: varchar("versionLabel", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Likes on public magazines
export const magazineLikes = mysqlTable("magazine_likes", {
  id: int("id").autoincrement().primaryKey(),
  magazineId: int("magazineId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Share links for magazines
export const shareLinks = mysqlTable("share_links", {
  id: int("id").autoincrement().primaryKey(),
  magazineId: int("magazineId").notNull(),
  userId: int("userId").notNull(),
  shortCode: varchar("shortCode", { length: 12 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
