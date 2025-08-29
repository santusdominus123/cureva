import React, { useState } from "react";
import { CloudIcon, DatabaseIcon, KeyIcon } from "lucide-react";
import { auth, signInGoogle } from "../lib/firebase";

interface FirebaseConnectionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConnected: () => void;
}

export const FirebaseConnectionModal: React.FC<FirebaseConnectionModalProps> = ({ isVisible, onClose, onConnected }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Sign in with Google
      await signInGoogle();

      // Successfully connected
      onConnected();
      onClose();
    } catch (err) {
      setError("Failed to connect to Firebase. Please try again.");
      console.error("Firebase connection error:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900/95 rounded-xl border border-gray-700 p-6 w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <DatabaseIcon size={40} className="text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold text-center mb-2">Connect to Firebase</h3>
        <p className="text-gray-300 text-center text-sm mb-6">Sign in with your Google account to enable real-time sync with Firebase</p>

        {error && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full px-4 py-3 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-lg font-medium hover:bg-blue-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin mr-2">
                  <CloudIcon size={18} />
                </div>
                Connecting...
              </>
            ) : (
              <>
                <KeyIcon size={18} className="mr-2" />
                Connect with Google
              </>
            )}
          </button>

          <button onClick={onClose} className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
