import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import DRConfigForm from '../components/DRConfigForm';
import DeploymentList from '../components/DeploymentList';
import LogViewer from '../components/LogViewer';
import { Plus, Activity, Clock, CheckCircle, XCircle } from 'lucide-react';

const CompanyDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  const { lastMessage } = useWebSocket();
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState(null);

  useEffect(() => {
    fetchDeployments();
  }, []);

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'deployment_status') {
        if (lastMessage.status === 'SUCCEEDED') {
          showSuccess('Deployment Completed', lastMessage.message);
        } else if (lastMessage.status === 'FAILED') {
          showError('Deployment Failed', lastMessage.message);
        } else if (lastMessage.status === 'RUNNING') {
          showInfo('Deployment Running', lastMessage.message);
        }
        fetchDeployments();
      } else if (lastMessage.type === 'deployment_log' && selectedDeployment) {
        // Real-time log updates are handled by LogViewer
      }
    }
  }, [lastMessage, selectedDeployment]);

  const fetchDeployments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/deployments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDeployments(data);
      }
    } catch (error) {
      console.error('Error fetching deployments:', error);
    }
  };

  const handleDeploymentSubmit = async (config: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/deployments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          companyId: user?.company?.id,
          drConfig: config,
          iamRoleArn: config.iamRoleArn,
          externalId: config.externalId
        })
      });

      if (response.ok) {
        setActiveTab('history');
        fetchDeployments();
        showSuccess('Deployment Started', 'Your DR configuration has been submitted successfully.');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Deployment failed');
      }
    } catch (error) {
      console.error('Deployment error:', error);
      showError('Deployment Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDestroyDeployment = async (deploymentId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/deployments/${deploymentId}/destroy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchDeployments();
        showSuccess('Destroy Started', 'Infrastructure destruction has been initiated.');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Destroy failed');
      }
    } catch (error) {
      console.error('Destroy error:', error);
      showError('Destroy Failed', error.message);
    }
  };

  const getStatusStats = () => {
    const stats = {
      total: deployments.length,
      running: deployments.filter(d => d.status === 'RUNNING').length,
      succeeded: deployments.filter(d => d.status === 'SUCCEEDED').length,
      failed: deployments.filter(d => d.status === 'FAILED').length,
      pending: deployments.filter(d => d.status === 'PENDING').length
    };
    return stats;
  };

  const stats = getStatusStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome, {user?.company?.name}
        </h1>
        <p className="text-gray-600">
          Manage your AWS RDS Disaster Recovery deployments
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <Activity className="h-5 w-5 text-blue-500 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-yellow-500 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <Activity className="h-5 w-5 text-orange-500 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Running</p>
              <p className="text-2xl font-bold text-gray-900">{stats.running}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Succeeded</p>
              <p className="text-2xl font-bold text-gray-900">{stats.succeeded}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('new')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'new'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Plus className="h-4 w-4 inline mr-2" />
              New Deployment
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="h-4 w-4 inline mr-2" />
              Deployment History
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'new' && (
            <DRConfigForm onSubmit={handleDeploymentSubmit} loading={loading} />
          )}

          {activeTab === 'history' && (
            <DeploymentList
              deployments={deployments}
              onSelectDeployment={setSelectedDeployment}
              onDestroyDeployment={handleDestroyDeployment}
            />
          )}
        </div>
      </div>

      {/* Log Viewer Modal */}
      {selectedDeployment && (
        <LogViewer
          deployment={selectedDeployment}
          onClose={() => setSelectedDeployment(null)}
        />
      )}
    </div>
  );
};

export default CompanyDashboard;