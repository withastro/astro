'use client';

import { motion } from 'framer-motion';
import { LinkedinIcon, TwitterIcon, GlobeIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export interface TeamMemberProps {
  name: string;
  role: string;
  department: string;
  bio: string;
  image: string;
  socials?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  expertise?: string[];
  delay?: number;
}

export function TeamMemberCard({
  name,
  role,
  department,
  bio,
  image,
  socials,
  expertise = [],
  delay = 0
}: TeamMemberProps) {
  return (
    <motion.div
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
    >
      <div className="relative h-64 w-full">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        
        {/* Department Badge */}
        <div className="absolute top-4 left-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {department}
          </span>
        </div>
        
        {/* Social Links */}
        {socials && (
          <div className="absolute top-4 right-4 flex space-x-2">
            {socials.linkedin && (
              <Link href={socials.linkedin} target="_blank" rel="noopener noreferrer" className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors">
                <LinkedinIcon className="h-4 w-4 text-white" />
              </Link>
            )}
            {socials.twitter && (
              <Link href={socials.twitter} target="_blank" rel="noopener noreferrer" className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors">
                <TwitterIcon className="h-4 w-4 text-white" />
              </Link>
            )}
            {socials.website && (
              <Link href={socials.website} target="_blank" rel="noopener noreferrer" className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors">
                <GlobeIcon className="h-4 w-4 text-white" />
              </Link>
            )}
          </div>
        )}
        
        {/* Name and Role */}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h3 className="text-xl font-bold">{name}</h3>
          <p className="text-blue-300">{role}</p>
        </div>
      </div>
      
      <div className="p-6">
        {/* Bio */}
        <p className="text-gray-600 mb-4">{bio}</p>
        
        {/* Expertise Tags */}
        {expertise.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {expertise.map((skill, index) => (
              <span 
                key={index} 
                className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-800"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
} 