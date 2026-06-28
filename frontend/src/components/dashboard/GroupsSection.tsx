import { useNavigate } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui/Card';
import { AvatarGroup } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import type { Group } from '@/types';

interface GroupsSectionProps {
  groups: Group[];
  currentUserId: string;
}

export function GroupsSection({ groups, currentUserId }: GroupsSectionProps) {
  const navigate = useNavigate();

  if (groups.length === 0) {
    return (
      <Card className="p-2">
        <CardHeader title="Your Groups" icon="👥" action={
          <button className="btn-primary text-xs px-3 py-1.5">+ New Group</button>
        } className="p-5" />
        <EmptyState
          icon="🫂"
          title="No groups yet"
          description="Create a group to start splitting expenses with friends, family, or colleagues."
          action={<button className="btn-primary">Create a Group</button>}
        />
      </Card>
    );
  }

  return (
    <Card className="p-2">
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <CardHeader title="Your Groups" subtitle={`${groups.length} active`} icon="👥" />
        <button className="btn-primary text-xs px-3 py-1.5">+ New Group</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 px-3 pb-3">
        {groups.map((group) => {
          const myRole = group.members.find(m => m.userId._id === currentUserId)?.role;
          const memberNames = group.members.map(m => ({
            name: m.userId.name,
            avatarUrl: m.userId.avatarUrl,
          }));

          return (
            <div
              key={group._id}
              onClick={() => navigate(`/groups/${group._id}`)}
              className="group-card"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground text-sm leading-snug">{group.name}</p>
                  <p className="text-xs text-foreground-subtle mt-0.5">
                    {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {myRole === 'owner' && (
                  <Badge variant="accent">Owner</Badge>
                )}
              </div>

              {/* Member Avatars */}
              <AvatarGroup members={memberNames} max={5} size="sm" />

              {/* Footer */}
              <div className="flex items-center justify-between pt-1 border-t border-surface-border">
                <p className="text-xs text-foreground-subtle">
                  Updated {formatDate(group.updatedAt)}
                </p>
                <span className="text-xs text-accent-light font-medium group-hover:underline">
                  View →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
