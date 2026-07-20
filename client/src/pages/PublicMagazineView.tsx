import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { Link, useParams } from "wouter";
import { useState } from "react";

export default function PublicMagazineView() {
  const params = useParams<{ id?: string; shortCode?: string }>();
  const isShortCode = !params.id && params.shortCode;
  const magazineId = params.id ? parseInt(params.id) : 0;
  
  const { data: magazine, isLoading } = isShortCode
    ? trpc.gallery.byShareCode.useQuery({ shortCode: params.shortCode! })
    : trpc.gallery.get.useQuery({ id: magazineId });
  const [currentPage, setCurrentPage] = useState(0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="w-96 h-96" />
      </div>
    );
  }

  if (!magazine) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <BookOpen className="w-16 h-16 text-muted-foreground/50" />
        <h2 className="text-xl font-bold">Revista não encontrada</h2>
        <p className="text-muted-foreground">Esta revista não está disponível publicamente.</p>
        <Link href="/gallery">
          <Button variant="outline">Voltar à Galeria</Button>
        </Link>
      </div>
    );
  }

  // Build pages array for the retro viewer
  const pages: Array<{ type: string; title: string; content: React.ReactNode }> = [];

  // Cover page
  pages.push({
    type: "cover",
    title: "Capa",
    content: (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center"
        style={{ background: "linear-gradient(135deg, #1a0533 0%, #0d1117 100%)" }}>
        {magazine.coverImageUrl && (
          <img src={magazine.coverImageUrl} alt="Capa" className="max-h-64 rounded-lg shadow-lg border border-yellow-500/30" />
        )}
        <h1 className="text-2xl font-bold text-yellow-400 font-mono">{magazine.title}</h1>
        <p className="text-cyan-400 text-sm font-mono">REVISTA RETRO AI</p>
      </div>
    ),
  });

  // Game of the Week
  if (magazine.gameOfTheWeekTitle) {
    pages.push({
      type: "game",
      title: "Jogo da Semana",
      content: (
        <div className="p-6 h-full overflow-y-auto" style={{ background: "#0d1117" }}>
          <p className="text-cyan-400 text-xs font-mono mb-2">★ JOGO DA SEMANA ★</p>
          <h2 className="text-xl font-bold text-yellow-400 font-mono mb-4">{magazine.gameOfTheWeekTitle}</h2>
          {magazine.gameOfTheWeekImageUrl && (
            <img src={magazine.gameOfTheWeekImageUrl} alt={magazine.gameOfTheWeekTitle} className="w-full max-h-48 object-cover rounded-lg mb-4 border border-purple-500/30" />
          )}
          {magazine.gameOfTheWeekDescription && (
            <p className="text-gray-200 text-sm leading-relaxed">{magazine.gameOfTheWeekDescription}</p>
          )}
        </div>
      ),
    });
  }

  // Articles
  if (magazine.articles) {
    for (const article of magazine.articles) {
      pages.push({
        type: "article",
        title: article.title,
        content: (
          <div className="p-6 h-full overflow-y-auto" style={{ background: "#0d1117" }}>
            <h2 className="text-lg font-bold text-cyan-400 font-mono mb-3">{article.title}</h2>
            {article.images && article.images.length > 0 && (
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {article.images.filter((img: any) => img.imageUrl).map((img: any, idx: number) => (
                  <img key={idx} src={img.imageUrl!} alt="" className="h-24 rounded border border-yellow-500/30" />
                ))}
              </div>
            )}
            {article.content && (
              <p className="text-gray-200 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{article.content}</p>
            )}
            {article.tips && (
              <div className="border-t border-yellow-500/30 pt-3 mt-3">
                <p className="text-yellow-400 text-xs font-mono mb-2">★ DICAS & MACETES ★</p>
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{article.tips}</p>
              </div>
            )}
          </div>
        ),
      });
    }
  }

  const totalPages = pages.length;
  const currentPageData = pages[currentPage];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between h-14">
          <Link href="/gallery">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Galeria
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground font-mono">
            {currentPage + 1} / {totalPages}
          </span>
          <div className="w-20" />
        </div>
      </header>

      {/* Viewer */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl aspect-[3/4] rounded-lg overflow-hidden border-2 border-yellow-500/30 shadow-2xl shadow-purple-900/20 relative">
          {/* Page content */}
          <div className="h-full">
            {currentPageData?.content}
          </div>

          {/* Pixel border decoration */}
          <div className="absolute inset-0 pointer-events-none border-4 border-transparent"
            style={{
              borderImage: "repeating-linear-gradient(90deg, #FFD700 0px, #FFD700 4px, transparent 4px, transparent 8px) 4",
            }}
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-4 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Anterior
          </Button>

          <div className="flex gap-1">
            {pages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  idx === currentPage ? "bg-primary" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1}
            className="gap-2"
          >
            Próxima
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
