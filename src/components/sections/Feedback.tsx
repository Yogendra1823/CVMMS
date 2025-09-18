import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { MessageCircle, CheckCircle, AlertCircle, Star } from 'lucide-react';

const Feedback: React.FC = () => {
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { value: 'service_quality', label: 'Service Quality' },
    { value: 'website_usability', label: 'Website Usability' },
    { value: 'response_time', label: 'Response Time' },
    { value: 'staff_behavior', label: 'Staff Behavior' },
    { value: 'suggestion', label: 'Suggestion' },
    { value: 'complaint_process', label: 'Complaint Process' },
    { value: 'general', label: 'General Feedback' }
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
    logUserInteraction('feedback_page_loaded');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please enter your feedback message.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      await logUserInteraction('feedback_submission_started', {
        category,
        rating,
        is_anonymous: isAnonymous,
        message_length: message.length
      });

      const { error: insertError } = await supabase
        .from('feedback')
        .insert([
          {
            user_id: user.id,
            message: message.trim(),
            category: category || null,
            rating: rating,
            is_anonymous: isAnonymous
          }
        ]);

      if (insertError) throw insertError;

      await logUserInteraction('feedback_submission_success', {
        category,
        rating,
        is_anonymous: isAnonymous
      });

      setSuccess(true);
      setMessage('');
      setCategory('');
      setRating(null);
      setIsAnonymous(false);
      
      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (error: any) {
      await logUserInteraction('feedback_submission_failed', {
        error: error.message,
        category,
        rating
      });
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingClick = (selectedRating: number) => {
    setRating(selectedRating);
    logUserInteraction('feedback_rating_selected', { rating: selectedRating });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-purple-100 p-3 rounded-lg">
            <MessageCircle className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Share Your Feedback</h1>
            <p className="text-gray-600">Help us improve CitizenVoiceMMS municipal services</p>
          </div>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800">
              Thank you for your feedback! We appreciate your input and will use it to improve our services.
            </p>
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
                Feedback Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Rating (Optional)
              </label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    className={`p-1 rounded transition duration-200 ${
                      rating && star <= rating
                        ? 'text-yellow-500'
                        : 'text-gray-300 hover:text-yellow-400'
                    }`}
                  >
                    <Star className="w-6 h-6 fill-current" />
                  </button>
                ))}
              </div>
              {rating && (
                <p className="text-sm text-gray-600 mt-1">
                  {rating} out of 5 stars
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
              Your Feedback *
            </label>
            <textarea
              id="feedback"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your thoughts, suggestions, or comments about our municipal services..."
              className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="anonymous" className="text-sm text-gray-700">
              Submit this feedback anonymously
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 font-medium"
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-purple-50 rounded-lg p-6">
            <h3 className="font-medium text-purple-900 mb-3">Why Your Feedback Matters</h3>
            <ul className="text-sm text-purple-800 space-y-2">
              <li>• Helps us identify areas for improvement</li>
              <li>• Guides our policy and service decisions</li>
              <li>• Ensures we meet community needs</li>
              <li>• Builds better citizen-government relationships</li>
              <li>• All feedback is logged and reviewed</li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="font-medium text-blue-900 mb-3">Types of Feedback We Value</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• Service quality experiences</li>
              <li>• Suggestions for new services</li>
              <li>• Process improvement ideas</li>
              <li>• Website usability feedback</li>
              <li>• General comments and concerns</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;