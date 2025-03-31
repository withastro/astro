export interface Commit {
  id: string;
  hash: string;
  shortHash: string;
  title: string;
  description: string;
  author: {
    name: string;
    email: string;
    avatar: string;
  };
  date: Date;
  branch: string;
  tags: string[];
  stats: {
    additions: number;
    deletions: number;
    files: number;
  };
  status: 'pending' | 'approved' | 'rejected' | 'needs-review';
  reviewers: {
    id: string;
    name: string;
    avatar: string;
    status: 'pending' | 'approved' | 'rejected';
  }[];
  files: {
    path: string;
    status: 'added' | 'modified' | 'deleted';
    additions: number;
    deletions: number;
    diff?: string;
  }[];
}

export interface CommitListProps {
  commits: Commit[];
  onCommitSelect?: (commit: Commit) => void;
  onCommitApprove?: (commitId: string) => void;
  onCommitReject?: (commitId: string) => void;
  onCommitComment?: (commitId: string, comment: string) => void;
}

export interface CommitDetailsProps {
  commit: Commit;
  onClose?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onComment?: (comment: string) => void;
}

export interface CommitFileDiffProps {
  file: Commit['files'][0];
  expanded?: boolean;
  onToggleExpand?: () => void;
}

export interface CommitStatusBadgeProps {
  status: Commit['status'];
  className?: string;
} 