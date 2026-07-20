import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { useState, useCallback } from "react";
import { Loader2, ArrowLeft, Image, FileText, Sparkles, CheckCircle, AlertCircle, Clock, BookOpen, Save, RotateCcw, Undo2, Redo2, Gamepad2 } from "lucide-react";
import { toast } from "sonner";

type GenerationStatus = "pending" | "generating" | "done" | "error";

interface TextHistory {
  past: string[];
  present: string;
  future: string[];
}

export default function Composer() {
  useAuth({ redirectOnUnauthenticated: true });
  const params = useParams<{ id: string }>();
  const magazineId = parseInt(params.id || "0");
  const [, navigate] = useLocation();

  const { data: magazine, isLoading, refetch } = trpc.magazine.get.useQuery(
    { id: magazineId },
    { enabled: magazineId > 0 }
  );

  const updateMagazine = trpc.magazine.update.useMutation();
  const updateArticle = trpc.article.update.useMutation();
  const updateImage = trpc.article.updateImage.useMutation();
  const generateText = trpc.ai.generateText.useMutation();
  const generateImageMut = trpc.ai.generateImage.useMutation();
  const saveVersion = trpc.version.save.useMutation();

  // Generation status tracking
  const [genStatus, setGenStatus] = useState<Record<string, GenerationStatus>>({});
  const [textHistories, setTextHistories] = useState<Record<string, TextHistory>>({});

  // Helper to track text changes with undo/redo
  const initHistory = useCallback((key: string, value: string) => {
    setTextHistories(prev => {
      if (prev[key]) return prev;
      return { ...prev, [key]: { past: [], present: value, future: [] } };
    });
  }, []);

  const updateText = useCallback((key: string, newValue: string) => {
    setTextHistories(prev => {
      const current = prev[key];
      if (!current) return { ...prev, [key]: { past: [], present: newValue, future: [] } };
      return {
        ...prev,
        [key]: {
          past: [...current.past, current.present],
          present: newValue,
          future: [],
        },
      };
    });
  }, []);

  const undo = useCallback((key: string) => {
    setTextHistories(prev => {
      const current = prev[key];
      if (!current || current.past.length === 0) return prev;
      const newPast = [...current.past];
      const previous = newPast.pop()!;
      return {
        ...prev,
        [key]: {
          past: newPast,
          present: previous,
          future: [current.present, ...current.future],
        },
      };
    });
  }, []);

  const redo = useCallback((key: string) => {
    setTextHistories(prev => {
      const current = prev[key];
      if (!current || current.future.length === 0) return prev;
      const newFuture = [...current.future];
      const next = newFuture.shift()!;
      return {
        ...prev,
        [key]: {
          past: [...current.past, current.present],
          present: next,
          future: newFuture,
        },
      };
    });
  }, []);

  const resetToOriginal = useCallback((key: string, originalValue: string) => {
    setTextHistories(prev => {
      const current = prev[key];
      if (!current) return prev;
      return {
        ...prev,
        [key]: {
          past: [...current.past, current.present],
          present: originalValue,
          future: [],
        },
      };
    });
  }, []);

  const getTextValue = (key: string, fallback: string) => {
    return textHistories[key]?.present ?? fallback;
  };

  // Generate cover image
  const handleGenerateCover = async () => {
    if (!magazine) return;
    const prompt = magazine.coverImagePrompt || "";
    setGenStatus(prev => ({ ...prev, cover: "generating" }));
    try {
      const { url } = await generateImageMut.mutateAsync({ prompt, quality: "high" });
      await updateMagazine.mutateAsync({ id: magazineId, coverImageUrl: url });
      setGenStatus(prev => ({ ...prev, cover: "done" }));
      refetch();
      toast.success("Capa gerada com sucesso!");
    } catch (err: any) {
      setGenStatus(prev => ({ ...prev, cover: "error" }));
      toast.error("Erro ao gerar capa: " + (err.message || ""));
    }
  };

  // Generate Game of the Week image
  const handleGenerateGameImage = async () => {
    if (!magazine) return;
    const prompt = magazine.gameOfTheWeekImagePrompt || "";
    setGenStatus(prev => ({ ...prev, gameOfTheWeek: "generating" }));
    try {
      const { url } = await generateImageMut.mutateAsync({ prompt });
      await updateMagazine.mutateAsync({ id: magazineId, gameOfTheWeekImageUrl: url });
      setGenStatus(prev => ({ ...prev, gameOfTheWeek: "done" }));
      refetch();
      toast.success("Imagem do Jogo da Semana gerada!");
    } catch (err: any) {
      setGenStatus(prev => ({ ...prev, gameOfTheWeek: "error" }));
      toast.error("Erro ao gerar imagem: " + (err.message || ""));
    }
  };

  // Generate article content
  const handleGenerateArticle = async (articleId: number, contentPrompt: string, tipsPrompt: string) => {
    const key = `article-${articleId}`;
    setGenStatus(prev => ({ ...prev, [key]: "generating" }));
    try {
      const { text: content } = await generateText.mutateAsync({ prompt: contentPrompt });
      const { text: tips } = await generateText.mutateAsync({ prompt: tipsPrompt });
      await updateArticle.mutateAsync({ id: articleId, content, tips });
      setGenStatus(prev => ({ ...prev, [key]: "done" }));
      refetch();
      toast.success("Artigo gerado com sucesso!");
    } catch (err: any) {
      setGenStatus(prev => ({ ...prev, [key]: "error" }));
      toast.error("Erro ao gerar artigo: " + (err.message || ""));
    }
  };

  // Generate article image
  const handleGenerateArticleImage = async (imageId: number, prompt: string) => {
    const key = `image-${imageId}`;
    setGenStatus(prev => ({ ...prev, [key]: "generating" }));
    try {
      const { url } = await generateImageMut.mutateAsync({ prompt });
      await updateImage.mutateAsync({ id: imageId, imageUrl: url });
      setGenStatus(prev => ({ ...prev, [key]: "done" }));
      refetch();
    } catch (err: any) {
      setGenStatus(prev => ({ ...prev, [key]: "error" }));
      toast.error("Erro ao gerar imagem");
    }
  };

  // Generate all content
  const handleGenerateAll = async () => {
    if (!magazine) return;
    toast.info("Gerando toda a revista... Isso pode levar alguns minutos.");

    // Cover
    await handleGenerateCover();

    // Game of the Week
    await handleGenerateGameImage();

    // Articles
    if (magazine.articles) {
      for (const art of magazine.articles) {
        if (art.contentPrompt) {
          await handleGenerateArticle(art.id, art.contentPrompt, art.tipsPrompt || "");
        }
        if (art.images) {
          for (const img of art.images) {
            if (img.prompt) {
              await handleGenerateArticleImage(img.id, img.prompt);
            }
          }
        }
      }
    }

    // Mark as complete
    await updateMagazine.mutateAsync({ id: magazineId, status: "complete" });
    refetch();
    toast.success("Revista completa!");
  };

  // Save version
  const handleSaveVersion = async () => {
    if (!magazine) return;
    try {
      await saveVersion.mutateAsync({
        magazineId,
        versionData: magazine,
        versionLabel: `Versão ${new Date().toLocaleString('pt-BR')}`,
      });
      toast.success("Versão salva no histórico!");
    } catch {
      toast.error("Erro ao salvar versão");
    }
  };

  // Save prompt edits
  const handleSavePrompt = async (field: string, value: string) => {
    try {
      if (field === "coverImagePrompt") {
        await updateMagazine.mutateAsync({ id: magazineId, coverImagePrompt: value });
      } else if (field === "gameOfTheWeekImagePrompt") {
        await updateMagazine.mutateAsync({ id: magazineId, gameOfTheWeekImagePrompt: value });
      }
      refetch();
      toast.success("Prompt salvo!");
    } catch {
      toast.error("Erro ao salvar");
    }
  };

  const StatusBadge = ({ status }: { status: GenerationStatus }) => {
    switch (status) {
      case "generating": return <span className="flex items-center gap-1 text-xs text-yellow-400"><Loader2 className="w-3 h-3 animate-spin" /> Gerando</span>;
      case "done": return <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle className="w-3 h-3" /> Pronto</span>;
      case "error": return <span className="flex items-center gap-1 text-xs text-red-400"><AlertCircle className="w-3 h-3" /> Erro</span>;
      default: return <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" /> Pendente</span>;
    }
  };

  // Editable prompt component
  const EditablePrompt = ({ label, fieldKey, value, originalValue, onSave }: {
    label: string;
    fieldKey: string;
    value: string;
    originalValue: string;
    onSave: (value: string) => void;
  }) => {
    const histKey = `prompt-${fieldKey}`;
    const history = textHistories[histKey];
    const currentVal = history ? history.present : value;

    // Initialize history lazily on first interaction
    const ensureHistory = useCallback(() => {
      if (!textHistories[histKey]) initHistory(histKey, value);
    }, [histKey, value]);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" disabled={!history || history.past.length === 0} onClick={() => undo(histKey)}>
              <Undo2 className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" disabled={!history || history.future.length === 0} onClick={() => redo(histKey)}>
              <Redo2 className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => resetToOriginal(histKey, originalValue)} title="Reset para original">
              <RotateCcw className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <Textarea
          value={currentVal}
          onFocus={ensureHistory}
          onChange={(e) => { ensureHistory(); updateText(histKey, e.target.value); }}
          className="text-xs min-h-[60px] resize-y"
          rows={3}
        />
        {currentVal !== value && (
          <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => onSave(currentVal)}>
            Salvar Alteração
          </Button>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!magazine) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground">Revista não encontrada</p>
        <Button onClick={() => navigate("/")}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="font-display text-sm font-bold truncate max-w-[200px] sm:max-w-none">{magazine.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/versions/${magazineId}`)}>
              <Clock className="w-4 h-4 mr-1" /> Histórico
            </Button>
            <Button variant="outline" size="sm" onClick={handleSaveVersion}>
              <Save className="w-4 h-4 mr-1" /> Salvar Versão
            </Button>
            {magazine.status === 'complete' && (
              <Button size="sm" onClick={() => navigate(`/view/${magazineId}`)}>
                <BookOpen className="w-4 h-4 mr-1" /> Visualizar
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-6">
        {/* Action Bar */}
        <div className="flex flex-wrap gap-3 mb-8 p-4 rounded-xl bg-card border border-border/50">
          <Button onClick={handleGenerateAll} className="font-display" disabled={Object.values(genStatus).some(s => s === "generating")}>
            <Sparkles className="w-4 h-4 mr-2" /> Gerar Tudo
          </Button>
          <Button variant="outline" onClick={handleGenerateCover} disabled={genStatus.cover === "generating"}>
            <Image className="w-4 h-4 mr-2" /> Gerar Capa
          </Button>
          <Button variant="outline" onClick={handleGenerateGameImage} disabled={genStatus.gameOfTheWeek === "generating"}>
            <Gamepad2 className="w-4 h-4 mr-2" /> Jogo da Semana
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Cover & Game of the Week */}
          <div className="space-y-6">
            {/* Cover */}
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-display">Capa</CardTitle>
                  <StatusBadge status={genStatus.cover || (magazine.coverImageUrl ? "done" : "pending")} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {magazine.coverImageUrl ? (
                  <div className="aspect-[3/4] rounded-lg overflow-hidden border border-border/50">
                    <img src={magazine.coverImageUrl} alt="Capa" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-[3/4] rounded-lg bg-muted flex items-center justify-center border border-dashed border-border">
                    <Image className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
                <EditablePrompt
                  label="Prompt da Capa"
                  fieldKey="coverImagePrompt"
                  value={magazine.coverImagePrompt || ""}
                  originalValue={(magazine.structureData as any)?.coverImagePrompt || ""}
                  onSave={(v) => handleSavePrompt("coverImagePrompt", v)}
                />
              </CardContent>
            </Card>

            {/* Game of the Week */}
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-display">Jogo da Semana</CardTitle>
                  <StatusBadge status={genStatus.gameOfTheWeek || (magazine.gameOfTheWeekImageUrl ? "done" : "pending")} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <h4 className="font-display font-semibold text-sm">{magazine.gameOfTheWeekTitle}</h4>
                <p className="text-xs text-muted-foreground">{magazine.gameOfTheWeekDescription}</p>
                {magazine.gameOfTheWeekImageUrl ? (
                  <div className="aspect-video rounded-lg overflow-hidden border border-border/50">
                    <img src={magazine.gameOfTheWeekImageUrl} alt="Jogo da Semana" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-video rounded-lg bg-muted flex items-center justify-center border border-dashed border-border">
                    <Gamepad2 className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                )}
                <EditablePrompt
                  label="Prompt da Imagem"
                  fieldKey="gameOfTheWeekImagePrompt"
                  value={magazine.gameOfTheWeekImagePrompt || ""}
                  originalValue={(magazine.structureData as any)?.gameOfTheWeek?.imagePrompt || ""}
                  onSave={(v) => handleSavePrompt("gameOfTheWeekImagePrompt", v)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right: Articles */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-display font-bold text-lg mb-4">Artigos</h3>
            {magazine.articles?.map((article, idx) => {
              const artKey = `article-${article.id}`;
              const artStatus = genStatus[artKey] || (article.content ? "done" : "pending");
              return (
                <Card key={article.id} className="bg-card border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-display flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                        {article.title}
                      </CardTitle>
                      <StatusBadge status={artStatus} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Article content - editable inline */}
                    {article.content && (
                      <EditablePrompt
                        label="Texto do Artigo"
                        fieldKey={`article-body-${article.id}`}
                        value={article.content}
                        originalValue={article.content}
                        onSave={async (v) => {
                          await updateArticle.mutateAsync({ id: article.id, content: v });
                          refetch();
                          toast.success("Texto do artigo salvo!");
                        }}
                      />
                    )}
                    {article.tips && (
                      <EditablePrompt
                        label="Dicas / Tips"
                        fieldKey={`article-tips-body-${article.id}`}
                        value={article.tips}
                        originalValue={article.tips}
                        onSave={async (v) => {
                          await updateArticle.mutateAsync({ id: article.id, tips: v });
                          refetch();
                          toast.success("Dicas salvas!");
                        }}
                      />
                    )}

                    {/* Editable prompts for article */}
                    <EditablePrompt
                      label="Prompt do Conteúdo"
                      fieldKey={`article-content-${article.id}`}
                      value={article.contentPrompt || ""}
                      originalValue={(magazine.structureData as any)?.articles?.[idx]?.contentPrompt || ""}
                      onSave={async (v) => {
                        await updateArticle.mutateAsync({ id: article.id, contentPrompt: v });
                        refetch();
                        toast.success("Prompt salvo!");
                      }}
                    />
                    <EditablePrompt
                      label="Prompt das Dicas"
                      fieldKey={`article-tips-${article.id}`}
                      value={article.tipsPrompt || ""}
                      originalValue={(magazine.structureData as any)?.articles?.[idx]?.tipsPrompt || ""}
                      onSave={async (v) => {
                        await updateArticle.mutateAsync({ id: article.id, tipsPrompt: v });
                        refetch();
                        toast.success("Prompt salvo!");
                      }}
                    />

                    {/* Article images */}
                    {article.images && article.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {article.images.map((img) => (
                          <div key={img.id} className="space-y-1">
                            {img.imageUrl ? (
                              <div className="aspect-square rounded overflow-hidden border border-border/50">
                                <img src={img.imageUrl} alt={img.imageType} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="aspect-square rounded bg-muted flex items-center justify-center border border-dashed border-border">
                                <Image className="w-4 h-4 text-muted-foreground/30" />
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-muted-foreground uppercase">{img.imageType}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 px-1 text-[10px]"
                                disabled={genStatus[`image-${img.id}`] === "generating"}
                                onClick={() => handleGenerateArticleImage(img.id, img.prompt || "")}
                              >
                                {genStatus[`image-${img.id}`] === "generating" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Generate article button */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        disabled={artStatus === "generating"}
                        onClick={() => handleGenerateArticle(article.id, article.contentPrompt || "", article.tipsPrompt || "")}
                      >
                        {artStatus === "generating" ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <FileText className="w-3 h-3 mr-1" />}
                        Gerar Texto
                      </Button>
                      {article.images?.map((img) => (
                        <Button
                          key={img.id}
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          disabled={genStatus[`image-${img.id}`] === "generating"}
                          onClick={() => handleGenerateArticleImage(img.id, img.prompt || "")}
                        >
                          <Image className="w-3 h-3 mr-1" /> {img.imageType}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
