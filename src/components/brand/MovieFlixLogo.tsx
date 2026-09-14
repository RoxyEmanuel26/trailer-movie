import { cn } from '@/lib/utils';

type MovieFlixMarkProps = {
  className?: string;
  decorative?: boolean;
};

export function MovieFlixMark({ className, decorative = true }: MovieFlixMarkProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn('shrink-0', className)}
      aria-hidden={decorative || undefined}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : 'MovieFlix'}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="currentColor"
        d="M9.25 2.75h6.1c1.47 0 2.9.43 4.11 1.24l15.02 10.08a7.14 7.14 0 0 1 0 11.86L19.46 36.01a7.38 7.38 0 0 1-4.11 1.24h-6.1A6.5 6.5 0 0 1 2.75 30.75V9.25a6.5 6.5 0 0 1 6.5-6.5Z"
      />
      <path
        fill="#fffaf5"
        d="m17.04 11.78 11.3 7.15a1.27 1.27 0 0 1 0 2.14l-11.3 7.15A1.32 1.32 0 0 1 15 27.1V12.9a1.32 1.32 0 0 1 2.04-1.12Z"
      />
      <rect x="7" y="8" width="4" height="5" rx="1.25" fill="#fffaf5" />
      <rect x="7" y="17.5" width="4" height="5" rx="1.25" fill="#fffaf5" />
      <rect x="7" y="27" width="4" height="5" rx="1.25" fill="#fffaf5" />
    </svg>
  );
}

type MovieFlixLogoProps = {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
};

export function MovieFlixLogo({ className, markClassName, wordmarkClassName }: MovieFlixLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <MovieFlixMark className={cn('h-9 w-9 text-primary', markClassName)} />
      <span className={cn('font-semibold tracking-[-0.04em]', wordmarkClassName)}>MovieFlix</span>
    </span>
  );
}
