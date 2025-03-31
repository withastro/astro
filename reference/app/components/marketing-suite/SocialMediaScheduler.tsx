'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';

interface SocialPlatform {
  id: string;
  name: 'Twitter' | 'LinkedIn' | 'Facebook' | 'Instagram';
  icon: string;
  enabled: boolean;
}

interface MediaAsset {
  id: string;
  url: string;
  type: 'image' | 'video';
  title?: string;
  alt_text?: string;
  mime_type?: string;
  file_size?: number;
  dimensions?: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
    [key: string]: number | string | undefined;
  };
}

interface SchedulerProps {
  platforms: SocialPlatform[];
  onSchedule: (data: ScheduleData) => void;
}

interface ScheduleData {
  content: string;
  platforms: string[];
  scheduledTime: string;
  media?: MediaAsset[];
}

export const SocialMediaScheduler = ({ platforms, onSchedule }: SchedulerProps) => {
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledTime, setScheduledTime] = useState('');
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [previewPlatform, setPreviewPlatform] = useState<string | null>(null);

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleMediaUpload = async (files: FileList | null) => {
    if (files) {
      const newAssets: MediaAsset[] = await Promise.all(
        Array.from(files).map(async (file) => {
          const url = URL.createObjectURL(file);
          return {
            id: Math.random().toString(36).substr(2, 9),
            url,
            type: file.type.startsWith('image/') ? 'image' : 'video',
            title: file.name,
            alt_text: file.name,
            mime_type: file.type,
            file_size: file.size,
            metadata: {
              lastModified: file.lastModified,
              name: file.name
            }
          };
        })
      );
      setMediaAssets((prev) => [...prev, ...newAssets]);
    }
  };

  const handleSchedule = () => {
    onSchedule({
      content,
      platforms: selectedPlatforms,
      scheduledTime,
      media: mediaAssets,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Social Media Scheduler</h2>
        <div className="flex space-x-2">
          {platforms.map((platform) => (
            <motion.button
              key={platform.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePlatformToggle(platform.id)}
              className={`p-2 rounded-lg ${
                selectedPlatforms.includes(platform.id)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Image
                src={platform.icon}
                alt={platform.name}
                width={24}
                height={24}
                className="w-6 h-6"
              />
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Post Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="What's on your mind?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="schedule-time">
              Schedule Time
            </label>
            <input
              type="datetime-local"
              id="schedule-time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              title="Select date and time for post scheduling"
              placeholder="Select date and time"
              aria-label="Schedule post date and time"
            />
          </div>

          <div>
            <label htmlFor="media-upload" className="block text-sm font-medium text-gray-700 mb-2">
              Media Assets
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                id="media-upload"
                multiple
                accept="image/*,video/*"
                onChange={(e) => handleMediaUpload(e.target.files)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                aria-label="Upload media assets"
              />
              <div className="flex space-x-2">
                {mediaAssets.map((asset) => (
                  <div key={asset.id} className="relative">
                    <Image
                      src={asset.url}
                      alt={asset.alt_text || 'Media preview'}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <button
                      onClick={() => setMediaAssets((prev) => prev.filter((a) => a.id !== asset.id))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      title="Remove media"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSchedule}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
          >
            Schedule Post
          </motion.button>
        </div>

        <div className="border-l pl-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Preview</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex space-x-2 mb-4">
              {selectedPlatforms.map((platformId) => {
                const platform = platforms.find((p) => p.id === platformId);
                return (
                  <button
                    key={platformId}
                    onClick={() => setPreviewPlatform(platformId)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      previewPlatform === platformId
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {platform?.name}
                  </button>
                );
              })}
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="prose max-w-none">
                {content || <span className="text-gray-400">Your post preview will appear here...</span>}
              </div>
              {mediaAssets.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {mediaAssets.map((asset) => (
                    <Image
                      key={asset.id}
                      src={asset.url}
                      alt="Media preview"
                      width={200}
                      height={200}
                      className="rounded-lg object-cover w-full h-32"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 