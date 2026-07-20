import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { Loader2, ArrowLeft, Sparkles, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const EDITORIAL_STYLES = ["Magazine", "Jornal", "Quadrinhos", "Mangá", "Livro", "Zine"];

export default function EditorialConcept() {
  useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();

  const [publicationTitle, setPublicationTitle] = useState("");
  const [mainTheme, setMainTheme] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [visualHighlight, setVisualHighlight] = useState("");
  const [dominantColor, setDominantColor] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: existingConcept, isLoading: loadingConcept } = trpc.profile.getEditorialConcept.useQuery();
  const generateConcept = trpc.ai.generateEditorialConcept.useMutation();

  const toggleStyle = (style: string) => {
    setSelectedStyles(prev =>
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    );
  };

  const handleGenerate = async () => {
    if (!publicationTitle.trim() || !mainTheme.trim()) {
      toast.error("Preencha pelo menos o título e o tema principal");
      return;
    }
    setIsGenerating(true);
    try {
      await generateConcept.mutateAsync({
        publicationTitle,
        mainTheme,
        targetAudience,
        editorialStyles: selectedStyles,
        visualHighlight,
        dominantColor,
      });
      toast.success("Conceito Editorial gerado e salvo com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar conceito editorial");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <h1 className="font-display text-lg font-bold">Gerador de Conceito Editorial</h1>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="space-y-6">
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="font-display text-lg">Dados da Publicação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-display text-sm">Título da Publicação</Label>
                  <Input
                    placeholder="Ex: Retrô Gamer Brasil"
                    value={publicationTitle}
                    onChange={(e) => setPublicationTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-display text-sm">Tema Principal</Label>
                  <Input
                    placeholder="Ex: Games retrô dos anos 80 e 90"
                    value={mainTheme}
                    onChange={(e) => setMainTheme(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-display text-sm">Público-Alvo</Label>
                  <Input
                    placeholder="Ex: Gamers nostálgicos de 25-45 anos"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="font-display text-lg">Estilo Visual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-display text-sm">Estilos Editoriais</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {EDITORIAL_STYLES.map(style => (
                      <label key={style} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/50 cursor-pointer hover:border-primary/30 transition-colors">
                        <Checkbox
                          checked={selectedStyles.includes(style)}
                          onCheckedChange={() => toggleStyle(style)}
                        />
                        <span className="text-sm">{style}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-display text-sm">Destaque Visual</Label>
                  <Input
                    placeholder="Ex: Pixel art vibrante, neon, scanlines"
                    value={visualHighlight}
                    onChange={(e) => setVisualHighlight(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-display text-sm">Cor Dominante</Label>
                  <Input
                    placeholder="Ex: Ciano, roxo, amarelo neon"
                    value={dominantColor}
                    onChange={(e) => setDominantColor(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full font-display"
                  size="lg"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando Conceito...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Gerar Conceito Editorial</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Result Preview */}
          <div className="space-y-6">
            {loadingConcept ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : existingConcept ? (
              <>
                <Card className="bg-card border-primary/20">
                  <CardHeader>
                    <CardTitle className="font-display text-lg flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      Conceito Ativo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Ficha Técnica</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Nome:</span> <strong>{(existingConcept as any).technicalSheet?.proposedName}</strong></p>
                        <p><span className="text-muted-foreground">Foco:</span> {(existingConcept as any).technicalSheet?.editorialFocus}</p>
                        <p><span className="text-muted-foreground">Formato:</span> {(existingConcept as any).technicalSheet?.referenceFormat}</p>
                        <p><span className="text-muted-foreground">Público:</span> {(existingConcept as any).technicalSheet?.keyAudience}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Conceito de Capa</h4>
                      <p className="text-sm">{(existingConcept as any).coverConcept?.description}</p>
                      <p className="text-sm text-primary mt-1 italic">"{(existingConcept as any).coverConcept?.headline}"</p>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Layout Interno</h4>
                      <p className="text-sm text-muted-foreground">{(existingConcept as any).internalLayout?.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-12 border border-dashed border-border rounded-xl">
                <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-display font-semibold mb-2">Nenhum conceito definido</h3>
                <p className="text-sm text-muted-foreground">Preencha o formulário e gere seu conceito editorial com IA.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
