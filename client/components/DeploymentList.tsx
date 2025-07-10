import React from 'react';
import { Eye, Trash2 } from 'lucide-react';
import StatusBadge from './StatusBadge';

interface Deployment {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  createdAt: string;
  terraformVarsJson: string;
}

interface DeploymentListProps {
  deployments: Deployment[];
  onSelectDeployment: (deployment: Deployment) => void;
  onDestroyDeployment?: (deploymentId: string) => void;
}

const DeploymentList: React.FC<DeploymentListProps> = ({ 
  deployments, 
  onSelectDeployment, 
  onDestroyDeployment 
}) => {
  const handleDestroy = (deploymentId: string, dbIdentifier: string) => {
    if (!onDestroyDeployment) return;
    
    if (confirm(`Are you sure you want to destroy the infrastructure for "${dbIdentifier}"? This action cannot be undone.`)) {
      onDestroyDeployment(deploymentId);
    }
  };

  if (deployments.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No deployments found</p>
        <p className="text-sm text-gray-400 mt-2">
          Create your first deployment to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Deployment History</h3>
      
      <div className="space-y-3">
        {deployments.map((deployment) => {
          const config = JSON.parse(deployment.terraformVarsJson);
          
          return (
            <div
              key={deployment.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <StatusBadge status={deployment.status} />
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {config.primary_db_identifier}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {config.aws_region} → {config.aws_read_replica_region}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(deployment.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(deployment.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => onSelectDeployment(deployment)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Logs</span>
                  </button>
                  
                  {onDestroyDeployment && deployment.status === 'SUCCEEDED' && (
                    <button
                      onClick={() => handleDestroy(deployment.id, config.primary_db_identifier)}
                      className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                      title="Destroy infrastructure"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Destroy</span>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Environment:</span>
                    <span className="ml-2 font-medium">{config.environment}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Instance:</span>
                    <span className="ml-2 font-medium">{config.instance_class}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Replica:</span>
                    <span className="ml-2 font-medium">{config.read_replica_identifier}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tag:</span>
                    <span className="ml-2 font-medium">{config.tag_name}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DeploymentList;