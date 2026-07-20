import PDFDocument from "pdfkit";
import { Request, Response, Express } from "express";
import { sdk } from "./_core/sdk";
import * as db from "./db";
import axios from "axios";
import { storageGetSignedUrl } from "./storage";
import path from "path";
import fs from "fs";

// Font paths - resolve for both dev (server/fonts) and production (dist/fonts)
function resolveFontsDir(): string {
  const candidates = [
    path.resolve(import.meta.dirname || __dirname, "fonts"),
    path.resolve(import.meta.dirname || __dirname, "..", "server", "fonts"),
    path.resolve(process.cwd(), "server", "fonts"),
    path.resolve(process.cwd(), "dist", "fonts"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  return candidates[0];
}

const FONTS_DIR = resolveFontsDir();
const FONT_PIXEL = path.join(FONTS_DIR, "PressStart2P-Regular.ttf");
const FONT_RETRO = path.join(FONTS_DIR, "VT323-Regular.ttf");

function getFonts() {
  const hasPixel = fs.existsSync(FONT_PIXEL);
  const hasRetro = fs.existsSync(FONT_RETRO);
  return { hasPixel, hasRetro, pixelPath: FONT_PIXEL, retroPath: FONT_RETRO };
}

// Resolve manus-storage URLs to signed download URLs
async function resolveStorageUrl(storagePath: string): Promise<string | null> {
  try {
    const key = storagePath.replace(/^\/manus-storage\//, "");
    const url = await storageGetSignedUrl(key);
    return url || null;
  } catch {
    return null;
  }
}

// Fetch image as buffer from URL
async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    let fetchUrl = url;
    if (url.startsWith("/manus-storage/")) {
      const signedUrl = await resolveStorageUrl(url);
      if (!signedUrl) return null;
      fetchUrl = signedUrl;
    } else if (!url.startsWith("http")) {
      return null;
    }
    const response = await axios.get(fetchUrl, {
      responseType: "arraybuffer",
      timeout: 15000,
      maxRedirects: 5,
    });
    return Buffer.from(response.data);
  } catch (err) {
    console.warn("[PDF] Failed to fetch image:", url);
    return null;
  }
}

// Strip markdown formatting for plain text in PDF
function stripMarkdown(text: string): string {
  return text
    .replace(/###\s+/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^- /gm, "• ");
}

/**
 * Draw a pixel art decorative border around the current page.
 * Creates a retro frame reminiscent of 90s game UI windows with:
 * - Outer thick border in gold
 * - Inner border in cyan
 * - Corner squares (pixel blocks) at each corner
 * - Repeating pixel dots along the edges
 */
function drawPixelBorder(doc: InstanceType<typeof PDFDocument>, variant: "cover" | "toc" | "content" | "back" = "content") {
  const w = doc.page.width;
  const h = doc.page.height;
  const margin = 12;
  const blockSize = 6;

  // Color schemes per variant
  const colors = {
    cover: { outer: "#FFD700", inner: "#00CED1", dots: "#8B5CF6", corner: "#FF6B9D" },
    toc: { outer: "#8B5CF6", inner: "#FFD700", dots: "#00CED1", corner: "#FF6B9D" },
    content: { outer: "#00CED1", inner: "#8B5CF6", dots: "#FFD700", corner: "#00CED1" },
    back: { outer: "#FFD700", inner: "#00CED1", dots: "#8B5CF6", corner: "#FF6B9D" },
  };
  const c = colors[variant];

  // Outer border (thick, 3px)
  doc.save();
  doc.lineWidth(3)
    .rect(margin, margin, w - margin * 2, h - margin * 2)
    .stroke(c.outer);

  // Inner border (thin, 1px) with gap
  doc.lineWidth(1)
    .rect(margin + 5, margin + 5, w - margin * 2 - 10, h - margin * 2 - 10)
    .stroke(c.inner);

  // Corner pixel blocks (4 corners, each is a 3x3 grid of small squares)
  const corners = [
    { x: margin - 1, y: margin - 1 },                    // top-left
    { x: w - margin - blockSize * 3 + 1, y: margin - 1 }, // top-right
    { x: margin - 1, y: h - margin - blockSize * 3 + 1 }, // bottom-left
    { x: w - margin - blockSize * 3 + 1, y: h - margin - blockSize * 3 + 1 }, // bottom-right
  ];

  for (const corner of corners) {
    // 3x3 pixel block pattern
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        // Create a checkerboard pattern
        if ((row + col) % 2 === 0) {
          doc.rect(corner.x + col * blockSize, corner.y + row * blockSize, blockSize, blockSize)
            .fill(c.corner);
        }
      }
    }
  }

  // Pixel dots along top edge
  const dotSpacing = 20;
  const dotSize = 3;
  const startX = margin + blockSize * 3 + 10;
  const endX = w - margin - blockSize * 3 - 10;

  for (let x = startX; x < endX; x += dotSpacing) {
    // Top edge dots
    doc.rect(x, margin + 1, dotSize, dotSize).fill(c.dots);
    // Bottom edge dots
    doc.rect(x, h - margin - dotSize - 1, dotSize, dotSize).fill(c.dots);
  }

  // Pixel dots along left and right edges
  const startY = margin + blockSize * 3 + 10;
  const endY = h - margin - blockSize * 3 - 10;

  for (let y = startY; y < endY; y += dotSpacing) {
    // Left edge dots
    doc.rect(margin + 1, y, dotSize, dotSize).fill(c.dots);
    // Right edge dots
    doc.rect(w - margin - dotSize - 1, y, dotSize, dotSize).fill(c.dots);
  }

  // Small diamond accents at midpoints of each edge
  const midX = w / 2;
  const midY = h / 2;
  const diamondSize = 4;

  // Top midpoint diamond
  doc.save();
  doc.translate(midX, margin + 2);
  doc.path(`M 0 -${diamondSize} L ${diamondSize} 0 L 0 ${diamondSize} L -${diamondSize} 0 Z`).fill(c.outer);
  doc.restore();

  // Bottom midpoint diamond
  doc.save();
  doc.translate(midX, h - margin - 2);
  doc.path(`M 0 -${diamondSize} L ${diamondSize} 0 L 0 ${diamondSize} L -${diamondSize} 0 Z`).fill(c.outer);
  doc.restore();

  // Left midpoint diamond
  doc.save();
  doc.translate(margin + 2, midY);
  doc.path(`M 0 -${diamondSize} L ${diamondSize} 0 L 0 ${diamondSize} L -${diamondSize} 0 Z`).fill(c.outer);
  doc.restore();

  // Right midpoint diamond
  doc.save();
  doc.translate(w - margin - 2, midY);
  doc.path(`M 0 -${diamondSize} L ${diamondSize} 0 L 0 ${diamondSize} L -${diamondSize} 0 Z`).fill(c.outer);
  doc.restore();

  doc.restore();
}

