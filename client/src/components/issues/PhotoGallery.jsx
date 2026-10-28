import { useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { resolveAssetUrl } from '../../lib/api';

/** Photo grid with a keyboard-navigable lightbox. */
export function PhotoGallery({ photos = [], alt = 'Complaint photo', className }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const visible = photos.filter((photo) => photo?.url);

  if (!visible.length) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-10 text-slate-400',
          className,
        )}
      >
        <ImageOff className="h-6 w-6" />
        <p className="text-sm">No photos were attached to this complaint.</p>
      </div>
    );
  }

  const close = () => setActiveIndex(null);
  const step = (direction) =>
    setActiveIndex((current) => {
      const next = (current + direction + visible.length) % visible.length;
      return next;
    });

  return (
    <>
      <div
        className={cn(
          'grid gap-2.5',
          visible.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3',
          className,
        )}
      >
        {visible.map((photo, index) => (
          <button
            key={photo.url}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label={`Open photo ${index + 1} of ${visible.length}`}
          >
            <img
              src={resolveAssetUrl(photo.url)}
              alt={`${alt} ${index + 1}`}
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-navy-950/0 transition group-hover:bg-navy-950/10" />
          </button>
        ))}
      </div>

      {activeIndex !== null && (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-navy-950/85 p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close photo viewer"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          {visible.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  step(-1);
                }}
                aria-label="Previous photo"
                className="absolute left-4 grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  step(1);
                }}
                aria-label="Next photo"
                className="absolute right-4 grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <figure
            className="max-h-full w-full max-w-4xl"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={resolveAssetUrl(visible[activeIndex].url)}
              alt={`${alt} ${activeIndex + 1}`}
              className="max-h-[80vh] w-full rounded-2xl object-contain"
            />
            <figcaption className="mt-3 text-center text-sm text-white/70">
              Photo {activeIndex + 1} of {visible.length}
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}

export default PhotoGallery;
