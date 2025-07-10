import React, { useState, useEffect, useRef } from 'react';
import { X, Download, RefreshCw } from 'lucide-react';
import { useWebSocket } from '../contexts/WebSocketContext';

interface LogViewerProps {
  deployment: any;
  onClose: () => void;
}

const LogViewer: React.FC<LogViewerProps> = ({ deployment, onClose }) => {
  const { lastMessage } = useWebSocket();
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLogs();
  }, [deployment.id]);

  useEffect(() => {
    if (lastMessage && lastMessage.type === 'deployment_log' && lastMessage.deploymentId === deployment.id) {
      setLogs(prev => prev + lastMessage.log);
    }
  }, [lastMessage, deployment.id]);

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/deployments/${deployment.id}/logs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || '');
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const downloadLogs = () => {
    const element = document.createElement('a');
    const file = new Blob([logs], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `deployment-${deployment.id}-logs.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Deployment Logs</h3>
            <p className="text-sm text-gray-600">
              {JSON.parse(deployment.terraformVarsJson).primary_db_identifier} - {deployment.status}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={downloadLogs}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
              title="Download logs"
            >
              <Download className="h-4 w-4" />
            </button>
            
            <button
              onClick={fetchLogs}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
              title="Refresh logs"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto bg-gray-900 text-green-400 p-4 font-mono text-sm">
              {logs ? (
                <pre className="whitespace-pre-wrap">{logs}</pre>
              ) : (
                <p className="text-gray-500">No logs available yet...</p>
              )}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Status: <span className={`font-medium ${
                deployment.status === 'SUCCEEDED' ? 'text-green-600' :
                deployment.status === 'FAILED' ? 'text-red-600' :
                deployment.status === 'RUNNING' ? 'text-orange-600' :
                'text-gray-600'
              }`}>
                {deployment.status}
              </span>
            </span>
            
            <span className="text-sm text-gray-600">
              Created: {new Date(deployment.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogViewer;