import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, magazines, articles, articleImages, editorialConcepts, visualIdentities, magazineVersions, magazineLikes, shareLinks } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== Magazine Queries =====

export async function createMagazine(data: {
  userId: number;
  title: string;
  coverImagePrompt?: string;
  coverTemplate?: string;
  logoUrl?: string;
  structureData?: any;
  isDeepMode?: boolean;
  gameOfTheWeekTitle?: string;
  gameOfTheWeekDescription?: string;
  gameOfTheWeekImagePrompt?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(magazines).values({
    userId: data.userId,
    title: data.title,
    coverImagePrompt: data.coverImagePrompt || null,
    coverTemplate: data.coverTemplate || null,
    logoUrl: data.logoUrl || null,
    structureData: data.structureData || null,
    isDeepMode: data.isDeepMode || false,
    gameOfTheWeekTitle: data.gameOfTheWeekTitle || null,
    gameOfTheWeekDescription: data.gameOfTheWeekDescription || null,
    gameOfTheWeekImagePrompt: data.gameOfTheWeekImagePrompt || null,
  });
  return result[0].insertId;
}

export async function getMagazinesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(magazines).where(eq(magazines.userId, userId)).orderBy(desc(magazines.createdAt));
}

export async function getMagazineById(magazineId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(magazines).where(eq(magazines.id, magazineId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateMagazine(magazineId: number, data: Partial<{
  title: string;
  coverImageUrl: string | null;
  coverImagePrompt: string | null;
  logoUrl: string | null;
  gameOfTheWeekTitle: string | null;
  gameOfTheWeekDescription: string | null;
  gameOfTheWeekImagePrompt: string | null;
  gameOfTheWeekImageUrl: string | null;
  structureData: any;
  status: "draft" | "generating" | "complete";
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(magazines).set(data).where(eq(magazines.id, magazineId));
}

export async function deleteMagazine(magazineId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete related data first
  const arts = await db.select().from(articles).where(eq(articles.magazineId, magazineId));
  for (const art of arts) {
    await db.delete(articleImages).where(eq(articleImages.articleId, art.id));
  }
  await db.delete(articles).where(eq(articles.magazineId, magazineId));
  await db.delete(magazineVersions).where(eq(magazineVersions.magazineId, magazineId));
  await db.delete(magazines).where(eq(magazines.id, magazineId));
}

// ===== Ownership Helpers =====

export async function getArticleById(articleId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(articles).where(eq(articles.id, articleId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function verifyArticleOwnership(articleId: number, userId: number): Promise<boolean> {
  const article = await getArticleById(articleId);
  if (!article) return false;
  const mag = await getMagazineById(article.magazineId);
  return mag !== null && mag.userId === userId;
}

export async function getArticleImageById(imageId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(articleImages).where(eq(articleImages.id, imageId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function verifyImageOwnership(imageId: number, userId: number): Promise<boolean> {
  const img = await getArticleImageById(imageId);
  if (!img) return false;
  return verifyArticleOwnership(img.articleId, userId);
}

// ===== Article Queries =====

export async function createArticle(data: {
  magazineId: number;
  articleIndex: number;
  title: string;
  contentPrompt?: string;
  tipsPrompt?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(articles).values({
    magazineId: data.magazineId,
    articleIndex: data.articleIndex,
    title: data.title,
    contentPrompt: data.contentPrompt || null,
    tipsPrompt: data.tipsPrompt || null,
  });
  return result[0].insertId;
}

export async function getArticlesByMagazine(magazineId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(articles).where(eq(articles.magazineId, magazineId)).orderBy(articles.articleIndex);
}

export async function updateArticle(articleId: number, data: Partial<{
  title: string;
  content: string | null;
  tips: string | null;
  contentPrompt: string | null;
  tipsPrompt: string | null;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(articles).set(data).where(eq(articles.id, articleId));
}

// ===== Article Images =====

export async function createArticleImage(data: {
  articleId: number;
  imageIndex: number;
  imageType: "logo" | "gameplay" | "artwork";
  prompt?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(articleImages).values({
    articleId: data.articleId,
    imageIndex: data.imageIndex,
    imageType: data.imageType,
    prompt: data.prompt || null,
  });
  return result[0].insertId;
}

export async function getImagesByArticle(articleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(articleImages).where(eq(articleImages.articleId, articleId)).orderBy(articleImages.imageIndex);
}

export async function updateArticleImage(imageId: number, data: Partial<{
  prompt: string | null;
  imageUrl: string | null;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(articleImages).set(data).where(eq(articleImages.id, imageId));
}

// ===== Editorial Concepts =====

export async function getEditorialConceptByUser(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(editorialConcepts).where(eq(editorialConcepts.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertEditorialConcept(userId: number, conceptData: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getEditorialConceptByUser(userId);
  if (existing) {
    await db.update(editorialConcepts).set({ conceptData }).where(eq(editorialConcepts.id, existing.id));
    return existing.id;
  } else {
    const result = await db.insert(editorialConcepts).values({ userId, conceptData });
    return result[0].insertId;
  }
}

// ===== Visual Identity =====

export async function getVisualIdentityByUser(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(visualIdentities).where(eq(visualIdentities.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertVisualIdentity(userId: number, data: { magazineName: string; logoUrl?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getVisualIdentityByUser(userId);
  if (existing) {
    await db.update(visualIdentities).set(data).where(eq(visualIdentities.id, existing.id));
    return existing.id;
  } else {
    const result = await db.insert(visualIdentities).values({ userId, magazineName: data.magazineName, logoUrl: data.logoUrl || null });
    return result[0].insertId;
  }
}

// ===== Public Gallery =====

export async function getPublicMagazines(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  const mags = await db.select({
    id: magazines.id,
    title: magazines.title,
    coverImageUrl: magazines.coverImageUrl,
    coverTemplate: magazines.coverTemplate,
    status: magazines.status,
    createdAt: magazines.createdAt,
    userId: magazines.userId,
  }).from(magazines)
    .where(and(eq(magazines.isPublic, true), eq(magazines.status, "complete")));
  
  const ids = mags.map(m => m.id);
  const likeCounts = await getLikeCounts(ids);
  
  const sorted = mags.sort((a, b) => {
    const likesA = likeCounts[a.id] || 0;
    const likesB = likeCounts[b.id] || 0;
    if (likesB !== likesA) return likesB - likesA;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  return sorted.slice(offset, offset + limit);
}

export async function getPublicMagazineWithDetails(magazineId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(magazines)
    .where(and(eq(magazines.id, magazineId), eq(magazines.isPublic, true)))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function toggleMagazinePublic(magazineId: number, isPublic: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(magazines).set({ isPublic }).where(eq(magazines.id, magazineId));
}

// ===== Magazine Versions =====

export async function createMagazineVersion(magazineId: number, versionData: any, versionLabel?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(magazineVersions).values({
    magazineId,
    versionData,
    versionLabel: versionLabel || null,
  });
  return result[0].insertId;
}

export async function getMagazineVersions(magazineId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(magazineVersions).where(eq(magazineVersions.magazineId, magazineId)).orderBy(desc(magazineVersions.createdAt));
}

export async function getMagazineVersionById(versionId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(magazineVersions).where(eq(magazineVersions.id, versionId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ===== Likes =====

import { sql, count } from "drizzle-orm";

export async function toggleLike(magazineId: number, userId: number): Promise<{ liked: boolean; totalLikes: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if already liked
  const existing = await db.select().from(magazineLikes)
    .where(and(eq(magazineLikes.magazineId, magazineId), eq(magazineLikes.userId, userId)))
    .limit(1);

  if (existing.length > 0) {
    // Unlike
    await db.delete(magazineLikes).where(
      and(eq(magazineLikes.magazineId, magazineId), eq(magazineLikes.userId, userId))
    );
  } else {
    // Like
    await db.insert(magazineLikes).values({ magazineId, userId });
  }

  // Get total count
  const countResult = await db.select({ value: count() }).from(magazineLikes)
    .where(eq(magazineLikes.magazineId, magazineId));
  const totalLikes = countResult[0]?.value || 0;

  return { liked: existing.length === 0, totalLikes };
}

export async function getLikeCount(magazineId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ value: count() }).from(magazineLikes)
    .where(eq(magazineLikes.magazineId, magazineId));
  return result[0]?.value || 0;
}

export async function getUserLikes(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({ magazineId: magazineLikes.magazineId }).from(magazineLikes)
    .where(eq(magazineLikes.userId, userId));
  return result.map(r => r.magazineId);
}

export async function getLikeCounts(magazineIds: number[]): Promise<Record<number, number>> {
  const db = await getDb();
  if (!db) return {};
  if (magazineIds.length === 0) return {};
  const results = await db.select({
    magazineId: magazineLikes.magazineId,
    likeCount: count(),
  }).from(magazineLikes)
    .where(sql`${magazineLikes.magazineId} IN (${sql.join(magazineIds.map(id => sql`${id}`), sql`, `)})`)
    .groupBy(magazineLikes.magazineId);
  const map: Record<number, number> = {};
  for (const r of results) {
    map[r.magazineId] = r.likeCount;
  }
  return map;
}

// ===== Share Links =====

export async function createShareLink(magazineId: number, userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if link already exists
  const existing = await db.select().from(shareLinks)
    .where(and(eq(shareLinks.magazineId, magazineId), eq(shareLinks.userId, userId)))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].shortCode;
  }

  // Generate a short code
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let shortCode = "";
  for (let i = 0; i < 8; i++) {
    shortCode += chars[Math.floor(Math.random() * chars.length)];
  }

  await db.insert(shareLinks).values({ magazineId, userId, shortCode });
  return shortCode;
}

export async function getMagazineByShareCode(shortCode: string) {
  const db = await getDb();
  if (!db) return null;
  const link = await db.select().from(shareLinks).where(eq(shareLinks.shortCode, shortCode)).limit(1);
  if (link.length === 0) return null;
  const mag = await db.select().from(magazines).where(eq(magazines.id, link[0].magazineId)).limit(1);
  return mag.length > 0 ? mag[0] : null;
}

export async function getShareLinkByMagazine(magazineId: number, userId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(shareLinks)
    .where(and(eq(shareLinks.magazineId, magazineId), eq(shareLinks.userId, userId)))
    .limit(1);
  return result.length > 0 ? result[0].shortCode : null;
}
