'use client';

import Image from 'next/image';

interface AvatarProps {
  src?: string;
  avatarType?: 'upload' | 'avatar' | 'google';
  selectedAvatar?: string;
  googlePhotoUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | string;
  className?: string;
  alt?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12', 
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
};

export default function Avatar({ 
  src, 
  avatarType = 'avatar', 
  selectedAvatar = 'user', 
  googlePhotoUrl,
  size = 'md', 
  className = '',
  alt = 'Avatar'
}: AvatarProps) {
  
  const getAvatarSrc = () => {
    // Prefer Google photo when provided
    if (googlePhotoUrl && (avatarType === 'google' || (!src && googlePhotoUrl))) {
      return googlePhotoUrl;
    }

    // If any src is provided, build a usable URL (absolute or media path)
    if (src) {
      if (src.startsWith('http')) return src;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';
      if (src.startsWith('/media/')) return `${baseUrl}${src}`;
      if (src.startsWith('media/')) return `${baseUrl}/${src}`;
      return `${baseUrl}${src}`;
    }
    
    // Default to SVG avatar
    const avatarMap: { [key: string]: string } = {
      'user': '36-user', 'man': '02-man', 'girl': '04-girl', 'boy': '05-boy',
      'chinese': '06-chinese', 'french': '09-french', 'arab': '12-arab', 'indian': '21-indian',
      'scientist': '47-scientist', 'doctor': '45-doctor', 'dj': '37-dj', 'cowboy': '41-cowboy',
      'ninja': '27-ninja', 'police': '08-police'
    };
    const avatarName = avatarMap[selectedAvatar || 'user'] || '36-user';
    return `/speckyboy-free-avatar-icon-set/SVG/1 de 3 Avatars FLAT/${avatarName}.svg`;
  };

  const avatarSrc = getAvatarSrc();
  // Render as <img> when using http(s) or media paths to avoid Next/Image remote config issues
  const isUploadedImage = avatarSrc.startsWith('http') || avatarSrc.includes('/media/');

  const sizeClass = typeof size === 'string' && size.includes('w-') ? size : sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.md;

  return (
    <div className={`${sizeClass} rounded-full overflow-hidden bg-gray-200 flex items-center justify-center ${className}`}>
      {isUploadedImage ? (
        <img
          src={avatarSrc}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/speckyboy-free-avatar-icon-set/SVG/1 de 3 Avatars FLAT/36-user.svg';
          }}
        />
      ) : (
        <Image
          src={avatarSrc}
          alt={alt}
          width={size === 'xl' ? 96 : size === 'lg' ? 64 : size === 'md' ? 48 : 32}
          height={size === 'xl' ? 96 : size === 'lg' ? 64 : size === 'md' ? 48 : 32}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/speckyboy-free-avatar-icon-set/SVG/1 de 3 Avatars FLAT/36-user.svg';
          }}
        />
      )}
    </div>
  );
}
