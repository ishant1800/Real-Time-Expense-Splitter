import { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import type { Group, GroupMember } from '@/types';

interface MembersPanelProps {
  group: Group;
  currentUserId: string;
  onRemoveMember?: (userId: string) => void;
  isRemoving?: boolean;
}

export function MembersPanel({
  group,
  currentUserId,
  onRemoveMember,
  isRemoving,
}: MembersPanelProps) {
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const myRole = group.members.find(m => m.userId._id === currentUserId)?.role;
  const isOwner = myRole === 'owner';

  const handleRemove = (member: GroupMember) => {
    if (confirmRemove === member.userId._id) {
      onRemoveMember?.(member.userId._id);
      setConfirmRemove(null);
    } else {
      setConfirmRemove(member.userId._id);
      setTimeout(() => setConfirmRemove(null), 3000);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-5">
        <CardHeader
          title="Members"
          subtitle={`${group.members.length} people`}
          icon="👥"
        />
        {/* Invite Code chip */}
        <div className="flex items-center gap-1.5 bg-surface-elevated border border-surface-border rounded-xl px-3 py-1.5">
          <span className="text-xs text-foreground-subtle">Code:</span>
          <span
            id="invite-code"
            className="text-xs font-mono font-bold text-accent-light tracking-widest cursor-pointer hover:text-accent transition-colors"
            onClick={() => navigator.clipboard.writeText(group.inviteCode)}
            title="Click to copy"
          >
            {group.inviteCode}
          </span>
          <span className="text-xs">📋</span>
        </div>
      </div>

      <div className="space-y-2">
        {group.members.map((member) => {
          const isMe = member.userId._id === currentUserId;
          const canRemove = isOwner && !isMe && member.role !== 'owner';

          return (
            <div
              key={member.userId._id}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-elevated transition-colors group"
            >
              <Avatar name={member.userId.name} src={member.userId.avatarUrl} size="md" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {member.userId.name}
                    {isMe && <span className="text-foreground-subtle font-normal"> (You)</span>}
                  </p>
                </div>
                <p className="text-xs text-foreground-subtle truncate">{member.userId.email}</p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={member.role === 'owner' ? 'accent' : 'neutral'}>
                  {member.role === 'owner' ? '👑 Owner' : 'Member'}
                </Badge>

                {canRemove && (
                  <button
                    onClick={() => handleRemove(member)}
                    disabled={isRemoving}
                    className={`
                      text-xs px-2.5 py-1 rounded-lg transition-all font-medium
                      ${confirmRemove === member.userId._id
                        ? 'bg-danger/20 text-danger border border-danger/30 animate-pulse'
                        : 'opacity-0 group-hover:opacity-100 text-foreground-subtle hover:text-danger hover:bg-danger/10'}
                    `}
                  >
                    {confirmRemove === member.userId._id ? 'Confirm?' : 'Remove'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
