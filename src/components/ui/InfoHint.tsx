import { Info } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';

interface InfoHintProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  iconClassName?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

/**
 * Small contextual hint icon. Click/hover reveals an explanation
 * styled to match the desert/board-game theme.
 */
export function InfoHint({
  title,
  children,
  className,
  iconClassName,
  side = 'top',
}: InfoHintProps) {
  return (
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          aria-label={title || 'Mais informações'}
          className={cn(
            'inline-flex items-center justify-center rounded-full',
            'text-muted-foreground/70 hover:text-primary transition-colors',
            'focus:outline-none focus-visible:ring-1 focus-visible:ring-primary',
            className,
          )}
        >
          <Info className={cn('w-3.5 h-3.5', iconClassName)} />
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side={side}
        align="center"
        className="w-72 border-glow bg-popover/95 backdrop-blur-sm text-xs font-body leading-relaxed space-y-1.5"
      >
        {title && (
          <p className="text-display text-primary text-[11px] tracking-wider">
            {title}
          </p>
        )}
        <div className="text-foreground/90 space-y-1.5">{children}</div>
      </HoverCardContent>
    </HoverCard>
  );
}
