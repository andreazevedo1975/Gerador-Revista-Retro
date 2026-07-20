import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ===== Magazine Routes =====
  magazine: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getMagazinesByUser(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const mag = await db.getMagazineById(input.id);
        if (!mag || mag.userId !== ctx.user.id) return null;
        const arts = await db.getArticlesByMagazine(input.id);
        const articlesWithImages = await Promise.all(
          arts.map(async (art) => {
            const images = await db.getImagesByArticle(art.id);
            return { ...art, images };
          })
        );
        return { ...mag, articles: articlesWithImages };
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        coverImagePrompt: z.string().optional(),
        coverTemplate: z.string().optional(),
        logoUrl: z.string().optional(),
        structureData: z.any().optional(),
        isDeepMode: z.boolean().optional(),
        gameOfTheWeekTitle: z.string().optional(),
        gameOfTheWeekDescription: z.string().optional(),
        gameOfTheWeekImagePrompt: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const magId = await db.createMagazine({
          userId: ctx.user.id,
          ...input,
        });
        return { id: magId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        coverImageUrl: z.string().nullable().optional(),
        coverImagePrompt: z.string().nullable().optional(),
        logoUrl: z.string().nullable().optional(),
        gameOfTheWeekTitle: z.string().nullable().optional(),
        gameOfTheWeekDescription: z.string().nullable().optional(),
        gameOfTheWeekImagePrompt: z.string().nullable().optional(),
        gameOfTheWeekImageUrl: z.string().nullable().optional(),
        structureData: z.any().optional(),
        status: z.enum(["draft", "generating", "complete"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const mag = await db.getMagazineById(input.id);
        if (!mag || mag.userId !== ctx.user.id) throw new Error("Not found");
        const { id, ...data } = input;
        await db.updateMagazine(id, data as any);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const mag = await db.getMagazineById(input.id);
        if (!mag || mag.userId !== ctx.user.id) throw new Error("Not found");
        await db.deleteMagazine(input.id);
        return { success: true };
      }),

    togglePublic: protectedProcedure
      .input(z.object({ id: z.number(), isPublic: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const mag = await db.getMagazineById(input.id);
        if (!mag || mag.userId !== ctx.user.id) throw new Error("Not found");
        await db.toggleMagazinePublic(input.id, input.isPublic);
        return { success: true };
      }),
  }),

  // ===== Public Gallery (no auth required) =====
  gallery: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }).optional())
      .query(async ({ input }) => {
        const { limit, offset } = input || { limit: 20, offset: 0 };
        const mags = await db.getPublicMagazines(limit, offset);
        const ids = mags.map(m => m.id);
        const likeCounts = await db.getLikeCounts(ids);
        return mags.map(m => ({ ...m, likeCount: likeCounts[m.id] || 0 }));
      }),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const mag = await db.getPublicMagazineWithDetails(input.id);
        if (!mag) return null;
        const arts = await db.getArticlesByMagazine(input.id);
        const articlesWithImages = await Promise.all(
          arts.map(async (art) => {
            const images = await db.getImagesByArticle(art.id);
            return { ...art, images };
          })
        );
        const likeCount = await db.getLikeCount(mag.id);
        return { ...mag, articles: articlesWithImages, likeCount };
      }),

    byShareCode: publicProcedure
      .input(z.object({ shortCode: z.string() }))
      .query(async ({ input }) => {
        const mag = await db.getMagazineByShareCode(input.shortCode);
        if (!mag) return null;
        const arts = await db.getArticlesByMagazine(mag.id);
        const articlesWithImages = await Promise.all(
          arts.map(async (art) => {
            const images = await db.getImagesByArticle(art.id);
            return { ...art, images };
          })
        );
        const likeCount = await db.getLikeCount(mag.id);
        return { ...mag, articles: articlesWithImages, likeCount };
      }),
  }),

  // ===== Article Routes =====
  article: router({
    create: protectedProcedure
      .input(z.object({
        magazineId: z.number(),
        articleIndex: z.number(),
        title: z.string(),
        contentPrompt: z.string().optional(),
        tipsPrompt: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const mag = await db.getMagazineById(input.magazineId);
        if (!mag || mag.userId !== ctx.user.id) throw new Error("Not found");
        const artId = await db.createArticle(input);
        return { id: artId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().nullable().optional(),
        tips: z.string().nullable().optional(),
        contentPrompt: z.string().nullable().optional(),
        tipsPrompt: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const owns = await db.verifyArticleOwnership(input.id, ctx.user.id);
        if (!owns) throw new Error("Not found");
        const { id, ...data } = input;
        await db.updateArticle(id, data as any);
        return { success: true };
      }),

    createImage: protectedProcedure
      .input(z.object({
        articleId: z.number(),
        imageIndex: z.number(),
        imageType: z.enum(["logo", "gameplay", "artwork"]),
        prompt: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const owns = await db.verifyArticleOwnership(input.articleId, ctx.user.id);
        if (!owns) throw new Error("Not found");
        const imgId = await db.createArticleImage(input);
        return { id: imgId };
      }),

    updateImage: protectedProcedure
      .input(z.object({
        id: z.number(),
        prompt: z.string().nullable().optional(),
        imageUrl: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const owns = await db.verifyImageOwnership(input.id, ctx.user.id);
        if (!owns) throw new Error("Not found");
        const { id, ...data } = input;
        await db.updateArticleImage(id, data as any);
        return { success: true };
      }),
  }),

  // ===== AI Generation Routes (Backend Only) =====
  ai: router({
    generateStructure: protectedProcedure
      .input(z.object({
        topic: z.string(),
        isDeepMode: z.boolean().default(false),
        magazineName: z.string().optional(),
        editorialConcept: z.any().optional(),
        coverStyleHint: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { topic, isDeepMode, magazineName, editorialConcept, coverStyleHint } = input;
        const nameToUse = magazineName || "Retrô Gamer AI";

        let prompt = `Você é um editor de uma revista de videogames retrô dos anos 90 chamada "${nameToUse}".
Crie a estrutura para uma nova edição da revista com base na seguinte pauta: "${topic}".
A revista deve ter um tom divertido, informativo e nostálgico.`;

        if (editorialConcept) {
          prompt += `\n\nIMPORTANTE: Adira estritamente ao seguinte Conceito Editorial pré-definido:
- Foco Editorial: ${editorialConcept.technicalSheet?.editorialFocus || ''}
- Público-Alvo: ${editorialConcept.technicalSheet?.keyAudience || ''}
- Estilo/Formato: ${editorialConcept.technicalSheet?.referenceFormat || ''}
- Conceito da Capa: '${editorialConcept.coverConcept?.description || ''}'
- Manchete: '${editorialConcept.coverConcept?.headline || ''}'
- Layout Interno: '${editorialConcept.internalLayout?.description || ''}'`;
        }

        if (coverStyleHint) {
          prompt += `\n\nESTILO DE CAPA: O prompt de imagem da capa DEVE seguir este estilo visual: "${coverStyleHint}". Incorpore esses elementos no prompt de imagem da capa.`;
        }

        prompt += `\n\nA estrutura deve conter:
1. Um título de capa criativo e chamativo.
2. Um prompt de imagem de capa em inglês, extremamente detalhado no estilo 'vibrant 16-bit pixel art' ou '90s Japanese box art'.
3. Uma seção "Jogo da Semana" com título, descrição curta e prompt de imagem em inglês.
4. Exatamente 5 artigos, cada um com: título, prompt de conteúdo, prompt de dicas, e 3 prompts de imagem (tipos: 'logo', 'gameplay', 'artwork').

Retorne um JSON válido com esta estrutura:
{
  "title": "string",
  "coverImagePrompt": "string em inglês",
  "gameOfTheWeek": { "title": "string", "description": "string", "imagePrompt": "string em inglês" },
  "articles": [{ "title": "string", "contentPrompt": "string", "tipsPrompt": "string", "imagePrompts": [{ "type": "logo|gameplay|artwork", "prompt": "string em inglês" }] }]
}`;

        if (isDeepMode) {
          prompt += `\n\nMODO PROFUNDO ATIVADO: Aborde com profundidade máxima, insights únicos e análise crítica detalhada.`;
        }

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Você é um editor especialista em revistas de games retrô. Sempre responda com JSON válido." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        });

        const content = response.choices[0]?.message?.content;
        const text = typeof content === "string" ? content : "";
        const parsed = JSON.parse(text);
        return parsed;
      }),

    generateText: protectedProcedure
      .input(z.object({ prompt: z.string() }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Você é um jornalista de uma revista de games dos anos 90. Sua escrita é empolgante, cheia de gírias da época e muito informativa. Formate o texto usando Markdown simples: ### para subtítulos, *palavra* para itálico, - para listas." },
            { role: "user", content: input.prompt },
          ],
        });
        const content = response.choices[0]?.message?.content;
        return { text: typeof content === "string" ? content : "" };
      }),

    generateImage: protectedProcedure
      .input(z.object({
        prompt: z.string(),
        quality: z.enum(["medium", "high"]).default("medium"),
      }))
      .mutation(async ({ input }) => {
        const result = await generateImage({
          prompt: input.prompt,
          quality: input.quality,
        });
        return { url: result.url || "" };
      }),

    generateLogo: protectedProcedure
      .input(z.object({ prompt: z.string() }))
      .mutation(async ({ input }) => {
        const finalPrompt = `A stylized 16-bit pixel art logo, clean background, vector style, vibrant colors. Concept: "${input.prompt}"`;
        const result = await generateImage({ prompt: finalPrompt });
        return { url: result.url || "" };
      }),

    generateEditorialConcept: protectedProcedure
      .input(z.object({
        publicationTitle: z.string(),
        mainTheme: z.string(),
        targetAudience: z.string(),
        editorialStyles: z.array(z.string()),
        visualHighlight: z.string(),
        dominantColor: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const prompt = `Você é um diretor de arte e editor-chefe de publicações de games retrô.
Com base nas seguintes informações, crie um Conceito Editorial completo:
- Título da Publicação: "${input.publicationTitle}"
- Tema Principal: "${input.mainTheme}"
- Público-Alvo: "${input.targetAudience}"
- Estilos Editoriais: ${input.editorialStyles.join(', ')}
- Destaque Visual: "${input.visualHighlight}"
- Cor Dominante: "${input.dominantColor}"

Retorne um JSON com:
{
  "technicalSheet": { "proposedName": "string", "editorialFocus": "string", "referenceFormat": "string", "keyAudience": "string" },
  "coverConcept": { "description": "string", "headline": "string", "supportingText": "string" },
  "internalLayout": { "description": "string" },
  "imageGenerationPrompt": "string em inglês para gerar uma imagem conceitual"
}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Você é um diretor de arte especialista em publicações de games. Responda sempre com JSON válido." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        });

        const content = response.choices[0]?.message?.content;
        const text = typeof content === "string" ? content : "";
        const conceptData = JSON.parse(text);

        // Save to database
        await db.upsertEditorialConcept(ctx.user.id, conceptData);

        return conceptData;
      }),
  }),

  // ===== Editorial Concept & Visual Identity =====
  profile: router({
    getEditorialConcept: protectedProcedure.query(async ({ ctx }) => {
      const concept = await db.getEditorialConceptByUser(ctx.user.id);
      return concept ? concept.conceptData : null;
    }),

    getVisualIdentity: protectedProcedure.query(async ({ ctx }) => {
      return db.getVisualIdentityByUser(ctx.user.id);
    }),

    saveVisualIdentity: protectedProcedure
      .input(z.object({
        magazineName: z.string(),
        logoUrl: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertVisualIdentity(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // ===== Version History =====
  version: router({
    save: protectedProcedure
      .input(z.object({
        magazineId: z.number(),
        versionData: z.any(),
        versionLabel: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const mag = await db.getMagazineById(input.magazineId);
        if (!mag || mag.userId !== ctx.user.id) throw new Error("Not found");
        const id = await db.createMagazineVersion(input.magazineId, input.versionData, input.versionLabel);
        return { id };
      }),

    list: protectedProcedure
      .input(z.object({ magazineId: z.number() }))
      .query(async ({ ctx, input }) => {
        const mag = await db.getMagazineById(input.magazineId);
        if (!mag || mag.userId !== ctx.user.id) return [];
        return db.getMagazineVersions(input.magazineId);
      }),

    get: protectedProcedure
      .input(z.object({ versionId: z.number() }))
      .query(async ({ input }) => {
        return db.getMagazineVersionById(input.versionId);
      }),

    revert: protectedProcedure
      .input(z.object({ versionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const version = await db.getMagazineVersionById(input.versionId);
        if (!version) throw new Error("Version not found");
        const mag = await db.getMagazineById(version.magazineId);
        if (!mag || mag.userId !== ctx.user.id) throw new Error("Not found");
        const vData = version.versionData as any;
        // Restore magazine fields
        await db.updateMagazine(version.magazineId, {
          title: vData.title,
          coverImageUrl: vData.coverImageUrl || null,
          coverImagePrompt: vData.coverImagePrompt || null,
          gameOfTheWeekTitle: vData.gameOfTheWeekTitle || null,
          gameOfTheWeekDescription: vData.gameOfTheWeekDescription || null,
          gameOfTheWeekImagePrompt: vData.gameOfTheWeekImagePrompt || null,
          gameOfTheWeekImageUrl: vData.gameOfTheWeekImageUrl || null,
        });
        // Restore articles
        if (vData.articles) {
          for (const art of vData.articles) {
            await db.updateArticle(art.id, {
              title: art.title,
              content: art.content || null,
              tips: art.tips || null,
              contentPrompt: art.contentPrompt || null,
              tipsPrompt: art.tipsPrompt || null,
            });
            // Restore article images
            if (art.images) {
              for (const img of art.images) {
                await db.updateArticleImage(img.id, {
                  prompt: img.prompt || null,
                  imageUrl: img.imageUrl || null,
                });
              }
            }
          }
        }
        return { success: true };
      }),
    }),


  // ===== Likes Routes =====
  likes: router({
    toggle: protectedProcedure
      .input(z.object({ magazineId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.toggleLike(input.magazineId, ctx.user.id);
      }),
    
    getUserLikes: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getUserLikes(ctx.user.id);
      }),
  }),

  // ===== Share Links Routes =====
  share: router({
    create: protectedProcedure
      .input(z.object({ magazineId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const mag = await db.getMagazineById(input.magazineId);
        if (!mag || mag.userId !== ctx.user.id) throw new Error("Not found");
        const shortCode = await db.createShareLink(input.magazineId, ctx.user.id);
        return { shortCode };
      }),
    
    get: protectedProcedure
      .input(z.object({ magazineId: z.number() }))
      .query(async ({ ctx, input }) => {
        const mag = await db.getMagazineById(input.magazineId);
        if (!mag || mag.userId !== ctx.user.id) return null;
        const shortCode = await db.getShareLinkByMagazine(input.magazineId, ctx.user.id);
        return { shortCode };
      }),
  }),
});
export type AppRouter = typeof appRouter;