export function registerPdfExportRoute(app: Express) {
  app.get("/api/magazines/:id/pdf", async (req: Request, res: Response) => {
    try {
      // Authenticate user
      const user = await sdk.authenticateRequest(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const magazineId = parseInt(req.params.id);
      if (isNaN(magazineId)) {
        res.status(400).json({ error: "Invalid magazine ID" });
        return;
      }

      // Fetch magazine
      const magazine = await db.getMagazineById(magazineId);
      if (!magazine) {
        res.status(404).json({ error: "Magazine not found" });
        return;
      }

      // Verify ownership
      if (magazine.userId !== user.id) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }

      // Fetch articles and images
      const articlesList = await db.getArticlesByMagazine(magazineId);
      const articlesWithImages = await Promise.all(
        articlesList.map(async (art) => {
          const images = await db.getImagesByArticle(art.id);
          return { ...art, images };
        })
      );

      // Load custom fonts
      const fonts = getFonts();

      // Create PDF
      const doc = new PDFDocument({
        size: "A4",
        bufferPages: true,
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: magazine.title,
          Author: "Revista Retrô AI",
          Subject: "Revista gerada por IA",
        },
      });

      // Register custom fonts
      if (fonts.hasPixel) {
        doc.registerFont("PixelFont", fonts.pixelPath);
      }
      if (fonts.hasRetro) {
        doc.registerFont("RetroFont", fonts.retroPath);
      }

      // Font helpers
      const titleFont = fonts.hasPixel ? "PixelFont" : "Helvetica-Bold";
      const headingFont = fonts.hasPixel ? "PixelFont" : "Helvetica-Bold";
      const bodyFont = fonts.hasRetro ? "RetroFont" : "Helvetica";
      const labelFont = fonts.hasPixel ? "PixelFont" : "Helvetica";

      // Set response headers
      const safeTitle = magazine.title.replace(/[^a-zA-Z0-9\-_ ]/g, "").trim() || "revista";
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.pdf"`);

      // Pipe PDF to response
      doc.pipe(res);

      // ===== Build TOC entries =====
      // We'll track page numbers as we go, then use PDFKit's outline/goTo for internal links
      // Strategy: Cover (page 1), TOC (page 2), then content pages
      // PDFKit doesn't support post-hoc page references easily, so we pre-calculate page layout

      // Build section list for TOC
      interface TocEntry {
        title: string;
        pageLabel: string;
        anchor: string;
      }

      const tocEntries: TocEntry[] = [];
      let pageCounter = 3; // Cover=1, TOC=2, content starts at 3

      // Jogo da Semana
      if (magazine.gameOfTheWeekTitle) {
        tocEntries.push({
          title: `Jogo da Semana: ${magazine.gameOfTheWeekTitle}`,
          pageLabel: String(pageCounter),
          anchor: "gameoftheweek",
        });
        pageCounter++;
      }

      // Articles
      for (const article of articlesWithImages) {
        tocEntries.push({
          title: article.title,
          pageLabel: String(pageCounter),
          anchor: `article_${article.id}`,
        });
        pageCounter++;
      }

      // Back cover
      const backCoverPage = pageCounter;

      // ===== PAGE 1: COVER =====
      doc.rect(0, 0, doc.page.width, doc.page.height).fill("#1a0533");
      drawPixelBorder(doc, "cover");

      if (magazine.coverImageUrl) {
        const coverBuf = await fetchImageBuffer(magazine.coverImageUrl);
        if (coverBuf) {
          try {
            doc.image(coverBuf, 50, 50, {
              fit: [doc.page.width - 100, doc.page.height - 250],
              align: "center",
              valign: "center",
            });
          } catch (e) { /* skip */ }
        }
      }

      doc.fontSize(fonts.hasPixel ? 14 : 28)
        .font(titleFont)
        .fillColor("#FFD700")
        .text(magazine.title, 50, doc.page.height - 140, {
          width: doc.page.width - 100,
          align: "center",
        });

      doc.fontSize(fonts.hasPixel ? 7 : 10)
        .font(labelFont)
        .fillColor("#00CED1")
        .text("GERADO POR REVISTA RETRO AI", 50, doc.page.height - 80, {
          width: doc.page.width - 100,
          align: "center",
        });

      // ===== PAGE 2: TABLE OF CONTENTS =====
      doc.addPage();
      doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0d1117");
      drawPixelBorder(doc, "toc");

      // TOC Title
      doc.fontSize(fonts.hasPixel ? 12 : 24)
        .font(titleFont)
        .fillColor("#FFD700")
        .text("SUMARIO", 50, 40, {
          width: doc.page.width - 100,
          align: "center",
        });

      // Subtitle
      doc.fontSize(fonts.hasRetro ? 14 : 10)
        .font(bodyFont)
        .fillColor("#00CED1")
        .text("Navegue pelas secoes da revista", 50, doc.y + 8, {
          width: doc.page.width - 100,
          align: "center",
        });

      // Separator
      const sepY = doc.y + 15;
      doc.moveTo(80, sepY).lineTo(doc.page.width - 80, sepY).lineWidth(1).stroke("#8B5CF6");

      let tocY = sepY + 25;
      const tocLeftMargin = 70;
      const tocRightMargin = 70;
      const tocWidth = doc.page.width - tocLeftMargin - tocRightMargin;
      const entryHeight = fonts.hasPixel ? 32 : 28;

      // Draw TOC entries with dotted leaders and page numbers
      for (let i = 0; i < tocEntries.length; i++) {
        const entry = tocEntries[i];

        // Section number
        const sectionNum = String(i + 1).padStart(2, "0");

        // Title (left-aligned)
        doc.fontSize(fonts.hasPixel ? 7 : 12)
          .font(headingFont)
          .fillColor("#FAEBD7");

        // Truncate title if too long
        const maxTitleWidth = tocWidth - 60;
        let displayTitle = `${sectionNum}. ${entry.title}`;
        // Measure and truncate
        while (doc.widthOfString(displayTitle) > maxTitleWidth && displayTitle.length > 20) {
          displayTitle = displayTitle.slice(0, -4) + "...";
        }

        // Draw the entry as a clickable link (goTo destination)
        doc.text(displayTitle, tocLeftMargin, tocY, {
          width: maxTitleWidth,
          lineBreak: false,
          goTo: entry.anchor,
          underline: false,
        });

        // Page number (right-aligned)
        doc.fontSize(fonts.hasPixel ? 7 : 12)
          .font(labelFont)
          .fillColor("#00CED1")
          .text(entry.pageLabel, doc.page.width - tocRightMargin - 30, tocY, {
            width: 30,
            align: "right",
          });

        // Dotted leader line between title and page number
        const titleEndX = tocLeftMargin + Math.min(doc.widthOfString(displayTitle), maxTitleWidth) + 5;
        const pageStartX = doc.page.width - tocRightMargin - 35;
        if (pageStartX > titleEndX + 10) {
          doc.save();
          doc.lineWidth(0.5).dash(2, { space: 3 });
          doc.moveTo(titleEndX, tocY + (entryHeight / 2) - 4)
            .lineTo(pageStartX, tocY + (entryHeight / 2) - 4)
            .stroke("#555555");
          doc.restore();
        }

        tocY += entryHeight;

        // Check if we need a new page for TOC (unlikely but safe)
        if (tocY > doc.page.height - 80 && i < tocEntries.length - 1) {
          doc.addPage();
          doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0d1117");
          drawPixelBorder(doc, "toc");
          tocY = 50;
          pageCounter++; // Adjust page counter if TOC overflows
        }
      }

      // TOC footer - pixel border already handles decoration

      // ===== GAME OF THE WEEK PAGE =====
      if (magazine.gameOfTheWeekTitle) {
        doc.addPage();
        doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0d1117");
        drawPixelBorder(doc, "content");

        // Add named destination for TOC link
        doc.addNamedDestination("gameoftheweek");

        doc.fontSize(fonts.hasPixel ? 8 : 10)
          .font(labelFont)
          .fillColor("#00CED1")
          .text("★ JOGO DA SEMANA ★", 50, 30, {
            width: doc.page.width - 100,
            align: "center",
          });

        doc.fontSize(fonts.hasPixel ? 12 : 22)
          .font(headingFont)
          .fillColor("#FFD700")
          .text(magazine.gameOfTheWeekTitle, 50, 55, {
            width: doc.page.width - 100,
            align: "center",
          });

        let yPos = 100;

        if (magazine.gameOfTheWeekImageUrl) {
          const gameBuf = await fetchImageBuffer(magazine.gameOfTheWeekImageUrl);
          if (gameBuf) {
            try {
              doc.image(gameBuf, 80, yPos, {
                fit: [doc.page.width - 160, 280],
                align: "center",
              });
              yPos += 300;
            } catch (e) { /* skip */ }
          }
        }

        if (magazine.gameOfTheWeekDescription) {
          doc.fontSize(fonts.hasRetro ? 16 : 12)
            .font(bodyFont)
            .fillColor("#FAEBD7")
            .text(magazine.gameOfTheWeekDescription, 60, yPos, {
              width: doc.page.width - 120,
              align: "center",
              lineGap: fonts.hasRetro ? 2 : 4,
            });
        }

      }

      // ===== ARTICLE PAGES =====
      // Listen for auto-created pages (when text overflows) to draw borders on them too
      const onPageAdded = () => {
        // PDFKit fires 'pageAdded' after creating the new page, so we can draw on it
        doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0d1117");
        drawPixelBorder(doc, "content");
      };

      for (const article of articlesWithImages) {
        doc.addPage();
        doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0d1117");
        drawPixelBorder(doc, "content");

        // Add named destination for TOC link
        doc.addNamedDestination(`article_${article.id}`);

        // Enable auto-page border for text overflow within this article
        doc.on("pageAdded", onPageAdded);

        // Article title
        doc.fontSize(fonts.hasPixel ? 10 : 18)
          .font(headingFont)
          .fillColor("#00CED1")
          .text(article.title, 50, 30, {
            width: doc.page.width - 100,
          });

        // Separator line
        const titleBottom = doc.y + 8;
        doc.moveTo(50, titleBottom).lineTo(doc.page.width - 50, titleBottom).lineWidth(1).stroke("#8B5CF6");

        let yPos = titleBottom + 15;

        // Article images
        const articleImagesWithUrl = article.images.filter((img) => img.imageUrl);
        if (articleImagesWithUrl.length > 0) {
          const imgWidth = Math.min(150, (doc.page.width - 120) / articleImagesWithUrl.length);
          let xPos = 50;
          for (const img of articleImagesWithUrl) {
            const imgBuf = await fetchImageBuffer(img.imageUrl!);
            if (imgBuf) {
              try {
                doc.rect(xPos - 2, yPos - 2, imgWidth - 6, 104).lineWidth(1).stroke("#FFD700");
                doc.image(imgBuf, xPos, yPos, {
                  fit: [imgWidth - 10, 100],
                });
              } catch (e) { /* skip */ }
            }
            xPos += imgWidth;
          }
          yPos += 120;
        }

        // Article content
        if (article.content) {
          const plainContent = stripMarkdown(article.content);
          doc.fontSize(fonts.hasRetro ? 14 : 11)
            .font(bodyFont)
            .fillColor("#FAEBD7")
            .text(plainContent, 50, yPos, {
              width: doc.page.width - 100,
              lineGap: fonts.hasRetro ? 1 : 3,
            });
        }

        // Tips section
        if (article.tips) {
          const currentY = doc.y + 20;
          if (currentY < doc.page.height - 150) {
            doc.rect(40, currentY - 5, doc.page.width - 80, 2).fill("#FFD700");

            doc.fontSize(fonts.hasPixel ? 7 : 10)
              .font(labelFont)
              .fillColor("#FFD700")
              .text("★ DICAS & MACETES ★", 50, currentY + 5, {
                width: doc.page.width - 100,
              });

            const plainTips = stripMarkdown(article.tips);
            doc.fontSize(fonts.hasRetro ? 13 : 10)
              .font(bodyFont)
              .fillColor("#FAEBD7")
              .text(plainTips, 50, doc.y + 5, {
                width: doc.page.width - 100,
                lineGap: fonts.hasRetro ? 1 : 2,
              });
          }
        }

        // Remove listener before next article to avoid double-firing
        doc.removeListener("pageAdded", onPageAdded);
      }

      // ===== BACK COVER =====
      doc.addPage();
      doc.rect(0, 0, doc.page.width, doc.page.height).fill("#1a0533");
      drawPixelBorder(doc, "back");

      doc.fontSize(fonts.hasPixel ? 10 : 14)
        .font(titleFont)
        .fillColor("#00CED1")
        .text("REVISTA RETRO AI", 50, doc.page.height / 2 - 50, {
          width: doc.page.width - 100,
          align: "center",
        });

      doc.fontSize(fonts.hasRetro ? 16 : 10)
        .font(bodyFont)
        .fillColor("#FAEBD7")
        .text("Gerado com inteligencia artificial", 50, doc.page.height / 2, {
          width: doc.page.width - 100,
          align: "center",
        });

      doc.fontSize(fonts.hasRetro ? 14 : 8)
        .font(bodyFont)
        .fillColor("#888888")
        .text(new Date().toLocaleDateString("pt-BR"), 50, doc.page.height / 2 + 30, {
          width: doc.page.width - 100,
          align: "center",
        });

      doc.fontSize(fonts.hasPixel ? 6 : 8)
        .font(labelFont)
        .fillColor("#FFD700")
        .text("PRESS START TO CONTINUE...", 50, doc.page.height / 2 + 70, {
          width: doc.page.width - 100,
          align: "center",
        });

      // ===== ADD WATERMARK + PAGE NUMBERS TO ALL PAGES =====
      // Fetch logo image for watermark (if available)
      let logoBuf: Buffer | null = null;
      if (magazine.logoUrl) {
        logoBuf = await fetchImageBuffer(magazine.logoUrl);
      }

      const pageRange = doc.bufferedPageRange();
      const totalPages = pageRange.count;

      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);

        const w = doc.page.width;
        const h = doc.page.height;

        // --- Watermark (all pages except cover and back cover) ---
        if (i > 0 && i < totalPages - 1) {
          doc.save();
          doc.opacity(0.06);

          if (logoBuf) {
            // Use the magazine logo as watermark
            try {
              const wmSize = 180;
              const wmX = (w - wmSize) / 2;
              const wmY = (h - wmSize) / 2;
              doc.image(logoBuf, wmX, wmY, {
                fit: [wmSize, wmSize],
                align: "center",
                valign: "center",
              });
            } catch (e) {
              // Fallback to text watermark
              doc.fontSize(48)
                .font(titleFont)
                .fillColor("#FFFFFF")
                .text("RETRO", 0, h / 2 - 30, {
                  width: w,
                  align: "center",
                });
            }
          } else {
            // Text watermark fallback when no logo is available
            doc.fontSize(fonts.hasPixel ? 18 : 48)
              .font(titleFont)
              .fillColor("#FFFFFF")
              .text("RETRO AI", 0, h / 2 - 30, {
                width: w,
                align: "center",
              });
          }

          doc.restore();
        }

        // --- Page number (skip cover page) ---
        if (i === 0) continue;

        const pageNum = i + 1;

        doc.save();

        // Small background pill behind the number
        const numText = `- ${pageNum} -`;
        doc.fontSize(fonts.hasPixel ? 6 : 9).font(labelFont);
        const numWidth = doc.widthOfString(numText);
        const pillX = (w - numWidth) / 2 - 8;
        const pillY = h - 32;
        const pillW = numWidth + 16;
        const pillH = fonts.hasPixel ? 14 : 16;

        doc.roundedRect(pillX, pillY, pillW, pillH, 3).fill("#1a0533");
        doc.roundedRect(pillX, pillY, pillW, pillH, 3).lineWidth(0.5).stroke("#FFD700");

        // Page number text
        doc.fontSize(fonts.hasPixel ? 6 : 9)
          .font(labelFont)
          .fillColor("#FFD700")
          .text(numText, 0, pillY + (fonts.hasPixel ? 3 : 2), {
            width: w,
            align: "center",
          });

        doc.restore();
      }

      // Finalize
      doc.end();
    } catch (err: any) {
      console.error("[PDF] Export error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate PDF" });
      }
    }
  });
}
