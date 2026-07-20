import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import { useLocation } from "wouter";
import { Loader2, Plus, BookOpen, Sparkles, Palette, Trash2, Globe, Eye } from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { data: magazines, isLoading: loadingMags, refetch } = trpc.magazine.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const deleteMutation = trpc.magazine.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Revista excluída com sucesso");
    },
  });
  const togglePublicMutation = trpc.magazine.togglePublic.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Visibilidade atualizada");
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <h1 className="font-display text-xl font-bold text-foreground">Revista Retrô AI</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/gallery")}>
              <Globe className="w-4 h-4 mr-1" /> Galeria
            </Button>
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:block">Olá, {user?.name || 'Jogador'}</span>
                <Button variant="outline" size="sm" onClick={() => navigate("/editorial-concept")}>
                  <Palette className="w-4 h-4 mr-1" /> Conceito Editorial
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/logo-generator")}>
                  <Sparkles className="w-4 h-4 mr-1" /> Logo
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-12">
        {!isAuthenticated ? (
          /* Landing Section for unauthenticated users */
          <div className="text-center max-w-3xl mx-auto">
            <div className="mb-8">
              <h2 className="font-pixel text-2xl sm:text-3xl text-primary mb-6 leading-relaxed">
                REVISTA RETRÔ AI
              </h2>
              <p className="text-lg text-muted-foreground mb-2 font-display">
                Crie revistas de games retrô com inteligência artificial.
              </p>
              <p className="text-muted-foreground">
                Gere capas, artigos, imagens pixel art e muito mais — tudo com o poder da IA.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="bg-card border-border/50">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold mb-2">Geração com IA</h3>
                  <p className="text-sm text-muted-foreground">Estrutura, textos e imagens gerados automaticamente por inteligência artificial.</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border/50">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                    <Palette className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-display font-semibold mb-2">Estilo Retrô</h3>
                  <p className="text-sm text-muted-foreground">Pixel art 16-bit, estética dos anos 90, nostalgia pura.</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border/50">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-chart-3/20 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-6 h-6 text-chart-3" />
                  </div>
                  <h3 className="font-display font-semibold mb-2">Visualizador</h3>
                  <p className="text-sm text-muted-foreground">Visualize sua revista em modo leitura com navegação por páginas.</p>
                </CardContent>
              </Card>
            </div>

            <Button size="lg" onClick={() => startLogin()} className="font-display text-lg px-8 py-6">
              Entrar e Começar a Criar
            </Button>
          </div>
        ) : (
          /* Authenticated User Dashboard */
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-display text-2xl font-bold">Suas Revistas</h2>
                <p className="text-muted-foreground mt-1">Gerencie e crie novas edições</p>
              </div>
              <Button onClick={() => navigate("/create")} className="font-display">
                <Plus className="w-4 h-4 mr-2" /> Nova Revista
              </Button>
            </div>

            {loadingMags ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : magazines && magazines.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {magazines.map((mag) => (
                  <Card key={mag.id} className="bg-card border-border/50 hover:border-primary/30 transition-colors group cursor-pointer overflow-hidden">
                    <div className="aspect-[3/4] relative bg-muted overflow-hidden" onClick={() => navigate(`/composer/${mag.id}`)}>
                      {mag.coverImageUrl ? (
                        <img src={mag.coverImageUrl} alt={mag.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${mag.status === 'complete' ? 'bg-green-500/20 text-green-400' : mag.status === 'generating' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          {mag.status === 'complete' ? 'COMPLETA' : mag.status === 'generating' ? 'GERANDO' : 'RASCUNHO'}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-display font-semibold text-sm line-clamp-2 mb-2">{mag.title}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {new Date(mag.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                        <div className="flex gap-1">
                          {mag.status === 'complete' && (
                            <>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={(e) => { e.stopPropagation(); navigate(`/view/${mag.id}`); }}>
                                <Eye className="w-3 h-3 mr-1" /> Ler
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-7 px-2 text-xs ${(mag as any).isPublic ? 'text-green-400' : 'text-muted-foreground'}`}
                                onClick={(e) => { e.stopPropagation(); togglePublicMutation.mutate({ id: mag.id, isPublic: !(mag as any).isPublic }); }}
                                title={(mag as any).isPublic ? 'Tornar privada' : 'Publicar na galeria'}
                              >
                                <Globe className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); if (confirm("Excluir esta revista?")) deleteMutation.mutate({ id: mag.id }); }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border border-dashed border-border rounded-xl">
                <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-display text-lg font-semibold mb-2">Nenhuma revista ainda</h3>
                <p className="text-muted-foreground mb-6">Crie sua primeira revista retrô com IA!</p>
                <Button onClick={() => navigate("/create")} className="font-display">
                  <Plus className="w-4 h-4 mr-2" /> Criar Primeira Revista
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
