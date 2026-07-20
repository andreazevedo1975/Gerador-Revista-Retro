import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { Loader2, ArrowLeft, Zap, Brain, Gamepad2, Monitor, Music, Swords, BookOpen } from "lucide-react";
import { toast } from "sonner";

const TOPIC_SUGGESTIONS = [
  { icon: Gamepad2, label: "Console Clássico", example: "Super Nintendo - A era dourada dos 16-bits" },
  { icon: Swords, label: "Rivalidade", example: "Sega vs Nintendo - A guerra dos consoles" },
  { icon: Monitor, label: "Jogo Específico", example: "Chrono Trigger - A obra-prima da Square" },
  { icon: Music, label: "Trilha Sonora", example: "As melhores trilhas sonoras dos games 16-bit" },
  { icon: BookOpen, label: "Guia/Dicas", example: "Guia definitivo de Street Fighter II" },
];

const ERA_THEMES = [
  { id: "8bit", label: "Era 8-bit", description: "NES, Master System, Atari" },
  { id: "16bit", label: "Era 16-bit", description: "SNES, Mega Drive, PC Engine" },
  { id: "32bit", label: "Era 32-bit", description: "PS1, Saturn, N64" },
  { id: "arcade", label: "Arcades", description: "Fliperama, Neo Geo, CPS" },
  { id: "pc", label: "PC Retrô", description: "DOS, Amiga, MSX" },
];

const COVER_TEMPLATES = [
  {
    id: "supergamepower",
    label: "SuperGamePower",
    description: "Layout clássico com logo grande no topo, imagem central em destaque e chamadas laterais",
    colors: "from-blue-900 to-red-900",
    style: "Logo grande no topo, imagem do jogo em destaque no centro, chamadas em amarelo nas laterais, borda metálica",
  },
  {
    id: "acaogames",
    label: "Ação Games",
    description: "Fundo escuro com personagem em ação, título em perspectiva e selos de destaque",
    colors: "from-purple-900 to-black",
    style: "Fundo escuro, personagem em pose dinâmica, título em perspectiva 3D, selos circulares de destaque, efeitos de luz",
  },
  {
    id: "gamepro",
    label: "GamePro",
    description: "Estilo americano com fundo gradiente, screenshot grande e rating em estrelas",
    colors: "from-yellow-800 to-orange-900",
    style: "Fundo gradiente vibrante, screenshot do jogo em moldura, rating com estrelas, fontes bold sans-serif, barra de navegação no topo",
  },
  {
    id: "nintendopower",
    label: "Nintendo Power",
    description: "Capa limpa com arte oficial do jogo, logo no canto e barra colorida inferior",
    colors: "from-red-800 to-red-950",
    style: "Arte oficial do jogo em tela cheia, logo da revista no canto superior, barra vermelha inferior com títulos, estilo clean e premium",
  },
  {
    id: "megagame",
    label: "Mega Game",
    description: "Estilo brasileiro com colagem de imagens, muitas chamadas e visual carregado",
    colors: "from-green-900 to-cyan-900",
    style: "Colagem de múltiplas imagens de jogos, muitas chamadas de texto em diferentes tamanhos, visual carregado e colorido, borda com padrão xadrez",
  },
  {
    id: "custom",
    label: "Personalizado",
    description: "Sem template - a IA criará um layout original baseado no tema",
    colors: "from-gray-800 to-gray-900",
    style: "",
  },
];

