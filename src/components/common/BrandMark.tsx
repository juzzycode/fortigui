import { cn } from '@/lib/utils';

export const BrandMark = ({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClass = {
    sm: 'h-7 w-7 rounded-xl',
    md: 'h-10 w-10 rounded-2xl',
    lg: 'h-14 w-14 rounded-[22px]',
  }[size];

  return (
    <img
      alt="EdgeOps Cloud"
      className={cn(sizeClass, 'shrink-0 shadow-[0_0_24px_rgba(45,212,191,0.28)] ring-1 ring-white/10', className)}
      src="/favicon.svg"
    />
  );
};
