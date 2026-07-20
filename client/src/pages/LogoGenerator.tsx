import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { Loader2, ArrowLeft, Sparkles, Save, Image, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function LogoGenerator() {
  useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();

  const [magazineName, setMagazineName] = useState("");
  const [logoPrompt, setLogoPrompt] = useState("");
  const [generatedLogoUrl, setGeneratedLogoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: identity, refetch: refetchIdentity } = trpc.profile.getVisualIdentity.useQuery();
  const generateLogo = trpc.ai.generateLogo.useMutation();
  const saveIdentity = trpc.profile.saveVisualIdentity.useMutation();

  const handleGenerate = async () => {
    if (!logoPrompt.trim()) {
      toast.error("Descreva como deve ser o logo");
      return;
    }
    setIsGenerating(true);
    try {
      const { url } = await generateLogo.mutateAsync({ prompt: logoPrompt });
      setGeneratedLogoUrl(url);
      toast.success("Logo gerado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar logo");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!magazineName.trim()) {
      toast.error("Informe o nome da revista");
      return;
    }
    try {
      await saveIdentity.mutateAsync({
        magazineName,
        logoUrl: generatedLogoUrl,
      });
      refetchIdentity();
      toast.success("Identidade visual salva com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <h1 className="font-display text-lg font-bold">Gerador de Logo</h1>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input */}
          <div className="space-y-6">
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="font-display text-lg">Criar Logo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-display text-sm">Nome da Revista</Label>
                  <Input
                    placeholder="Ex: Retrô Gamer AI"
                    value={magazineName}
                    onChange={(e) => setMagazineName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-display text-sm">Descrição do Logo</Label>
                  <Input
                    placeholder="Ex: Logo pixelado com joystick e texto neon"
                    value={logoPrompt}
                    onChange={(e) => setLogoPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isGenerating && handleGenerate()}
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full font-display"
                  size="lg"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando Logo...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Gerar Logo</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Current Identity */}
            {identity && (
              <Card className="bg-card border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-sm">Identidade Atual</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm"><span className="text-muted-foreground">Nome:</span> <strong>{identity.magazineName}</strong></p>
                  {identity.logoUrl && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden border border-border/50">
                      <img src={identity.logoUrl} alt="Logo atual" className="w-full h-full object-cover" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Preview */}
          <div className="space-y-6">
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="font-display text-lg">Pré-visualização</CardTitle>
              </CardHeader>
              <CardContent>
                {generatedLogoUrl ? (
                  <div className="space-y-4">
                    <div className="aspect-square rounded-xl overflow-hidden border-2 border-primary/30 shadow-lg">
                      <img src={generatedLogoUrl} alt="Logo gerado" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave} className="flex-1 font-display" disabled={!magazineName.trim()}>
                        <Save className="w-4 h-4 mr-2" /> Salvar na Identidade
                      </Button>
                      <Button variant="outline" onClick={handleGenerate} disabled={isGenerating}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square rounded-xl bg-muted flex items-center justify-center border border-dashed border-border">
                    <div className="text-center">
                      <Image className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">O logo gerado aparecerá aqui</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
