import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  getMagazinesByUser: vi.fn().mockResolvedValue([
    { id: 1, userId: 1, title: "Test Magazine", status: "draft", createdAt: new Date(), coverImageUrl: null },
  ]),
  getMagazineById: vi.fn().mockResolvedValue({
    id: 1, userId: 1, title: "Test Magazine", status: "draft", createdAt: new Date(),
    coverImageUrl: null, coverImagePrompt: null, logoUrl: null,
    gameOfTheWeekTitle: null, gameOfTheWeekDescription: null,
    gameOfTheWeekImagePrompt: null, gameOfTheWeekImageUrl: null,
    structureData: null, isDeepMode: false,
  }),
  createMagazine: vi.fn().mockResolvedValue(1),
  updateMagazine: vi.fn().mockResolvedValue(undefined),
  deleteMagazine: vi.fn().mockResolvedValue(undefined),
  getArticlesByMagazine: vi.fn().mockResolvedValue([]),
  getEditorialConceptByUser: vi.fn().mockResolvedValue(null),
  getVisualIdentityByUser: vi.fn().mockResolvedValue(null),
  getMagazineVersions: vi.fn().mockResolvedValue([]),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("magazine routes", () => {
  it("lists user magazines", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.magazine.list();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Test Magazine");
  });

  it("gets a magazine by id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.magazine.get({ id: 1 });
    expect(result).not.toBeNull();
    expect(result?.title).toBe("Test Magazine");
  });

  it("creates a magazine", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.magazine.create({
      title: "New Magazine",
      isDeepMode: false,
    });
    expect(result).toHaveProperty("id");
  });
});

describe("profile routes", () => {
  it("returns null when no editorial concept exists", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.profile.getEditorialConcept();
    expect(result).toBeNull();
  });

  it("returns null when no visual identity exists", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.profile.getVisualIdentity();
    expect(result).toBeNull();
  });
});

describe("version routes", () => {
  it("lists versions for a magazine", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.version.list({ magazineId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});
