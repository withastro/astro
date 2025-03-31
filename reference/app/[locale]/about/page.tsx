'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { use } from 'react';

export default function AboutPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = use(params);

  const teamMembers = [
    {
      name: 'John Doe',
      role: 'CEO & Founder',
      image: '/team/john-doe.jpg',
      bio: 'Visionary leader with 15+ years of experience in tech innovation.'
    },
    {
      name: 'Jane Smith',
      role: 'CTO',
      image: '/team/jane-smith.jpg',
      bio: 'Tech expert specializing in AI and cloud architecture.'
    },
    {
      name: 'Mike Johnson',
      role: 'Creative Director',
      image: '/team/mike-johnson.jpg',
      bio: 'Award-winning designer with a passion for user experience.'
    },
    {
      name: 'Sarah Williams',
      role: 'Head of Operations',
      image: '/team/sarah-williams.jpg',
      bio: 'Operations specialist focused on scaling businesses efficiently.'
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
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About Us</h1>
          <p className="text-xl text-gray-600">
            We're a team of passionate individuals dedicated to transforming businesses
            through innovative digital solutions.
          </p>
        </motion.div>
      </section>

      {/* Mission Section */}
      <section className="bg-gray-50 py-20 mb-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-gray-600 mb-4">
                To empower businesses with cutting-edge technology solutions that drive
                growth and innovation in the digital age.
              </p>
              <p className="text-gray-600">
                We believe in creating lasting partnerships with our clients, understanding
                their unique challenges, and delivering solutions that exceed expectations.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative h-[400px]"
            >
              <Image
                src="/about/mission.jpg"
                alt="Our mission"
                fill
                className="object-cover rounded-lg"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6 text-center"
            >
              <div className="relative w-32 h-32 mx-auto mb-4">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover rounded-full"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2">{member.name}</h3>
              <p className="text-indigo-600 mb-3">{member.role}</p>
              <p className="text-gray-600">{member.bio}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
} 