'use client';

import { useRouter } from 'next/navigation';

interface MessageContentProps {
  content: string;
  isCurrentUser: boolean;
}

export default function MessageContent({ content, isCurrentUser }: MessageContentProps) {
  const router = useRouter();

  const renderContent = (text: string) => {
    // URL regex pattern
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        // Check if it's a group invitation link
        const isGroupInvite = part.includes('/join-group/');
        
        if (isGroupInvite) {
          return (
            <div key={index} className="mt-2">
              <a
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-sm underline ${
                  isCurrentUser ? 'text-blue-200 hover:text-blue-100' : 'text-blue-600 hover:text-blue-800'
                }`}
              >
                {part}
              </a>
              <div className="mt-2">
                <button
                  onClick={() => router.push(part.replace(window.location.origin, ''))}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                    isCurrentUser
                      ? 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                      : 'bg-[#0D9E86] text-white hover:bg-opacity-90'
                  }`}
                >
                  Join Group
                </button>
              </div>
            </div>
          );
        } else {
          // Regular link
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className={`underline ${
                isCurrentUser ? 'text-blue-200 hover:text-blue-100' : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              {part}
            </a>
          );
        }
      }
      return part;
    });
  };

  return <div className="text-sm">{renderContent(content)}</div>;
}