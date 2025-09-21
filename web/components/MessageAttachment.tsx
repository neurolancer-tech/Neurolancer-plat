'use client';

import { useState } from 'react';
import Image from 'next/image';
import api from '@/lib/api';

interface Attachment {
  id: number;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
}

interface MessageAttachmentProps {
  attachment: Attachment;
  isCurrentUser: boolean;
}

export default function MessageAttachment({ attachment, isCurrentUser }: MessageAttachmentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else if (fileType.includes('pdf')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    } else if (fileType.includes('video/')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
  };

const getFileUrl = (url: string) => {
    if (!url) return url;
    if (url.startsWith('http')) return url;
    const base = (process.env.NEXT_PUBLIC_API_URL || '').replace('/api', '') || 'http://localhost:8000';
    return `${base}${url.startsWith('/') ? url : '/' + url}`;
  };

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const url = getFileUrl(attachment.file_url);
      const response = await api.get(url, { responseType: 'blob' });
      const contentDisposition = response.headers['content-disposition'] || response.headers['Content-Disposition'];
      let filename = attachment.file_name || 'download';
      if (contentDisposition) {
        const match = /filename\*=UTF-8''([^;]+)|filename=\"?([^\";]+)\"?/i.exec(contentDisposition);
        const encoded = match?.[1];
        const simple = match?.[2];
        if (encoded) filename = decodeURIComponent(encoded);
        else if (simple) filename = simple;
      }
      const blob = new Blob([response.data]);
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      try {
        // Fallback: open in a new tab (browser will handle auth via token header if same-domain or cookies)
        const url = getFileUrl(attachment.file_url);
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch (_) {
        // ignore
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (attachment.file_type.startsWith('image/')) {
    return (
      <div className="mt-2">
        <div 
          className="relative cursor-pointer group"
          onClick={() => setShowPreview(true)}
        >
<Image
            src={getFileUrl(attachment.file_url)}
            alt={attachment.file_name}
            width={300}
            height={200}
            className="rounded-lg max-w-xs object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-1">{attachment.file_name}</div>

        {/* Image Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-4xl max-h-full">
              <button
                onClick={() => setShowPreview(false)}
                className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <Image
                src={getFileUrl(attachment.file_url)}
                alt={attachment.file_name}
                width={800}
                height={600}
                className="rounded-lg max-w-full max-h-full object-contain"
              />
              <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 px-3 py-2 rounded">
                {attachment.file_name}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`mt-2 p-3 border rounded-lg max-w-xs ${
      isCurrentUser ? 'bg-white bg-opacity-20' : 'bg-gray-50'
    }`}>
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded ${isCurrentUser ? 'bg-white bg-opacity-30' : 'bg-gray-200'}`}>
          {getFileIcon(attachment.file_type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{attachment.file_name}</div>
          <div className="text-xs text-gray-500">{formatFileSize(attachment.file_size)}</div>
        </div>
        <button
          onClick={handleDownload}
          disabled={isLoading}
          className={`p-2 rounded hover:bg-opacity-80 transition-colors ${
            isCurrentUser ? 'bg-white bg-opacity-30' : 'bg-gray-200'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}