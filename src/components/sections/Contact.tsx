import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Phone, MapPin, Clock, Globe, Send, CheckCircle, AlertCircle } from 'lucide-react';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    phone: '',
    department: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contactInfo = [
    {
      icon: Mail,
      label: 'Email',
      value: 'support@citizenvoicemms.org',
      description: 'For general inquiries and support'
    },
    {
      icon: Phone,
      label: 'Phone',
      value: '+1 (555) 123-4567',
      description: 'Available during business hours'
    },
    {
      icon: MapPin,
      label: 'Address',
      value: '123 Municipal Plaza, City Hall',
      description: 'Visit us in person for assistance'
    },
    {
      icon: Clock,
      label: 'Business Hours',
      value: 'Mon-Fri: 8:00 AM - 6:00 PM',
      description: 'Weekend emergency services available'
    }
  ];

  const departments = [
    { value: 'public_works', label: 'Public Works', description: 'Road maintenance, utilities, infrastructure' },
    { value: 'parks_recreation', label: 'Parks & Recreation', description: 'Parks, recreational facilities, events' },
    { value: 'planning_development', label: 'Planning & Development', description: 'Building permits, zoning, development' },
    { value: 'environmental', label: 'Environmental Services', description: 'Waste management, recycling, environmental concerns' },
    { value: 'general', label: 'General Inquiry', description: 'Other questions or concerns' }
  ];

  // Log user interaction
  const logUserInteraction = async (action: string, details: any = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('user_interactions')
        .insert([
          {
            user_id: user?.id || null,
            action,
            details: {
              ...details,
              timestamp: new Date().toISOString(),
              user_agent: navigator.userAgent,
              url: window.location.href
            },
            created_at: new Date().toISOString()
          }
        ]);
    } catch (error) {
      console.error('Failed to log user interaction:', error);
    }
  };

  React.useEffect(() => {
    logUserInteraction('contact_page_loaded');
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser();

      await logUserInteraction('contact_form_submission_started', {
        department: formData.department,
        has_phone: !!formData.phone,
        subject_length: formData.subject.length,
        message_length: formData.message.length
      });

      const { error: insertError } = await supabase
        .from('contact_messages')
        .insert([
          {
            user_id: user?.id || null,
            name: formData.name.trim(),
            email: formData.email.trim(),
            subject: formData.subject.trim(),
            message: formData.message.trim(),
            phone: formData.phone.trim() || null,
            department: formData.department || null
          }
        ]);

      if (insertError) throw insertError;

      await logUserInteraction('contact_form_submission_success', {
        department: formData.department
      });

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        phone: '',
        department: ''
      });

      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (error: any) {
      await logUserInteraction('contact_form_submission_failed', {
        error: error.message,
        department: formData.department
      });
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Contact CitizenVoiceMMS</h1>
        <p className="text-lg text-gray-600">
          Get in touch with us for support, questions, or additional information
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        {/* Contact Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Send us a Message</h2>
              <p className="text-gray-600">We'll get back to you as soon as possible</p>
            </div>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800">
                Thank you for your message! We'll respond within 24 hours.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a department</option>
                  {departments.map(dept => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                required
                value={formData.subject}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of your inquiry"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                value={formData.message}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Please provide detailed information about your inquiry..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-800 text-white py-3 px-6 rounded-lg hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 font-medium"
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>

        {/* Contact Information */}
        <div className="space-y-6">
          {contactInfo.map(({ icon: Icon, label, value, description }, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition duration-300">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{label}</h3>
                  <p className="text-lg text-blue-600 font-medium mb-1">{value}</p>
                  <p className="text-sm text-gray-600">{description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Department Contacts</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.slice(0, -1).map(({ value, label, description }, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition duration-200">
              <h3 className="font-semibold text-gray-900 mb-2">{label}</h3>
              <p className="text-blue-600 font-medium mb-2">{label.toLowerCase().replace(/\s+/g, '')}@citizenvoicemms.org</p>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-xl p-8 text-white">
        <div className="text-center">
          <Globe className="w-12 h-12 mx-auto mb-4 text-blue-200" />
          <h2 className="text-2xl font-bold mb-4">24/7 Online Services</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            While our offices operate during business hours, CitizenVoiceMMS is available 
            24/7 for submitting complaints, tracking issues, and providing feedback.
          </p>
          <div className="bg-white bg-opacity-20 rounded-lg p-4 inline-block">
            <p className="font-semibold">Emergency Services: 911</p>
            <p className="text-sm text-blue-100 mt-1">For urgent municipal emergencies only</p>
          </div>
          <div className="mt-4 text-sm text-blue-100">
            <p>All interactions are logged for quality assurance and transparency</p>
            <p className="mt-2">Visit us at: <a href="https://citizenvoicemms.netlify.app" className="underline hover:text-white transition duration-200">citizenvoicemms.netlify.app</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;