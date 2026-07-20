import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Eye, ArrowLeft, Heart, Share2 } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function PublicGallery() {
  const { data: magazines, isLoading, refetch } = trpc.gallery.list.useQuery({ limit: 40, offset: 0 });
  const { user } = useAuth();
  const toggleLike = trpc.likes.toggle.useMutation();
  const createShare = trpc.share.create.useMutation();
  const { data: userLikes = [] } = trpc.likes.getUserLikes.useQuery(undefined, { enabled: !!user });
  const [likedMags, setLikedMags] = useState<Set<number>>(new Set(userLikes));

  const handleLike = async (e: React.MouseEvent, magazineId: number) => {
    e.preventDefault();
    if (!user) {
      toast.error("Faça login para curtir revistas");
      return;
    }
    try {
      const result = await toggleLike.mutateAsync({ magazineId });
      setLikedMags(prev => {
        const next = new Set(prev);
        if (result.liked) next.add(magazineId);
        else next.delete(magazineId);
        return next;
      });
      refetch();
    } catch (err) {
      toast.error("Erro ao curtir revista");
    }
  };

  const handleShare = async (e: React.MouseEvent, magazineId: number) => {
    e.preventDefault();
    if (!user) {
      toast.error("Faça login para compartilhar");
      return;
    }
    try {
      const result = await createShare.mutateAsync({ magazineId });
      const shareUrl = `${window.location.origin}/s/${result.shortCode}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copiado para a área de transferência!");
    } catch (err) {
      toast.error("Erro ao gerar link de compartilhamento");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-lg font-bold text-foreground">Galeria Pública</h1>
          </div>
          <p className="text-sm text-muted-foreground hidden sm:block">
            Revistas criadas pela comunidade
          </p>
        </div>
      </header>

      <main className="container py-8">
        {/* Hero section */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Explore Revistas Retrô
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Descubra revistas criadas por outros usuários. Navegue pelas edições e inspire-se para criar a sua própria.
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Magazines grid */}
        {!isLoading && magazines && magazines.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {magazines.map((mag: any) => (
              <Link key={mag.id} href={`/gallery/${mag.id}`}>
                <Card className="overflow-hidden group cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all duration-200">
                  {/* Cover image */}
                  <div className="relative h-48 bg-gradient-to-br from-purple-900/50 to-cyan-900/50 overflow-hidden">
                    {mag.coverImageUrl ? (
                      <img
                        src={mag.coverImageUrl}
                        alt={mag.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <BookOpen className="w-12 h-12 text-muted-foreground/30" />
                      </div>
                    )}
                    {/* Template badge */}
                    {mag.coverTemplate && (
                      <div className="absolute top-2 right-2 bg-black/70 text-xs text-yellow-400 px-2 py-1 rounded font-mono">
                        {mag.coverTemplate}
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  {/* Info */}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground truncate mb-1">
                      {mag.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      {new Date(mag.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-muted-foreground hover:text-red-500 gap-1"
                        onClick={(e) => handleLike(e, mag.id)}
                      >
                        <Heart className="w-4 h-4" fill={likedMags.has(mag.id) ? "currentColor" : "none"} />
                        <span>{mag.likeCount || 0}</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-auto p-0 text-muted-foreground hover:text-foreground"
                        onClick={(e) => handleShare(e, mag.id)}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!magazines || magazines.length === 0) && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma revista pública</h3>
            <p className="text-muted-foreground">Volte mais tarde para descobrir novas revistas!</p>
          </div>
        )}
      </main>
    </div>
  );
}
