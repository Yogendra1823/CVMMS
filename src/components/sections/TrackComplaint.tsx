import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { getComplaintStatus } from '../../utils/complaintStatus';
import { Complaint } from '../../types';
import { Search, Clock, CheckCircle, AlertCircle, FileText } from 'lucide-react';

const TrackComplaint: React.FC = () => {
  const [complaintId, setComplaintId] = useState('');
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    logUserInteraction('track_complaint_page_loaded');
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintId.trim()) {
      setError('Please enter a complaint ID.');
      return;
    }

    setLoading(true);
    setError(null);
    setComplaint(null);

    try {
      await logUserInteraction('complaint_search_started', { complaint_id: complaintId.trim() });

      const { data, error: fetchError } = await supabase
        .from('complaints')
        .select('*')
        .eq('id', complaintId.trim())
        .single();

      if (fetchError) {
        await logUserInteraction('complaint_search_not_found', { complaint_id: complaintId.trim() });
        setError('Complaint not found. Please check your complaint ID and try again.');
        return;
      }

      // Update status based on time elapsed
      const currentStatus = getComplaintStatus(data.created_at);
      if (currentStatus !== data.status) {
        await supabase
          .from('complaints')
          .update({ status: currentStatus })
          .eq('id', complaintId.trim());
        
        data.status = currentStatus;

        await logUserInteraction('complaint_status_auto_updated', {
          complaint_id: complaintId.trim(),
          old_status: data.status,
          new_status: currentStatus
        });
      }

      await logUserInteraction('complaint_search_success', {
        complaint_id: complaintId.trim(),
        status: data.status,
        category: data.category,
        priority: data.priority
      });

      setComplaint(data);
    } catch (error: any) {
      await logUserInteraction('complaint_search_error', {
        complaint_id: complaintId.trim(),
        error: error.message
      });
      setError('An error occurred while fetching the complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Not Yet Started':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'In Progress':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      case 'Resolved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Not Yet Started':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-green-100 p-3 rounded-lg">
            <Search className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Track Your Complaint</h1>
            <p className="text-gray-600">Enter your complaint ID to check the status</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="space-y-4 mb-8">
          <div>
            <label htmlFor="complaintId" className="block text-sm font-medium text-gray-700 mb-2">
              Complaint ID
            </label>
            <div className="flex space-x-3">
              <input
                id="complaintId"
                type="text"
                value={complaintId}
                onChange={(e) => setComplaintId(e.target.value)}
                placeholder="e.g., CMP-123456-ABC123"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 font-medium"
              >
                {loading ? 'Searching...' : 'Track'}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {complaint && (
          <div className="space-y-6">
            <div className="border-2 border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Complaint #{complaint.id}
                </h3>
                <div className="flex space-x-2">
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(complaint.status)}`}>
                    {getStatusIcon(complaint.status)}
                    <span className="font-medium">{complaint.status}</span>
                  </div>
                  {complaint.priority && (
                    <div className={`px-3 py-1 rounded-full border ${getPriorityColor(complaint.priority)}`}>
                      <span className="font-medium">{complaint.priority}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Description:</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {complaint.description}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Submitted On:</h4>
                    <p className="text-gray-600">
                      {new Date(complaint.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Current Status:</h4>
                    <p className="text-gray-600">{complaint.status}</p>
                  </div>
                </div>

                {complaint.category && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Category:</h4>
                    <p className="text-gray-600 capitalize">{complaint.category.replace('_', ' ')}</p>
                  </div>
                )}

                {complaint.location && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Location:</h4>
                    <p className="text-gray-600">{complaint.location}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-medium text-blue-900 mb-3">Status Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${complaint.status === 'Not Yet Started' ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                  <span className="text-blue-800">Not Yet Started (0-1 days)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${complaint.status === 'In Progress' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <span className="text-blue-800">In Progress (1-2 days)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${complaint.status === 'Resolved' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-blue-800">Resolved (2+ days)</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>Tracking Note:</strong> All complaint interactions and status changes are automatically logged for transparency and quality assurance.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackComplaint;