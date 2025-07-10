import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Shield, Building2, User, Wifi, WifiOff } from 'lucide-react';
import { useWebSocket } from '../contexts/WebSocketContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { connected } = useWebSocket();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                AWS RDS DR Manager
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {connected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm text-gray-500">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {user?.role === 'ADMIN' ? (
                    <User className="h-4 w-4 text-purple-500" />
                  ) : (
                    <Building2 className="h-4 w-4 text-blue-500" />
                  )}
                  <span className="text-sm text-gray-700">
                    {user?.role === 'ADMIN' ? 'Admin' : user?.company?.name}
                  </span>
                </div>
                
                <span className="text-sm text-gray-500">
                  {user?.email}
                </span>
                
                <button
                  onClick={logout}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;