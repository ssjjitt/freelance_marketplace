import React, { useCallback, useEffect, useState } from "react";
import { FileText, ChevronLeft, ChevronRight, X, Download } from "lucide-react";
import type { AttachmentDto } from "../../services/attachment.service";

type Props = {
  attachments: AttachmentDto[];
  className?: string;
};

function isImageMime(mime: string | null | undefined) {
  return Boolean(mime && mime.toLowerCase().startsWith("image/"));
}

/** Если mime не записан в БД, пробуем по расширению имени файла */
function isLikelyImage(a: AttachmentDto) {
  if (isImageMime(a.mimeType)) return true;
  const name = (a.originalName || "").toLowerCase();
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(name);
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const AttachmentList: React.FC<Props> = ({ attachments, className = "" }) => {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  const images = attachments.filter((a) => isLikelyImage(a));

  const closeLightbox = useCallback(() => setCurrentIndex(null), []);

  const showNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex !== null && currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, images.length]);

  const showPrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex !== null && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (currentIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") showNext();
      if (e.key === "ArrowLeft") showPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentIndex, closeLightbox, showNext, showPrev]);

  if (!attachments?.length) return null;

  const currentImage = currentIndex !== null ? images[currentIndex] : null;

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 ${className}`.trim()}>
      {attachments.map((a) => {
        const isImg = isLikelyImage(a);
        const imgIndex = images.indexOf(a);

        return (
          <div key={a.id} className="card-surface group relative aspect-square overflow-hidden p-0 border-white/5 hover:border-primary/40 transition-all duration-300">
            {isImg ? (
              <button
                type="button"
                onClick={() => setCurrentIndex(imgIndex)}
                className="h-full w-full cursor-zoom-in"
              >
                <img
                  src={a.url}
                  alt={a.originalName}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-xs font-medium text-white bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm">просмотр</span>
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => triggerDownload(a.url, a.originalName)}
                className="flex h-full w-full flex-col items-center justify-center gap-2 bg-white/[0.02] p-4 text-center hover:bg-white/[0.06] transition-colors"
              >
                <div className="rounded-xl bg-white/5 p-3 group-hover:bg-primary/10 transition-colors">
                  <FileText className="h-8 w-8 text-white/40 group-hover:text-primary/80" strokeWidth={1.5} />
                </div>
                <span className="line-clamp-2 w-full text-[11px] font-medium text-white/60 group-hover:text-white/90">
                  {a.originalName}
                </span>
              </button>
            )}
          </div>
        );
      })}

      {/* полноэкранный лайтбокс */}
      {currentImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={closeLightbox}
        >
          {/* верхняя панель управления */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-[110] bg-gradient-to-b from-black/60 to-transparent">
            <span className="text-white/70 text-sm font-medium ml-4">
              {currentIndex! + 1} / {images.length} — {currentImage.originalName}
            </span>
            <div className="flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); triggerDownload(currentImage.url, currentImage.originalName); }}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                title="скачать"
              >
                <Download size={20} />
              </button>
              <button
                onClick={closeLightbox}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* кнопки навигации */}
          {currentIndex! > 0 && (
            <button
              onClick={showPrev}
              className="absolute left-4 z-[110] p-3 rounded-full bg-black/20 hover:bg-white/10 text-white border border-white/5 transition-all hidden md:block"
            >
              <ChevronLeft size={32} />
            </button>
          )}

          {currentIndex! < images.length - 1 && (
            <button
              onClick={showNext}
              className="absolute right-4 z-[110] p-3 rounded-full bg-black/20 hover:bg-white/10 text-white border border-white/5 transition-all hidden md:block"
            >
              <ChevronRight size={32} />
            </button>
          )}

          {/* контейнер картинки с контрастным фоном */}
          <div
            className="relative w-full h-full flex items-center justify-center p-4 md:p-12"
            onClick={(e) => e.stopPropagation()}
          >
              <img
                key={currentImage.id}
                src={currentImage.url}
                alt={currentImage.originalName}
                /* добавляем белый фон и небольшой паддинг, чтобы края не прилипали */
                className="max-w-full max-h-full w-auto h-auto object-contain shadow-2xl animate-in zoom-in-95 duration-300 select-none bg-white"
              />
          </div>

          {/* сама картинка */}
          
        </div>
      )}
    </div>
  );
};

export default AttachmentList;