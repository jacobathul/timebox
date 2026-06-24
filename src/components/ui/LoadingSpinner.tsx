interface Props {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };

export function LoadingSpinner({ size = 'md', className = '' }: Props) {
  return (
    <div
      className={`${SIZE[size]} border-2 border-stone-200 border-t-accent-500 rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
