import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { useState } from "react";
import { Loader2, ArrowLeft, ChevronLeft, ChevronRight, Home, Download } from "lucide-react";
import { toast } from "sonner";

// Simple markdown renderer for retro style
function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 mb-4 text-amber-100/90">
          {listItems.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(<h3 key={idx} className="text-xl font-pixel text-cyan-300 mt-6 mb-3">{trimmed.substring(4)}</h3>);
    } else if (trimmed.startsWith('- ')) {
      listItems.push(trimmed.substring(2));
    } else if (trimmed !== '') {
      flushList();
      // Handle italic *text*
      const parts = trimmed.split(/(\*.*?\*)/g);
      const rendered = parts.map((part, i) =>
        part.startsWith('*') && part.endsWith('*')
          ? <em key={i} className="text-yellow-300">{part.slice(1, -1)}</em>
          : part
      );
      elements.push(<p key={idx} className="mb-3 text-amber-100/90 leading-relaxed">{rendered}</p>);
    } else {
      flushList();
    }
  });
  flushList();
  return elements;
}

export default function MagazineViewer() {
  useAuth({ redirectOnUnauthenticated: true });
  const params = useParams<{ id: string }>();
  const magazineId = parseInt(params.id || "0");
  const [, navigate] = useLocation();
  const [currentPage, setCurrentPage] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/magazines/${magazineId}/pdf`, {
        credentials: "include",
        headers: {
          // Forward session token for preview environments
          ...(sessionStorage.getItem("__session_mirror")
            ? { Authorization: `Bearer ${sessionStorage.getItem("__session_mirror")}` }
            : {}),
        },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(err.error || "Falha ao gerar PDF");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${magazine?.title || "revista"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF exportado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao exportar PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const { data: magazine, isLoading } = trpc.magazine.get.useQuery(
    { id: magazineId },
    { enabled: magazineId > 0 }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!magazine) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-gray-950">
        <p className="text-amber-100/70">Revista não encontrada</p>
        <Button onClick={() => navigate("/")}>Voltar</Button>
      </div>
    );
  }

  // Build pages: Cover, Game of the Week, Articles (each article = 1 page)
  const pages: { type: string; data: any }[] = [];

  // Page 0: Cover
  pages.push({ type: "cover", data: magazine });

  // Page 1: Game of the Week
  if (magazine.gameOfTheWeekTitle) {
    pages.push({ type: "gameOfTheWeek", data: magazine });
  }

  // Pages 2+: Articles
  if (magazine.articles) {
    for (const article of magazine.articles) {
      pages.push({ type: "article", data: article });
    }
  }

  const totalPages = pages.length;
  const page = pages[currentPage];

  const goNext = () => setCurrentPage(p => Math.min(p + 1, totalPages - 1));
  const goPrev = () => setCurrentPage(p => Math.max(p - 1, 0));

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Retro Header */}
      <header className="bg-gradient-to-r from-purple-900 via-blue-900 to-purple-900 border-b-4 border-cyan-400 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Button variant="ghost" size="sm" className="text-cyan-300 hover:text-cyan-100" onClick={() => navigate("/")}>
            <Home className="w-4 h-4 mr-1" /> Início
          </Button>
          <h1 className="font-pixel text-xs sm:text-sm text-cyan-300 text-center truncate max-w-[40%]">
            {magazine.title}
          </h1>
          <div className="flex items-center gap-2">
            <span className="font-pixel text-[10px] text-cyan-400/70">
              {currentPage + 1}/{totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-yellow-300 hover:text-yellow-100 hover:bg-yellow-500/10"
              onClick={handleExportPdf}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <><Download className="w-4 h-4 mr-1" /> PDF</>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl">
          {page.type === "cover" && (
            <div className="relative aspect-[3/4] max-h-[70vh] mx-auto rounded-lg overflow-hidden border-4 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.3)]">
              {magazine.coverImageUrl ? (
                <img src={magazine.coverImageUrl} alt="Capa" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center">
                  <span className="font-pixel text-cyan-300 text-center px-4">{magazine.title}</span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6">
                <h2 className="font-pixel text-lg sm:text-2xl text-yellow-300 drop-shadow-lg">{magazine.title}</h2>
              </div>
            </div>
          )}

          {page.type === "gameOfTheWeek" && (
            <div className="bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 rounded-lg border-2 border-cyan-500/50 p-6 sm:p-8 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <div className="text-center mb-6">
                <span className="font-pixel text-[10px] text-cyan-400 uppercase tracking-widest">★ Destaque ★</span>
                <h2 className="font-pixel text-lg sm:text-xl text-yellow-300 mt-2">{magazine.gameOfTheWeekTitle}</h2>
              </div>
              {magazine.gameOfTheWeekImageUrl && (
                <div className="aspect-video rounded-lg overflow-hidden border-2 border-yellow-500/50 mb-6 shadow-lg">
                  <img src={magazine.gameOfTheWeekImageUrl} alt="Jogo da Semana" className="w-full h-full object-cover" />
                </div>
              )}
              <p className="text-amber-100/90 text-center text-lg leading-relaxed">{magazine.gameOfTheWeekDescription}</p>
            </div>
          )}

          {page.type === "article" && (
            <div className="bg-gradient-to-br from-gray-900 via-indigo-950/50 to-gray-900 rounded-lg border-2 border-purple-500/30 p-6 sm:p-8 max-h-[75vh] overflow-y-auto shadow-[0_0_20px_rgba(139,92,246,0.15)]">
              <h2 className="font-pixel text-sm sm:text-base text-cyan-300 mb-6 pb-3 border-b border-cyan-500/30">{page.data.title}</h2>

              {/* Article images */}
              {page.data.images && page.data.images.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {page.data.images.filter((img: any) => img.imageUrl).map((img: any) => (
                    <div key={img.id} className="aspect-square rounded overflow-hidden border border-purple-500/30">
                      <img src={img.imageUrl} alt={img.imageType} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {/* Article content */}
              {page.data.content && (
                <div className="prose-retro">
                  {renderMarkdown(page.data.content)}
                </div>
              )}

              {/* Tips */}
              {page.data.tips && (
                <div className="mt-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <h4 className="font-pixel text-[10px] text-yellow-300 mb-3">★ DICAS & MACETES ★</h4>
                  {renderMarkdown(page.data.tips)}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Navigation Footer */}
      <footer className="bg-gray-900/80 border-t-2 border-purple-500/30 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={goPrev}
            disabled={currentPage === 0}
            className="text-cyan-300 hover:text-cyan-100 disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5 mr-1" /> Anterior
          </Button>

          {/* Page dots */}
          <div className="flex gap-1.5">
            {pages.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${i === currentPage ? 'bg-cyan-400' : 'bg-gray-600 hover:bg-gray-500'}`}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={goNext}
            disabled={currentPage === totalPages - 1}
            className="text-cyan-300 hover:text-cyan-100 disabled:opacity-30"
          >
            Próxima <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
