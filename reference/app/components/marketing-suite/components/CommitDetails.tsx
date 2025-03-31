'use client';

import {
  ChatBubbleLeftIcon,
  CheckIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useState } from 'react';
import CommitFileDiff from './CommitFileDiff';
import CommitStatusBadge from './CommitStatusBadge';
import { CommitDetailsProps } from '../types/CommitTypes';

export default function CommitDetails({
  commit,
  onClose,
  onApprove,
  onReject,
  onComment,
}: CommitDetailsProps) {
  const [comment, setComment] = useState('');

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      onComment?.(comment);
      setComment('');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{commit.title}</h2>
          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
            <span>#{commit.shortHash}</span>
            <span>{format(commit.date, 'MMM d, yyyy HH:mm')}</span>
            <CommitStatusBadge status={commit.status} />
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-500 rounded-full"
          aria-label="Close commit details"
          title="Close commit details"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6">
        <div className="space-y-6">
          {/* Author Information */}
          <div className="flex items-center space-x-3">
            <img
              src={commit.author.avatar}
              alt={commit.author.name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <div className="font-medium text-gray-900">{commit.author.name}</div>
              <div className="text-sm text-gray-500">{commit.author.email}</div>
            </div>
          </div>

          {/* Description */}
          {commit.description && (
            <div className="prose max-w-none text-gray-700">
              {commit.description}
            </div>
          )}

          {/* Branch and Tags */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {commit.branch}
            </span>
            {commit.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 py-4 text-center border-t border-b">
            <div>
              <div className="text-2xl font-semibold text-green-600">
                +{commit.stats.additions}
              </div>
              <div className="text-sm text-gray-500">Additions</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-red-600">
                -{commit.stats.deletions}
              </div>
              <div className="text-sm text-gray-500">Deletions</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">
                {commit.stats.files}
              </div>
              <div className="text-sm text-gray-500">Files Changed</div>
            </div>
          </div>

          {/* Reviewers */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Reviewers</h3>
            <div className="flex flex-wrap gap-3">
              {commit.reviewers.map((reviewer) => (
                <div
                  key={reviewer.id}
                  className="flex items-center space-x-2 bg-gray-50 rounded-full px-3 py-1"
                >
                  <img
                    src={reviewer.avatar}
                    alt={reviewer.name}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {reviewer.name}
                  </span>
                  <CommitStatusBadge status={reviewer.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Changed Files */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Changed Files
            </h3>
            <div className="space-y-2">
              {commit.files.map((file) => (
                <CommitFileDiff key={file.path} file={file} />
              ))}
            </div>
          </div>

          {/* Comment Form */}
          <form onSubmit={handleSubmitComment} className="mt-4">
            <div className="flex items-start space-x-3">
              <div className="flex-grow">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  rows={3}
                />
              </div>
              <button
                type="submit"
                disabled={!comment.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChatBubbleLeftIcon className="w-4 h-4 mr-2" />
                Comment
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50">
        <button
          onClick={onReject}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <XCircleIcon className="w-4 h-4 mr-2" />
          Reject
        </button>
        <button
          onClick={onApprove}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <CheckIcon className="w-4 h-4 mr-2" />
          Approve
        </button>
      </div>
    </div>
  );
} 