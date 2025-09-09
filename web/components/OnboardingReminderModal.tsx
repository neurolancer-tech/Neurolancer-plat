'use client';

interface OnboardingReminderModalProps {
  isOpen: boolean;
  userType: 'client' | 'freelancer';
  onComplete: () => void;
  onDismiss: () => void;
}

export default function OnboardingReminderModal({ 
  isOpen, 
  userType, 
  onComplete, 
  onDismiss 
}: OnboardingReminderModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="card rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Complete Your Profile</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Help us personalize your experience by completing your onboarding questions.
          </p>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className={`p-4 rounded-lg ${userType === 'client' ? 'bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700' : 'bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700'}`}>
            <h3 className={`font-semibold ${userType === 'client' ? 'text-blue-900 dark:text-blue-100' : 'text-green-900 dark:text-green-100'} mb-2`}>
              {userType === 'client' ? '🎯 For Clients' : '🚀 For Freelancers'}
            </h3>
            <ul className={`text-sm ${userType === 'client' ? 'text-blue-800 dark:text-blue-200' : 'text-green-800 dark:text-green-200'} space-y-1`}>
              {userType === 'client' ? (
                <>
                  <li>• Get better project matches</li>
                  <li>• Find experts in your industry</li>
                  <li>• Receive personalized recommendations</li>
                </>
              ) : (
                <>
                  <li>• Get matched with relevant projects</li>
                  <li>• Showcase your expertise</li>
                  <li>• Increase your visibility to clients</li>
                </>
              )}
            </ul>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onDismiss}
            className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Maybe Later
          </button>
          <button
            onClick={onComplete}
            className={`flex-1 px-4 py-2 text-white rounded-lg font-medium ${
              userType === 'client' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' 
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
            }`}
          >
            Complete Now
          </button>
        </div>
      </div>
    </div>
  );
}