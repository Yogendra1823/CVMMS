import React from 'react';
import { FileText, Search, MessageCircle, CheckCircle } from 'lucide-react';
import { AppSection } from '../../types';

interface HomeProps {
  onSectionChange?: (section: AppSection) => void;
}

const Home: React.FC<HomeProps> = ({ onSectionChange }) => {
  const features = [
    {
      icon: FileText,
      title: 'Report Issues',
      description: 'Submit complaints about municipal services and infrastructure problems.',
      color: 'bg-blue-100 text-blue-600',
      section: 'report' as AppSection
    },
    {
      icon: Search,
      title: 'Track Complaints',
      description: 'Monitor the status of your submitted complaints in real-time.',
      color: 'bg-green-100 text-green-600',
      section: 'track' as AppSection
    },
    {
      icon: MessageCircle,
      title: 'Provide Feedback',
      description: 'Share your thoughts and suggestions to improve municipal services.',
      color: 'bg-purple-100 text-purple-600',
      section: 'feedback' as AppSection
    },
    {
      icon: CheckCircle,
      title: 'Quick Resolution',
      description: 'Get faster responses and resolutions for your municipal concerns.',
      color: 'bg-orange-100 text-orange-600',
      section: 'contact' as AppSection
    }
  ];

  const handleFeatureClick = (section: AppSection) => {
    if (onSectionChange) {
      onSectionChange(section);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to CitizenVoiceMMS Municipal Management System
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Your gateway to efficient municipal services. Report issues, track complaints, 
          and provide feedback to help improve your community.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {features.map(({ icon: Icon, title, description, color, section }, index) => (
          <button
            key={index}
            onClick={() => handleFeatureClick(section)}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition duration-300 text-left w-full group cursor-pointer transform hover:scale-105"
          >
            <div className={`${color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition duration-300`}>
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition duration-300">{title}</h3>
            <p className="text-gray-600 text-sm">{description}</p>
            <div className="mt-4 text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition duration-300">
              Click to access →
            </div>
          </button>
        ))}
      </div>

      <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-4">CitizenVoiceMMS - Making Municipal Services More Accessible</h2>
        <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
          Our system streamlines communication between citizens and municipal authorities, 
          ensuring your voice is heard and your concerns are addressed promptly.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">24/7</div>
            <div className="text-blue-100">Available Service</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">Fast</div>
            <div className="text-blue-100">Response Time</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">100%</div>
            <div className="text-blue-100">Transparent Process</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;