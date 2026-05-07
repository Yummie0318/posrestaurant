import Image from 'next/image';

type ProductImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
};

export function ProductImage({ src, alt, className = '', sizes = '(max-width: 768px) 100vw, 280px' }: ProductImageProps) {
  const resolvedSrc = src?.trim() ? src : '/products/placeholder-product.svg';

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      <Image
        src={resolvedSrc}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover transition duration-500 group-hover:scale-105"
        unoptimized={resolvedSrc.endsWith('.svg') || resolvedSrc.startsWith('/api/drive-files/')}
      />
    </div>
  );
}
