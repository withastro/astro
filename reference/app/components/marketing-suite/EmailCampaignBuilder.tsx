'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';

interface EmailTemplate {
  id: string;
  name: string;
  thumbnail: string;
  category: 'newsletter' | 'promotion' | 'announcement' | 'welcome';
}

interface EmailSegment {
  id: string;
  name: string;
  subscriberCount: number;
}

interface EmailCampaignBuilderProps {
  templates: EmailTemplate[];
  segments: EmailSegment[];
  onSave: (campaign: EmailCampaign) => void;
}

interface EmailCampaign {
  name: string;
  subject: string;
  template: string;
  segments: string[];
  content: string;
  scheduledTime?: string;
}

type Step = 'details' | 'template' | 'content' | 'preview';

export const EmailCampaignBuilder = ({
  templates,
  segments,
  onSave,
}: EmailCampaignBuilderProps) => {
  const [campaign, setCampaign] = useState<EmailCampaign>({
    name: '',
    subject: '',
    template: '',
    segments: [],
    content: '',
  });
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [step, setStep] = useState<Step>('details');

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setCampaign((prev) => ({ ...prev, template: template.id }));
  };

  const handleSegmentToggle = (segmentId: string) => {
    setCampaign((prev) => ({
      ...prev,
      segments: prev.segments.includes(segmentId)
        ? prev.segments.filter((id) => id !== segmentId)
        : [...prev.segments, segmentId],
    }));
  };

  const handleSave = () => {
    onSave(campaign);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Email Campaign Builder</h2>
          <p className="text-gray-500">Create and customize your email campaign</p>
        </div>
        <div className="flex space-x-2">
          {['details', 'template', 'content', 'preview'].map((s) => (
            <motion.button
              key={s}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStep(s as Step)}
              className={`px-4 py-2 rounded-lg font-medium ${
                step === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {step === 'details' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Name
              </label>
              <input
                type="text"
                value={campaign.name}
                onChange={(e) => setCampaign((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter campaign name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Subject
              </label>
              <input
                type="text"
                value={campaign.subject}
                onChange={(e) => setCampaign((prev) => ({ ...prev, subject: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email subject"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Segments
              </label>
              <div className="grid grid-cols-2 gap-3">
                {segments.map((segment) => (
                  <button
                    key={segment.id}
                    onClick={() => handleSegmentToggle(segment.id)}
                    className={`p-3 rounded-lg border ${
                      campaign.segments.includes(segment.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-800">{segment.name}</div>
                    <div className="text-sm text-gray-500">
                      {segment.subscriberCount.toLocaleString()} subscribers
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'template' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {templates.map((template) => (
                <motion.button
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleTemplateSelect(template)}
                  className={`p-4 rounded-lg border ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 ring-2 ring-blue-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Image
                    src={template.thumbnail}
                    alt={template.name}
                    width={300}
                    height={200}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                  <div className="font-medium text-gray-800">{template.name}</div>
                  <div className="text-sm text-gray-500 capitalize">{template.category}</div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {step === 'content' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Content
              </label>
              <textarea
                value={campaign.content}
                onChange={(e) => setCampaign((prev) => ({ ...prev, content: e.target.value }))}
                className="w-full h-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email content here..."
              />
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-bold mb-4">{campaign.subject || 'Email Subject'}</h3>
                <div className="prose max-w-none">
                  {campaign.content || 'Your email content will appear here...'}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCampaign((prev) => ({ ...prev, scheduledTime: new Date().toISOString() }))}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium"
              >
                Schedule
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
              >
                Save Campaign
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 