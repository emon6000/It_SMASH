import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { imgUrl } from '../lib/api';
import { parseVideo } from '../lib/video';

// Main image zooms on mouse hover (desktop). Thumbnails + videos form a slider.
function Zoom({ src, alt }) {
  const [on, setOn] = useState(false);
  const [pos, setPos] = useState('50% 50%');
  const move = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPos(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  };
  return (
    <div className="relative aspect-square cursor-zoom-in overflow-hidden bg-soft" onMouseEnter={() => setOn(true)} onMouseLeave={() => setOn(false)} onMouseMove={move}>
      <img src={src} alt={alt} className="h-full w-full object-cover transition-transform duration-150 ease-out" style={{ transform: on ? 'scale(2.2)' : 'scale(1)', transformOrigin: pos }} draggable={false} />
    </div>
  );
}

export default function Gallery({ images = [], videos = [], alt }) {
  const items = [
    ...images.map((src) => ({ kind: 'img', src: imgUrl(src), thumb: imgUrl(src) })),
    ...videos.map((u) => ({ kind: 'video', ...parseVideo(u) })),
  ];
  const [i, setI] = useState(0);
  const strip = useRef(null);
  if (!items.length) return <div className="aspect-square bg-soft" />;
  const cur = items[Math.min(i, items.length - 1)];
  const go = (d) => setI((x) => (x + d + items.length) % items.length);
  const touch = useRef(0);

  return (
    <div>
      <div className="relative" onTouchStart={(e) => (touch.current = e.touches[0].clientX)} onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); }}>
        {cur.kind === 'img' ? <Zoom src={cur.src} alt={alt} /> : cur.type === 'iframe' ? (
          <div className="aspect-square bg-black"><iframe key={cur.src} src={cur.src} title="video" className="h-full w-full" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div>
        ) : (
          <div className="aspect-square bg-black"><video key={cur.src} src={cur.src} controls playsInline className="h-full w-full object-contain" /></div>
        )}
        {items.length > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="previous" className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-bg/90 shadow"><ChevronLeft size={18} /></button>
            <button onClick={() => go(1)} aria-label="next" className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-bg/90 shadow"><ChevronRight size={18} /></button>
          </>
        )}
      </div>
      {items.length > 1 && (
        <div ref={strip} className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {items.map((it, idx) => (
            <button key={idx} onClick={() => setI(idx)} className={`relative h-20 w-20 shrink-0 overflow-hidden border bg-soft ${idx === i ? 'border-fg' : 'border-line opacity-70 hover:opacity-100'}`}>
              {it.thumb ? <img src={it.thumb} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-black" />}
              {it.kind === 'video' && <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white"><Play size={20} fill="currentColor" /></span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
