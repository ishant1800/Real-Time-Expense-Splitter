interface ProgressBarProps {
  value: number; // 0–100
  color?: string;
  className?: string;
  height?: string;
  animated?: boolean;
}

export function ProgressBar({
  value,
  color = 'bg-gradient-accent',
  className = '',
  height = 'h-1.5',
  animated = false,
}: ProgressBarProps) {
  return (
    <div className={`w-full bg-surface-elevated rounded-full overflow-hidden ${height} ${className}`}>
      <div
        className={`${height} rounded-full transition-all duration-700 ease-out ${color} ${animated ? 'animate-pulse-slow' : ''}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
