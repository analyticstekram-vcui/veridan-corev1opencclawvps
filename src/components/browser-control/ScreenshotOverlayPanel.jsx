import React, { useState, useRef } from 'react';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';

/**
 * Renders a screenshot with an optional green bounding-box overlay
 * for the selectedElement. Pure read-only — no bridge commands sent.
 */
export default function ScreenshotOverlayPanel({ src, selectedElement }) {
  const [showOverlay, setShowOverlay] = useState(true);
  const [imgSize, setImgSize] = useState(null);
  const imgRef = useRef(null);

  const hasBbox = selectedElement && (
    selectedElement.boundingBox ||
    selectedElement.bbox ||
    selectedElement.rect
  );

  const bbox = hasBbox
    ? (selectedElement.boundingBox || selectedElement.bbox || selectedElement.rect)
    : null;

  // When the image loads, capture its rendered size so we can scale the bbox
  const handleImageLoad = () => {
    if (imgRef.current) {
      setImgSize({
        naturalW: imgRef.current.naturalWidth  || imgRef.current.width,
        naturalH: imgRef.current.naturalHeight || imgRef.current.height,
        renderedW: imgRef.current.offsetWidth,
        renderedH: imgRef.current.offsetHeight,
      });
    }
  };

  // Scale bbox from natural image coords → rendered pixel coords
  const scaledBox = bbox && imgSize ? (() => {
    const scaleX = imgSize.renderedW / (imgSize.naturalW || imgSize.renderedW);
    const scaleY = imgSize.renderedH / (imgSize.naturalH || imgSize.renderedH);
    return {
      left:   (bbox.x ?? bbox.left ?? 0)  * scaleX,
      top:    (bbox.y ?? bbox.top  ?? 0)  * scaleY,
      width:  (bbox.width  ?? 0)          * scaleX,
      height: (bbox.height ?? 0)          * scaleY,
    };
  })() : null;

  const label = selectedElement
    ? `${(selectedElement.type || selectedElement.tag || 'EL').toUpperCase()} · ${(selectedElement.text || '').slice(0, 30) || '—'}`
    : null;

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-3 h-3 text-primary" />
          <span className="text-[9px] uppercase tracking-widest text-primary font-semibold">Browser Screenshot Preview</span>
        </div>
        {selectedElement && (
          <button
            onClick={() => setShowOverlay(v => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1 border text-[9px] uppercase tracking-wider transition-colors font-semibold ${
              showOverlay
                ? 'border-primary/40 text-primary bg-primary/5 hover:bg-primary/10'
                : 'border-border text-muted-foreground hover:bg-secondary/50'
            }`}
          >
            {showOverlay ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
            {showOverlay ? 'Hide Overlay' : 'Show Overlay'}
          </button>
        )}
      </div>

      {/* No-bbox warning */}
      {selectedElement && showOverlay && !hasBbox && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20">
          <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
          <span className="text-[9px] text-amber-500/80 font-mono">
            Overlay unavailable: selected element has no bounding box data.
          </span>
        </div>
      )}

      {/* Screenshot + overlay */}
      <div className="relative inline-block w-full">
        <img
          ref={imgRef}
          src={src}
          alt="OpenClaw browser screenshot"
          className="w-full rounded border border-border/50 max-h-[500px] object-contain block"
          onLoad={handleImageLoad}
        />

        {/* Green outline overlay */}
        {showOverlay && scaledBox && scaledBox.width > 0 && (
          <div
            className="absolute pointer-events-none"
            style={{
              left:   scaledBox.left,
              top:    scaledBox.top,
              width:  scaledBox.width,
              height: scaledBox.height,
              border: '2px solid #22c55e',
              boxShadow: '0 0 0 1px rgba(34,197,94,0.25), inset 0 0 0 1px rgba(34,197,94,0.1)',
            }}
          >
            {/* Label */}
            {label && (
              <div
                className="absolute left-0 font-mono text-[9px] font-semibold px-1.5 py-0.5 whitespace-nowrap"
                style={{
                  top: scaledBox.height > 20 ? 0 : -18,
                  background: 'rgba(34,197,94,0.85)',
                  color: '#000',
                  maxWidth: 240,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {label}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}