import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { Loader2, ArrowLeft, RotateCcw, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function VersionHistory() {
  useAuth({ redirectOnUnauthenticated: true });
  const params = useParams<{ id: string }>();
  const magazineId = parseInt(params.id || "0");
  const [, navigate] = useLocation();

  const { data: versions, isLoading } = trpc.version.list.useQuery(
    { magazineId },
    { enabled: magazineId > 0 }
  );
  const { data: magazine } = trpc.magazine.get.useQuery(
    { id: magazineId },
    { enabled: magazineId > 0 }
  );

  const revertVersion = trpc.version.revert.useMutation();
  const utils = trpc.useUtils();

  const handleRevert = async (versionId: number) => {
    if (!confirm("Reverter para esta versão? As alterações atuais serão substituídas.")) return;
    try {
      await revertVersion.mutateAsync({ versionId });
      utils.magazine.get.invalidate({ id: magazineId });
      toast.success("Revista revertida com sucesso!");
      navigate(`/composer/${magazineId}`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao reverter versão");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/composer/${magazineId}`)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao Compositor
          </Button>
          <h1 className="font-display text-lg font-bold">Histórico de Versões</h1>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        {magazine && (
          <div className="mb-6 p-4 rounded-lg bg-card border border-border/50">
            <h2 className="font-display font-semibold">{magazine.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">Selecione uma versão para reverter</p>
          </div>
        )}

        {versions && versions.length > 0 ? (
          <div className="space-y-3">
            {versions.map((version, idx) => (
              <Card key={version.id} className="bg-card border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="py-4 px-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {idx === 0 ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <Clock className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-display font-medium text-sm">
                          {version.versionLabel || `Versão ${versions.length - idx}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(version.createdAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevert(version.id)}
                      className="text-xs"
                      disabled={revertVersion.isPending}
                    >
                      {revertVersion.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RotateCcw className="w-3 h-3 mr-1" />}
                      Reverter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-border rounded-xl">
            <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-display font-semibold mb-2">Nenhuma versão salva</h3>
            <p className="text-sm text-muted-foreground">Salve versões no compositor para poder reverter depois.</p>
          </div>
        )}
      </main>
    </div>
  );
}
