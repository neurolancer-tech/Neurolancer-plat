'use client';

import { useState } from 'react';
import { X, AlertTriangle, Flag, Shield, MessageSquare, DollarSign, User, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'gig' | 'job' | 'freelancer' | 'client' | 'order' | 'message' | 'general';
  reportData?: {
    id?: number;
    title?: string;
    owner?: {
      id: number;
      username: string;
      full_name?: string;
    };
    url?: string;
  };
}

const REPORT_CATEGORIES = [
  { value: 'inappropriate_content', label: 'Inappropriate Content', icon: AlertTriangle },
  { value: 'spam', label: 'Spam', icon: MessageSquare },
  { value: 'fraud', label: 'Fraud/Scam', icon: Shield },
  { value: 'harassment', label: 'Harassment', icon: User },
  { value: 'copyright', label: 'Copyright Violation', icon: FileText },
  { value: 'fake_profile', label: 'Fake Profile', icon: User },
  { value: 'poor_quality', label: 'Poor Quality Work', icon: Flag },
  { value: 'payment_issue', label: 'Payment Issue', icon: DollarSign },
  { value: 'communication_issue', label: 'Communication Issue', icon: MessageSquare },
  { value: 'other', label: 'Other', icon: Flag },
];

const SEVERITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'text-green-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'critical', label: 'Critical', color: 'text-red-600' },
];

export default function ReportModal({ isOpen, onClose, reportType, reportData }: ReportModalProps) {
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    severity: 'medium',
    evidence_file: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submitData = new FormData();
      submitData.append('report_type', reportType);
      submitData.append('category', formData.category);
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('severity', formData.severity);
      
      // Add specific IDs based on report type
      if (reportData?.id) {
        if (reportType === 'gig') {
          submitData.append('gig_id', reportData.id.toString());
        } else if (reportType === 'job') {
          submitData.append('job_id', reportData.id.toString());
        } else if (reportType === 'order') {
          submitData.append('order_id', reportData.id.toString());
        } else if (reportType === 'freelancer' || reportType === 'client') {
          submitData.append('user_id', reportData.owner?.id?.toString() || reportData.id.toString());
        }
      }
      
      if (reportData?.url) {
        submitData.append('content_url', reportData.url);
      }
      
      if (formData.evidence_file) {
        submitData.append('evidence_file', formData.evidence_file);
      }

      const response = await api.post('/reports/create/', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data) {
        toast.success('Report submitted successfully. Our team will review it shortly.');
        onClose();
        setFormData({
          category: '',
          title: '',
          description: '',
          severity: 'medium',
          evidence_file: null,
        });
      }
    } catch (error: any) {
      console.error('Error submitting report:', error);
      toast.error(error.response?.data?.error || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setFormData(prev => ({ ...prev, evidence_file: file }));
    }
  };

  const getReportTypeLabel = () => {
    switch (reportType) {
      case 'gig': return 'Gig';
      case 'job': return 'Job';
      case 'freelancer': return 'Freelancer';
      case 'client': return 'Client';
      case 'order': return 'Order';
      case 'message': return 'Message';
      default: return 'Content';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <Flag className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Report {getReportTypeLabel()}
              </h2>
              {reportData?.title && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Reporting: {reportData.title}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Report Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Report Category *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {REPORT_CATEGORIES.map((category) => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, category: category.value }))}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      formData.category === category.value
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <IconComponent className={`w-5 h-5 ${
                        formData.category === category.value 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`} />
                      <span className={`font-medium ${
                        formData.category === category.value
                          ? 'text-red-900 dark:text-red-100'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {category.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Report Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Report Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Brief summary of the issue"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Detailed Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Please provide detailed information about the issue, including what happened, when it occurred, and any relevant context..."
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Minimum 20 characters. Be specific and factual.
            </p>
          </div>

          {/* Severity Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Severity Level
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SEVERITY_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, severity: level.value }))}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    formData.severity === level.value
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <span className={`font-medium ${
                    formData.severity === level.value
                      ? 'text-red-900 dark:text-red-100'
                      : level.color
                  }`}>
                    {level.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Evidence File */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Evidence (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx"
                className="hidden"
                id="evidence-file"
              />
              <label htmlFor="evidence-file" className="cursor-pointer">
                <div className="space-y-2">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {formData.evidence_file ? (
                      <span className="text-green-600 dark:text-green-400">
                        {formData.evidence_file.name}
                      </span>
                    ) : (
                      <>
                        <span className="text-blue-600 dark:text-blue-400 hover:underline">
                          Click to upload
                        </span>
                        <span> or drag and drop</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Images, PDF, DOC up to 10MB
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Content Details */}
          {reportData && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Reported Content Details
              </h4>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p><span className="font-medium">Type:</span> {getReportTypeLabel()}</p>
                {reportData.title && (
                  <p><span className="font-medium">Title:</span> {reportData.title}</p>
                )}
                {reportData.owner && (
                  <p><span className="font-medium">Owner:</span> {reportData.owner.full_name || reportData.owner.username}</p>
                )}
                {reportData.url && (
                  <p><span className="font-medium">URL:</span> {reportData.url}</p>
                )}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium mb-1">Important Notice</p>
                <ul className="space-y-1 text-xs">
                  <li>• False reports may result in account restrictions</li>
                  <li>• Reports are reviewed within 24-48 hours</li>
                  <li>• You'll be notified of the outcome via notification</li>
                  <li>• Reported users won't know who filed the report</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.category || !formData.title || !formData.description}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}