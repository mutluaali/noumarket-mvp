'use client';

import Image from 'next/image';
import { useState } from 'react';
import ListingImageFallback from '@/components/ListingImageFallback';
import { pickListingImageUrl } from '@/lib/listingImages';

export default function OptimizedImage({ src, alt, className = '', priority = false, sizes = '(max-width: 768px) 100vw, 33vw', fill = true, width, height }) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = pickListingImageUrl({ image: src, image_url: src }) || src;
  const showFallback = failed || !resolvedSrc;

  if (showFallback) {
    if (fill) {
      return <ListingImageFallback compact secondaryLabel="" className={`absolute inset-0 ${className}`} />;
    }

    return <ListingImageFallback compact secondaryLabel="" className={className} />;
  }

  const commonProps = {
    src: resolvedSrc,
    alt: alt || 'İlan görseli',
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
