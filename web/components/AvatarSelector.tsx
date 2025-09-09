'use client';

import { useState } from 'react';
import Image from 'next/image';

interface AvatarSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (avatar: string) => void;
  onUpload: (file: File) => void;
  currentAvatar?: string;
}

const AVAILABLE_AVATARS = [
  { key: 'user', file: '36-user' },
  { key: 'man', file: '02-man' },
  { key: 'girl', file: '04-girl' },
  { key: 'boy', file: '05-boy' },
  { key: 'chinese', file: '06-chinese' },
  { key: 'french', file: '09-french' },
  { key: 'arab', file: '12-arab' },
  { key: 'indian', file: '21-indian' },
  { key: 'scientist', file: '47-scientist' },
  { key: 'doctor', file: '45-doctor' },
  { key: 'dj', file: '37-dj' },
  { key: 'cowboy', file: '41-cowboy' },
  { key: 'ninja', file: '27-ninja' },
  { key: 'police', file: '08-police' }
];

export default function AvatarSelector({ isOpen, onClose, onSelect, onUpload, currentAvatar }: AvatarSelectorProps) {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || 'user');
  const [uploadMode, setUploadMode] = useState(false);

  if (!isOpen) return null;

  const handleSelect = () => {
    onSelect(selectedAvatar);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="card rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Choose Your Avatar</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setUploadMode(false)}
              className={`px-4 py-2 rounded-lg transition-all ${
                !uploadMode
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Select Avatar
            </button>
            <button
              onClick={() => setUploadMode(true)}
              className={`px-4 py-2 rounded-lg transition-all ${
                uploadMode
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Upload Image
            </button>
          </div>

          {!uploadMode ? (
            <div className="grid grid-cols-4 md:grid-cols-6 gap-4 mb-6">
            {AVAILABLE_AVATARS.map((avatar) => (
              <button
                key={avatar.key}
                onClick={() => setSelectedAvatar(avatar.key)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  selectedAvatar === avatar.key
                    ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-50 dark:hover:from-blue-900 dark:hover:to-blue-900'
                }`}
              >
                <Image
                  src={`/speckyboy-free-avatar-icon-set/SVG/1 de 3 Avatars FLAT/${avatar.file}.svg`}
                  alt={avatar.key}
                  width={60}
                  height={60}
                  className="w-full h-auto"
                />
              </button>
            ))}
            </div>
          ) : (
            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="text-4xl mb-4">📷</div>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">Click to upload your image</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">PNG, JPG up to 5MB</p>
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all shadow-md"
            >
              Cancel
            </button>
            {!uploadMode && (
              <button
                onClick={handleSelect}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
              >
                Select Avatar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}