export default function CreateMagazine() {
  useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const [topic, setTopic] = useState("");
  const [selectedEra, setSelectedEra] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [isDeepMode, setIsDeepMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: identity } = trpc.profile.getVisualIdentity.useQuery();
  const { data: editorialConcept } = trpc.profile.getEditorialConcept.useQuery();
  const generateStructure = trpc.ai.generateStructure.useMutation();
  const createMagazine = trpc.magazine.create.useMutation();
  const createArticle = trpc.article.create.useMutation();
  const createImage = trpc.article.createImage.useMutation();

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Digite um tema para a revista");
      return;
    }
    setIsGenerating(true);
    try {
      // Generate structure via AI
      const fullTopic = selectedEra ? `${topic} (Foco: ${ERA_THEMES.find(e => e.id === selectedEra)?.label || selectedEra})` : topic;
      const template = COVER_TEMPLATES.find(t => t.id === selectedTemplate);
      const coverStyleHint = template && template.id !== 'custom' ? template.style : undefined;
      const structure = await generateStructure.mutateAsync({
        topic: fullTopic,
        isDeepMode,
        magazineName: identity?.magazineName,
        editorialConcept: editorialConcept || undefined,
        coverStyleHint,
      });

      // Create magazine in DB
      const { id: magazineId } = await createMagazine.mutateAsync({
        title: structure.title,
        coverImagePrompt: structure.coverImagePrompt,
        coverTemplate: selectedTemplate || undefined,
        logoUrl: identity?.logoUrl || undefined,
        structureData: structure,
        isDeepMode,
        gameOfTheWeekTitle: structure.gameOfTheWeek?.title,
        gameOfTheWeekDescription: structure.gameOfTheWeek?.description,
        gameOfTheWeekImagePrompt: structure.gameOfTheWeek?.imagePrompt,
      });

      // Create articles in DB
      if (structure.articles) {
        for (let i = 0; i < structure.articles.length; i++) {
          const art = structure.articles[i];
          const { id: articleId } = await createArticle.mutateAsync({
            magazineId,
            articleIndex: i,
            title: art.title,
            contentPrompt: art.contentPrompt,
            tipsPrompt: art.tipsPrompt,
          });

          // Create image placeholders
          if (art.imagePrompts) {
            for (let j = 0; j < art.imagePrompts.length; j++) {
              const img = art.imagePrompts[j];
              await createImage.mutateAsync({
                articleId,
                imageIndex: j,
                imageType: img.type as "logo" | "gameplay" | "artwork",
                prompt: img.prompt,
              });
            }
          }
        }
      }

      toast.success("Estrutura gerada com sucesso!");
      navigate(`/composer/${magazineId}`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar estrutura da revista");
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
          <h1 className="font-display text-lg font-bold">Nova Revista</h1>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Topic Input */}
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-xl">Qual é a pauta desta edição?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Ex: Os melhores RPGs do Super Nintendo"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="text-lg h-12"
                onKeyDown={(e) => e.key === 'Enter' && !isGenerating && handleGenerate()}
              />

              {/* Era/Theme Selection */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Era / Tema</Label>
                <div className="flex flex-wrap gap-2">
                  {ERA_THEMES.map((era) => (
                    <button
                      key={era.id}
                      onClick={() => setSelectedEra(selectedEra === era.id ? "" : era.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        selectedEra === era.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 border-border/50 text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      {era.label}
                    </button>
                  ))}
                </div>
                {selectedEra && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {ERA_THEMES.find(e => e.id === selectedEra)?.description}
                  </p>
                )}
              </div>

              {/* Cover Template Selection */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Template de Capa</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COVER_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => setSelectedTemplate(selectedTemplate === tpl.id ? "" : tpl.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedTemplate === tpl.id
                          ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                          : "border-border/50 bg-muted/30 hover:border-primary/30"
                      }`}
                    >
                      <div className={`w-full h-8 rounded mb-2 bg-gradient-to-br ${tpl.colors}`} />
                      <span className="text-xs font-semibold block">{tpl.label}</span>
                      <span className="text-[10px] text-muted-foreground line-clamp-2">{tpl.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Deep Mode Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-accent" />
                  <div>
                    <Label className="font-display font-semibold cursor-pointer">Deep Mode</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Análise mais profunda e detalhada (mais lento)</p>
                  </div>
                </div>
                <Switch checked={isDeepMode} onCheckedChange={setIsDeepMode} />
              </div>

              {/* Identity info */}
              {identity && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <Zap className="w-4 h-4 text-primary" />
                  <span>Usando identidade: <strong className="text-foreground">{identity.magazineName}</strong></span>
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim()}
                className="w-full h-12 font-display text-base"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Gerando estrutura...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Gerar Revista
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Topic Suggestions */}
          <div>
            <h3 className="font-display text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Sugestões de Pauta</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TOPIC_SUGGESTIONS.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setTopic(suggestion.example)}
                  className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border/50 hover:border-primary/30 transition-colors text-left group"
                >
                  <suggestion.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium block">{suggestion.label}</span>
                    <span className="text-xs text-muted-foreground">{suggestion.example}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
