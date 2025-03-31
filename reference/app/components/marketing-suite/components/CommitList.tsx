'use client';

import { format } from 'date-fns';
import { useState } from 'react';
import CommitDetails from './CommitDetails';
import CommitStatusBadge from './CommitStatusBadge';
import { CommitListProps } from '../types/CommitTypes';

export default function CommitList({
  commits,
  onCommitSelect,
  onCommitApprove,
  onCommitReject,
  onCommitComment,
}: CommitListProps) {
  const [selectedCommitId, setSelectedCommitId] = useState<string | null>(null);

  const selectedCommit = commits.find((c) => c.id === selectedCommitId);

  const handleCommitClick = (commitId: string) => {
    setSelectedCommitId(commitId);
    const commit = commits.find((c) => c.id === commitId);
    if (commit) {
      onCommitSelect?.(commit);
    }
  };

  const handleApprove = () => {
    if (selectedCommitId) {
      onCommitApprove?.(selectedCommitId);
      setSelectedCommitId(null);
    }
  };

  const handleReject = () => {
    if (selectedCommitId) {
      onCommitReject?.(selectedCommitId);
      setSelectedCommitId(null);
    }
  };

  const handleComment = (comment: string) => {
    if (selectedCommitId) {
      onCommitComment?.(selectedCommitId, comment);
    }
  };

  return (
    <div className="space-y-4">
      {/* Commit List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Recent Commits</h2>
        </div>

        <div className="divide-y">
          {commits.map((commit) => (
            <button
              key={commit.id}
              onClick={() => handleCommitClick(commit.id)}
              className={`w-full px-6 py-4 flex items-start hover:bg-gray-50 focus:outline-none focus:bg-gray-50 ${
                selectedCommitId === commit.id ? 'bg-gray-50' : ''
              }`}
            >
              <img
                src={commit.author.avatar}
                alt={commit.author.name}
                className="w-8 h-8 rounded-full"
              />
              <div className="ml-4 flex-grow text-left">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">
                    {commit.title}
                  </h3>
                  <CommitStatusBadge status={commit.status} />
                </div>
                <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                  <span>by {commit.author.name}</span>
                  <span>#{commit.shortHash}</span>
                  <span>{format(commit.date, 'MMM d, yyyy HH:mm')}</span>
                </div>
                {commit.description && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {commit.description}
                  </p>
                )}
                <div className="mt-2 flex items-center space-x-4 text-xs">
                  <span className="text-green-600">+{commit.stats.additions}</span>
                  <span className="text-red-600">-{commit.stats.deletions}</span>
                  <span className="text-gray-500">
                    {commit.stats.files} files changed
                  </span>
                </div>
              </div>
            </button>
          ))}

          {commits.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500">
              No commits found.
            </div>
          )}
        </div>
      </div>

      {/* Commit Details Modal */}
      {selectedCommit && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setSelectedCommitId(null)}
            />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <CommitDetails
                commit={selectedCommit}
                onClose={() => setSelectedCommitId(null)}
                onApprove={handleApprove}
                onReject={handleReject}
                onComment={handleComment}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 