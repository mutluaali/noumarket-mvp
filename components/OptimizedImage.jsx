'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=1200&q=70';

export default function OptimizedImage({ src, alt, className = '', priority = false, sizes = '(max-width: 768px) 100vw, 33vw', fill = true, width, height }) {
  const [failed, setFailed] = useState(false);
  const imageSrc = useMemo(() => {
    if (failed || !src || typeof src !== 'string') return FALLBACK_IMAGE;
    return src;
  }, [src, failed]);

  const commonProps = {
    src: imageSrc,
    alt: alt || 'NouMarket ilan görseli',
    className: `${className} bg-slate-100`,
    priority,
    sizes,
    quality: 72,
    onError: () => setFailed(true),
  };

  if (!fill) {
    return <Image {...commonProps} width={width || 900} height={height || 650} />;
  }

  return <Image {...commonProps} fill />;
}
