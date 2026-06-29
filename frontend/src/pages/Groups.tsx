import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { groupApi } from '../services/groupApi';
import { groupKeys } from '../hooks/useGroupQueries';
import { useAuthStore } from '../store/useAuthStore';
import { Card } from '../components/ui/Card';
import { AvatarGroup } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { CardSkeleton } from '../components/ui/Skeleton';
import { formatDate } from '../lib/utils';

export default function Groups() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const joinCode = searchParams.get('join');
    if (joinCode) {
      setInviteCode(joinCode);
      setIsJoinOpen(true);
    }
  }, [searchParams]);

  // ─── Queries & Mutations ───────────────────────────────────────────────────
  const { data: apiGroups, isLoading } = useQuery({
    queryKey: groupKeys.all,
    queryFn: () => groupApi.listGroups(),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => groupApi.createGroup(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
      setIsCreateOpen(false);
      setGroupName('');
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to create group');
    },
  });

  const joinMutation = useMutation({
    mutationFn: (code: string) => groupApi.joinGroup(code),
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
      setIsJoinOpen(false);
      setInviteCode('');
      navigate(`/groups/${newGroup._id}`);
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to join group');
    },
  });

  // Get live groups only
  const groups = apiGroups ?? [];
  const currentUserId = currentUser?._id || '';

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    setErrorMessage('');
    createMutation.mutate(groupName);
  };

  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setErrorMessage('');
    joinMutation.mutate(inviteCode);
  };

  const inputCls =
    'w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all';

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Groups</h1>
          <p className="text-sm text-foreground-subtle mt-1">
            Manage your shared expenses with custom groups
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsJoinOpen(true)}
            className="btn-ghost border border-surface-border"
          >
            Join Group
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn-primary"
          >
            + Create Group
          </button>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton rows={3} />
          <CardSkeleton rows={3} />
          <CardSkeleton rows={3} />
        </div>
      ) : groups.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon="👥"
            title="No groups found"
            description="Create a new group or enter an invite code to join an existing group."
            action={
              <div className="flex items-center gap-3">
                <button onClick={() => setIsJoinOpen(true)} className="btn-ghost border border-surface-border">
                  Join Group
                </button>
                <button onClick={() => setIsCreateOpen(true)} className="btn-primary">
                  Create Group
                </button>
              </div>
            }
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => {
            const myRole = group.members.find((m) => m.userId._id === currentUserId)?.role;
            const memberNames = group.members.map((m) => ({
              name: m.userId.name,
              avatarUrl: m.userId.avatarUrl,
            }));

            return (
              <div
                key={group._id}
                onClick={() => navigate(`/groups/${group._id}`)}
                className="group-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground text-base leading-snug group-hover:text-accent-light transition-colors">
                      {group.name}
                    </h3>
                    <p className="text-xs text-foreground-subtle mt-0.5">
                      {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {myRole === 'owner' && <Badge variant="accent">Owner</Badge>}
                </div>

                <AvatarGroup members={memberNames} max={5} size="sm" />

                <div className="flex items-center justify-between pt-2 border-t border-surface-border">
                  <p className="text-xs text-foreground-subtle">
                    Updated {formatDate(group.updatedAt)}
                  </p>
                  <span className="text-xs text-accent-light font-medium group-hover:underline">
                    View Board →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Group Modal ────────────────────────────────────────────── */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setGroupName('');
          setErrorMessage('');
        }}
        title="Create Group"
        subtitle="Start a new shared expense space"
        footer={
          <>
            <button
              onClick={() => setIsCreateOpen(false)}
              className="btn-ghost border border-surface-border"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateGroup}
              disabled={createMutation.isPending || !groupName.trim()}
              className="btn-primary"
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateGroup} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger animate-fade-in">
              {errorMessage}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground-muted">Group Name</label>
            <input
              type="text"
              placeholder="e.g. Barcelona Trip, Housemates"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className={inputCls}
              autoFocus
            />
          </div>
        </form>
      </Modal>

      {/* ── Join Group Modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={isJoinOpen}
        onClose={() => {
          setIsJoinOpen(false);
          setInviteCode('');
          setErrorMessage('');
        }}
        title="Join Group"
        subtitle="Enter an invite code to join a group"
        footer={
          <>
            <button
              onClick={() => setIsJoinOpen(false)}
              className="btn-ghost border border-surface-border"
            >
              Cancel
            </button>
            <button
              onClick={handleJoinGroup}
              disabled={joinMutation.isPending || !inviteCode.trim()}
              className="btn-primary"
            >
              {joinMutation.isPending ? 'Joining...' : 'Join'}
            </button>
          </>
        }
      >
        <form onSubmit={handleJoinGroup} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger animate-fade-in">
              {errorMessage}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground-muted">Invite Code</label>
            <input
              type="text"
              placeholder="e.g. BAR-2024"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all font-mono tracking-wider uppercase"
              autoFocus
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
