import React from "react";
import { CloudIcon, WifiIcon, XIcon } from "lucide-react";

interface CloudConnectionStatusProps {
  provider: "Firebase" | "GDrive" | null;
  status: "connected" | "disconnected" | "connecting";
  onChangeConnection: () => void;
  onDisconnect: () => void;
}

export const CloudConnectionStatus: React.FC<CloudConnectionStatusProps> = ({ provider, status, onChangeConnection, onDisconnect }) => {
  return (
    <div className="bg-gray-800/50 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CloudIcon size={18} className={status === "connected" ? "text-green-400" : "text-gray-400"} />
          <div>
            <h3 className="text-sm font-medium">Penyimpanan Cloud</h3>
            <p className="text-xs text-gray-400">{status === "connected" ? `Terhubung ke ${provider}` : "Tidak terhubung"}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {status === "connected" && (
            <>
              <button onClick={onChangeConnection} className="px-3 py-1.5 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors text-sm">
                Ganti
              </button>
              <button onClick={onDisconnect} className="px-3 py-1.5 bg-red-600/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-600/30 transition-colors text-sm">
                Putuskan
              </button>
            </>
          )}
          {status === "disconnected" && (
            <button onClick={onChangeConnection} className="px-3 py-1.5 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors text-sm">
              Hubungkan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
