'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function AboutPage() {
  const teamMembers = [
    {
      name: 'Sarah Johnson',
      role: 'CEO & Founder',
      image: '/team/sarah.jpg',
      bio: 'Visionary leader with 15+ years of experience in digital transformation.'
    },
    {
      name: 'Michael Chen',
      role: 'CTO',
      image: '/team/michael.jpg',
      bio: 'Tech innovator specializing in AI and cloud architecture.'
    },
    {
      name: 'Emma Rodriguez',
      role: 'Creative Director',
      image: '/team/emma.jpg',
      bio: 'Award-winning designer with a passion for user-centric experiences.'
    },
    {
      name: 'David Kim',
      role: 'Head of Data Analytics',
      image: '/team/david.jpg',
      bio: 'Data scientist turning complex information into actionable insights.'
    }
  ];

  const values = [
    {
      title: 'Innovation',
      description: 'Pushing boundaries with cutting-edge solutions',
      icon: '💡'
    },
    {
      title: 'Excellence',
      description: 'Delivering outstanding quality in everything we do',
      icon: '⭐'
    },
    {
      title: 'Collaboration',
      description: 'Working together to achieve exceptional results',
      icon: '🤝'
    },
    {
      title: 'Integrity',
      description: 'Building trust through honest and ethical practices',
      icon: '🎯'
    }
  ];

  return (
    <main className="min-h-screen py-20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h1 className="text-5xl font-bold mb-6">Our Story</h1>
          <p className="text-xl text-gray-600">
            We're a team of passionate innovators dedicated to transforming businesses
            through cutting-edge technology and creative solutions. Our journey began
            with a simple vision: to make digital excellence accessible to all.
          </p>
        </motion.div>
      </section>

      {/* Values Section */}
      <section className="bg-gray-50 py-20 mb-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6 text-center"
              >
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-16">Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="relative h-64 w-full">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{member.name}</h3>
                <p className="text-indigo-600 mb-3">{member.role}</p>
                <p className="text-gray-600">{member.bio}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
} 