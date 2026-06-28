import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const colorMap = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-pink-500 to-rose-600',
  'from-indigo-500 to-blue-600',
];

function getColor(name: string): string {
  const idx = name.charCodeAt(0) % colorMap.length;
  return colorMap[idx];
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover ring-2 ring-surface-border', sizeMap[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold bg-gradient-to-br ring-2 ring-surface-border shrink-0',
        sizeMap[size],
        `bg-gradient-to-br ${getColor(name)}`,
        className,
      )}
    >
      <span className="text-white">{getInitials(name)}</span>
    </div>
  );
}

interface AvatarGroupProps {
  members: Array<{ name: string; avatarUrl?: string }>;
  max?: number;
  size?: AvatarProps['size'];
}

export function AvatarGroup({ members, max = 4, size = 'sm' }: AvatarGroupProps) {
  const shown = members.slice(0, max);
  const remaining = members.length - max;

  return (
    <div className="flex items-center -space-x-2">
      {shown.map((m, i) => (
        <div key={i} style={{ zIndex: shown.length - i }}>
          <Avatar name={m.name} src={m.avatarUrl} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-bold bg-surface-elevated ring-2 ring-surface-border text-foreground-muted',
            sizeMap[size],
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
