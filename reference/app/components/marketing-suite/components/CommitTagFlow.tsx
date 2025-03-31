'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import CommitTagBubble from './CommitTagBubble';
import { CommitTagFlowProps } from '../types/CommitTagTypes';

export default function CommitTagFlow({
  taggedCommits,
  selectedTag,
  onTagSelect,
}: CommitTagFlowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Update dimensions on mount and window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Group tags by category
  const tagsByCategory = taggedCommits.reduce((acc, commit) => {
    commit.tagDetails.forEach(tag => {
      if (!acc[tag.category]) {
        acc[tag.category] = [];
      }
      if (!acc[tag.category].find(t => t.name === tag.name)) {
        acc[tag.category].push(tag);
      }
    });
    return acc;
  }, {} as Record<string, typeof taggedCommits[0]['tagDetails']>);

  // Calculate positions for each category
  const calculatePositions = () => {
    const positions: Record<string, { x: number; y: number }[]> = {};
    const categories = Object.keys(tagsByCategory);
    const categoryHeight = dimensions.height / categories.length;

    categories.forEach((category, categoryIndex) => {
      const tags = tagsByCategory[category];
      const tagWidth = dimensions.width / (tags.length + 1);

      positions[category] = tags.map((_, index) => ({
        x: tagWidth * (index + 1),
        y: categoryHeight * (categoryIndex + 0.5),
      }));
    });

    return positions;
  };

  const positions = calculatePositions();

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[400px] bg-gray-50 rounded-xl overflow-hidden"
    >
      {/* Category Labels */}
      <div className="absolute left-4 top-0 h-full flex flex-col justify-around">
        {Object.keys(tagsByCategory).map((category) => (
          <div
            key={category}
            className="text-sm font-medium text-gray-500 capitalize"
          >
            {category}
          </div>
        ))}
      </div>

      {/* Tag Bubbles */}
      <AnimatePresence>
        {Object.entries(tagsByCategory).map(([category, tags]) =>
          tags.map((tag, index) => (
            <motion.div
              key={`${category}-${tag.name}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: positions[category]?.[index]?.x,
                y: positions[category]?.[index]?.y,
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 20,
                delay: index * 0.1,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
            >
              <CommitTagBubble
                tag={tag}
                isSelected={selectedTag === tag.name}
                onClick={() => onTagSelect?.(tag.name)}
              />
            </motion.div>
          ))
        )}
      </AnimatePresence>

      {/* Connection Lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: -1 }}
      >
        {Object.entries(tagsByCategory).map(([category, tags]) =>
          tags.map((tag, index) => {
            const position = positions[category]?.[index];
            if (!position) return null;

            // Find connected tags (tags from the same commits)
            const connectedTags = taggedCommits
              .filter(commit =>
                commit.tagDetails.some(t => t.name === tag.name)
              )
              .flatMap(commit => commit.tagDetails)
              .filter(t => t.name !== tag.name);

            return connectedTags.map(connectedTag => {
              const connectedCategory = Object.entries(tagsByCategory).find(
                ([_, tags]) => tags.some(t => t.name === connectedTag.name)
              )?.[0];
              if (!connectedCategory) return null;

              const connectedIndex = tagsByCategory[connectedCategory].findIndex(
                t => t.name === connectedTag.name
              );
              const connectedPosition = positions[connectedCategory]?.[connectedIndex];
              if (!connectedPosition) return null;

              return (
                <motion.path
                  key={`${tag.name}-${connectedTag.name}`}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.2 }}
                  exit={{ pathLength: 0, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  d={`M ${position.x} ${position.y} C ${position.x} ${connectedPosition.y}, ${connectedPosition.x} ${position.y}, ${connectedPosition.x} ${connectedPosition.y}`}
                  stroke={tag.color}
                  strokeWidth="1"
                  fill="none"
                />
              );
            });
          })
        )}
      </svg>
    </div>
  );
} 