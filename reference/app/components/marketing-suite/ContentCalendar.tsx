'use client';

import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { DropResult } from 'react-beautiful-dnd';

interface ContentItem {
  id: string;
  title: string;
  type: 'blog' | 'social' | 'email' | 'video';
  status: 'draft' | 'scheduled' | 'published';
  date: string;
  author: string;
}

interface ContentCalendarProps {
  items: ContentItem[];
  onStatusChange: (itemId: string, newStatus: string) => void;
}

const statusColumns = ['draft', 'scheduled', 'published'];

const typeColors = {
  blog: 'bg-purple-100 text-purple-800',
  social: 'bg-blue-100 text-blue-800',
  email: 'bg-green-100 text-green-800',
  video: 'bg-red-100 text-red-800',
};

export const ContentCalendar = ({ items, onStatusChange }: ContentCalendarProps) => {
  const [contentItems, setContentItems] = useState(items);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const newStatus = destination.droppableId;
    const itemId = result.draggableId;

    const newItems = Array.from(contentItems);
    const [reorderedItem] = newItems.splice(source.index, 1);
    reorderedItem.status = newStatus as 'draft' | 'scheduled' | 'published';
    newItems.splice(destination.index, 0, reorderedItem);

    setContentItems(newItems);
    onStatusChange(itemId, newStatus);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Content Calendar</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
        >
          + New Content
        </motion.button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-3 gap-6">
          {statusColumns.map((status) => (
            <div key={status} className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 capitalize">
                {status}
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({contentItems.filter((item) => item.status === status).length})
                </span>
              </h3>

              <Droppable droppableId={status}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-3 min-h-[200px]"
                  >
                    {contentItems
                      .filter((item) => item.status === status)
                      .map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    typeColors[item.type]
                                  }`}
                                >
                                  {item.type}
                                </span>
                                <span className="text-sm text-gray-500">{item.date}</span>
                              </div>
                              <h4 className="font-medium text-gray-800 mb-2">{item.title}</h4>
                              <div className="flex items-center text-sm text-gray-500">
                                <span className="flex items-center">
                                  <svg
                                    className="w-4 h-4 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                  </svg>
                                  {item.author}
                                </span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}; 