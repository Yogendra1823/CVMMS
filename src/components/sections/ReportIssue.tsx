import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { generateComplaintId } from '../../utils/complaintStatus';
import { FileText, Upload, CheckCircle, AlertCircle } from 'lucide-react';

const ReportIssue: React.FC = () => {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [location, setLocation] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { value: 'public_works', label: 'Public Works' },
    { value: 'parks_recreation', label: 'Parks & Recreation' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'transportation', label: 'Transportation' },
    { value: 'environmental', label: 'Environmental' },
    { value: 'safety', label: 'Public Safety' },
    { value: 'other', label: 'Other' }
  ];

  const priorities = [
    { value: 'Low', label: 'Low - Minor issue' },
    { value: 'Medium', label: 'Medium - Standard issue' },
    { value: 'High', label: 'High - Urgent attention needed' },
    { value: 'Critical', label: 'Critical - Emergency' }
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
    logUserInteraction('report_issue_page_loaded');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a description of the issue.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const complaintId = generateComplaintId();

      await logUserInteraction('complaint_submission_started', {
        complaint_id: complaintId,
        category,
        priority,
        has_location: !!location,
        has_image: !!imageFile
      });

      const { error: insertError } = await supabase
        .from('complaints')
        .insert([
          {
            id: complaintId,
            user_id: user.id,
            description: description.trim(),
            category: category || null,
            priority,
            location: location.trim() || null,
            status: 'Not Yet Started'
          }
        ]);

      if (insertError) throw insertError;

      await logUserInteraction('complaint_submission_success', {
        complaint_id: complaintId,
        category,
        priority
      });

      setSuccess(`Complaint submitted successfully! Your complaint ID is: ${complaintId}. Please save this ID to track your complaint status.`);
      
      // Reset form
      setDescription('');
      setCategory('');
      setPriority('Medium');
      setLocation('');
      setImageFile(null);
    } catch (error: any) {
      await logUserInteraction('complaint_submission_failed', {
        error: error.message,
        category,
        priority
      });
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-blue-100 p-3 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Report an Issue</h1>
            <p className="text-gray-600">Submit a complaint about municipal services</p>
          </div>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority Level *
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {priorities.map(p => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location (Optional)
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Main Street near City Hall, Park Avenue intersection"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Issue Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide detailed information about the issue you're reporting..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
              Attach Image/Video (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition duration-200">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
              <input
                id="image"
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500"
              />
              {imageFile && (
                <p className="mt-2 text-sm text-green-600">
                  Selected: {imageFile.name}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-800 text-white py-3 px-6 rounded-lg hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 font-medium"
          >
            {loading ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• You'll receive a unique complaint ID for tracking</li>
            <li>• Our team will review your complaint within 24 hours</li>
            <li>• You can track the status using the complaint ID</li>
            <li>• You'll be notified of any updates or resolutions</li>
            <li>• All interactions are logged for quality assurance</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReportIssue;