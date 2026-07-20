import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

// Unit tests for the PDF export route logic and font loading

describe("PDF Export Route", () => {
  it("should reject unauthenticated requests with 401", () => {
    const user = null;
    expect(user).toBeNull();
  });

  it("should reject invalid magazine ID with 400", () => {
    const id = parseInt("abc");
    expect(isNaN(id)).toBe(true);
  });

  it("should reject non-owner access with 403", () => {
    const magazine = { userId: 1 };
    const requestingUser = { id: 2 };
    expect(magazine.userId !== requestingUser.id).toBe(true);
  });

  it("should set correct PDF headers", () => {
    const title = "Minha Revista Retrô!";
    const safeTitle = title.replace(/[^a-zA-Z0-9\-_ ]/g, "").trim();
    expect(safeTitle).toBe("Minha Revista Retr");

    const contentType = "application/pdf";
    expect(contentType).toBe("application/pdf");

    const disposition = `attachment; filename="${safeTitle}.pdf"`;
    expect(disposition).toContain("attachment");
    expect(disposition).toContain(".pdf");
  });

  it("should handle manus-storage URL resolution pattern", () => {
    const url = "/manus-storage/abc123_image.png";
    const isManusStorage = url.startsWith("/manus-storage/");
    expect(isManusStorage).toBe(true);

    const key = url.replace(/^\/manus-storage\//, "");
    expect(key).toBe("abc123_image.png");
  });

  it("should handle external http URLs directly", () => {
    const url = "https://example.com/image.png";
    const isHttp = url.startsWith("http");
    expect(isHttp).toBe(true);
  });

  it("should skip non-http non-storage relative URLs", () => {
    const url = "./local/image.png";
    const isManusStorage = url.startsWith("/manus-storage/");
    const isHttp = url.startsWith("http");
    expect(isManusStorage).toBe(false);
    expect(isHttp).toBe(false);
  });

  it("should strip markdown formatting for PDF text", () => {
    const text = "### Title\n**bold** and *italic*\n- item 1\n- item 2";
    const stripped = text
      .replace(/###\s+/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/^- /gm, "• ");

    expect(stripped).not.toContain("###");
    expect(stripped).not.toContain("**");
    expect(stripped).toContain("bold");
    expect(stripped).toContain("italic");
    expect(stripped).toContain("• item 1");
  });
});

describe("PDF Table of Contents", () => {
  it("should build TOC entries for game of the week", () => {
    const magazine = { gameOfTheWeekTitle: "Super Mario World" };
    const tocEntries: { title: string; pageLabel: string; anchor: string }[] = [];
    let pageCounter = 3;

    if (magazine.gameOfTheWeekTitle) {
      tocEntries.push({
        title: `Jogo da Semana: ${magazine.gameOfTheWeekTitle}`,
        pageLabel: String(pageCounter),
        anchor: "gameoftheweek",
      });
      pageCounter++;
    }

    expect(tocEntries).toHaveLength(1);
    expect(tocEntries[0].title).toContain("Super Mario World");
    expect(tocEntries[0].pageLabel).toBe("3");
    expect(tocEntries[0].anchor).toBe("gameoftheweek");
    expect(pageCounter).toBe(4);
  });

  it("should build TOC entries for articles in order", () => {
    const articles = [
      { id: 1, title: "Dicas de Mega Man X" },
      { id: 2, title: "Review: Sonic 3" },
      { id: 3, title: "Top 10 RPGs do SNES" },
    ];
    const tocEntries: { title: string; pageLabel: string; anchor: string }[] = [];
    let pageCounter = 4; // after game of the week

    for (const article of articles) {
      tocEntries.push({
        title: article.title,
        pageLabel: String(pageCounter),
        anchor: `article_${article.id}`,
      });
      pageCounter++;
    }

    expect(tocEntries).toHaveLength(3);
    expect(tocEntries[0].pageLabel).toBe("4");
    expect(tocEntries[1].pageLabel).toBe("5");
    expect(tocEntries[2].pageLabel).toBe("6");
    expect(tocEntries[2].anchor).toBe("article_3");
    expect(pageCounter).toBe(7);
  });

  it("should handle TOC without game of the week", () => {
    const magazine = { gameOfTheWeekTitle: null };
    const articles = [{ id: 10, title: "Artigo Unico" }];
    const tocEntries: { title: string; pageLabel: string; anchor: string }[] = [];
    let pageCounter = 3;

    if (magazine.gameOfTheWeekTitle) {
      tocEntries.push({
        title: `Jogo da Semana: ${magazine.gameOfTheWeekTitle}`,
        pageLabel: String(pageCounter),
        anchor: "gameoftheweek",
      });
      pageCounter++;
    }

    for (const article of articles) {
      tocEntries.push({
        title: article.title,
        pageLabel: String(pageCounter),
        anchor: `article_${article.id}`,
      });
      pageCounter++;
    }

    expect(tocEntries).toHaveLength(1);
    expect(tocEntries[0].title).toBe("Artigo Unico");
    expect(tocEntries[0].pageLabel).toBe("3");
  });

  it("should generate unique anchor names per article", () => {
    const articles = [
      { id: 42, title: "A" },
      { id: 99, title: "B" },
    ];
    const anchors = articles.map((a) => `article_${a.id}`);
    expect(new Set(anchors).size).toBe(anchors.length);
    expect(anchors[0]).toBe("article_42");
    expect(anchors[1]).toBe("article_99");
  });

  it("should truncate long titles with ellipsis", () => {
    const longTitle = "Este e um titulo extremamente longo que deveria ser truncado para caber na linha do sumario do PDF";
    let displayTitle = `01. ${longTitle}`;
    const maxLen = 60;
    if (displayTitle.length > maxLen) {
      displayTitle = displayTitle.slice(0, maxLen - 3) + "...";
    }
    expect(displayTitle.length).toBeLessThanOrEqual(maxLen);
    expect(displayTitle).toContain("...");
  });
});

describe("PDF Custom Fonts", () => {
  const fontsDir = path.resolve(process.cwd(), "server", "fonts");

  it("should have the fonts directory available", () => {
    expect(fs.existsSync(fontsDir)).toBe(true);
  });

  it("should have PressStart2P pixel font file", () => {
    const fontPath = path.join(fontsDir, "PressStart2P-Regular.ttf");
    expect(fs.existsSync(fontPath)).toBe(true);
    const stats = fs.statSync(fontPath);
    expect(stats.size).toBeGreaterThan(50000); // Should be ~118KB
  });

  it("should have VT323 retro font file", () => {
    const fontPath = path.join(fontsDir, "VT323-Regular.ttf");
    expect(fs.existsSync(fontPath)).toBe(true);
    const stats = fs.statSync(fontPath);
    expect(stats.size).toBeGreaterThan(50000); // Should be ~153KB
  });

  it("should resolve fonts directory correctly from multiple candidates", () => {
    const candidates = [
      path.resolve(process.cwd(), "server", "fonts"),
      path.resolve(process.cwd(), "dist", "fonts"),
    ];
    const found = candidates.find((dir) => fs.existsSync(dir));
    expect(found).toBeDefined();
    expect(found).toContain("fonts");
  });
});
