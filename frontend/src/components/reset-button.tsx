import React, { useState } from 'react';
import { resetAccount } from '../api';

const ResetButton: React.FC = () => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    setIsResetting(true);
    setError(null);
    try {
      await resetAccount();
      window.location.reload(); // Refresh the page to reflect the reset state
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsResetting(false);
      setIsConfirmOpen(false);
    }
  };

  return (
    <div>
      {/* Reset Account Button */}
      <button
        onClick={() => setIsConfirmOpen(true)}
        disabled={isResetting}
        className='mt-4 px-4 py-2 bg-red-600 text-white font-semibold rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50'
      >
        Reset Account
      </button>

      {/* Confirmation Dialog */}
      {isConfirmOpen && (
        <div className='fixed inset-0 flex items-center justify-center z-50'>
          {/* Overlay */}
          <div
            className='absolute inset-0 bg-black opacity-50'
            onClick={() => setIsConfirmOpen(false)}
          ></div>

          {/* Dialog Content */}
          <div className='bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full z-10'>
            <div className='px-6 py-4'>
              <h3 className='text-lg leading-6 font-medium text-gray-900'>
                Reset Account
              </h3>
              <div className='mt-2'>
                <p className='text-sm text-gray-500'>
                  Are you sure you want to reset your account? This action
                  cannot be undone.
                </p>
                {error && <p className='mt-2 text-sm text-red-600'>{error}</p>}
              </div>
            </div>
            <div className='bg-gray-50 px-6 py-3 sm:flex sm:flex-row-reverse'>
              <button
                onClick={handleReset}
                disabled={isResetting}
                className='w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50'
              >
                {isResetting ? 'Resetting...' : 'Yes, Reset'}
              </button>
              <button
                onClick={() => setIsConfirmOpen(false)}
                disabled={isResetting}
                className='mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResetButton;
