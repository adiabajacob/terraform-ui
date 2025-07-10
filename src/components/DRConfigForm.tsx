import React, { useState } from 'react';
import { Save, Shield, Database, Globe, Mail, Tag, Key } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

interface DRConfig {
  aws_region: string;
  aws_read_replica_region: string;
  primary_db_identifier: string;
  read_replica_identifier: string;
  instance_class: string;
  vpc_cidr: string;
  public_subnet_cidrs: string[];
  notification_email: string;
  environment: string;
  tag_name: string;
  iamRoleArn: string;
  externalId: string;
}

interface DRConfigFormProps {
  onSubmit: (config: DRConfig) => void;
  loading?: boolean;
}

const DRConfigForm: React.FC<DRConfigFormProps> = ({ onSubmit, loading = false }) => {
  const { showWarning, showInfo } = useNotification();
  const [config, setConfig] = useState<DRConfig>({
    aws_region: 'eu-central-1',
    aws_read_replica_region: 'eu-west-1',
    primary_db_identifier: '',
    read_replica_identifier: '',
    instance_class: 'db.t3.micro',
    vpc_cidr: '172.16.0.0/16',
    public_subnet_cidrs: ['172.16.1.0/24', '172.16.2.0/24'],
    notification_email: '',
    environment: 'production',
    tag_name: '',
    iamRoleArn: '',
    externalId: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate regions are different
    if (config.aws_region === config.aws_read_replica_region) {
      showWarning('Invalid Configuration', 'Primary and read replica regions must be different for disaster recovery.');
      return;
    }
    
    // Validate subnet CIDRs
    if (config.public_subnet_cidrs.some(cidr => !cidr.trim())) {
      showWarning('Invalid Configuration', 'All subnet CIDRs must be filled in.');
      return;
    }
    
    showInfo('Deployment Started', 'Your DR configuration is being deployed. You can monitor progress in real-time.');
    onSubmit(config);
  };

  const handleSubnetChange = (index: number, value: string) => {
    const newSubnets = [...config.public_subnet_cidrs];
    newSubnets[index] = value;
    setConfig({ ...config, public_subnet_cidrs: newSubnets });
  };

  const addSubnet = () => {
    setConfig({
      ...config,
      public_subnet_cidrs: [...config.public_subnet_cidrs, '']
    });
  };

  const removeSubnet = (index: number) => {
    const newSubnets = config.public_subnet_cidrs.filter((_, i) => i !== index);
    setConfig({ ...config, public_subnet_cidrs: newSubnets });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <Database className="h-6 w-6 text-blue-600 mr-3" />
        <h2 className="text-xl font-semibold text-gray-900">
          DR Configuration
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* AWS Regions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Globe className="h-4 w-4 mr-2" />
              Primary AWS Region
            </label>
            <select
              value={config.aws_region}
              onChange={(e) => setConfig({ ...config, aws_region: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="eu-central-1">EU Central 1 (Frankfurt)</option>
              <option value="eu-west-1">EU West 1 (Ireland)</option>
              <option value="us-east-1">US East 1 (N. Virginia)</option>
              <option value="us-west-2">US West 2 (Oregon)</option>
            </select>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Globe className="h-4 w-4 mr-2" />
              Read Replica Region
            </label>
            <select
              value={config.aws_read_replica_region}
              onChange={(e) => setConfig({ ...config, aws_read_replica_region: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="eu-west-1">EU West 1 (Ireland)</option>
              <option value="eu-central-1">EU Central 1 (Frankfurt)</option>
              <option value="us-east-1">US East 1 (N. Virginia)</option>
              <option value="us-west-2">US West 2 (Oregon)</option>
            </select>
          </div>
        </div>

        {/* Database Identifiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Database className="h-4 w-4 mr-2" />
              Primary DB Identifier
            </label>
            <input
              type="text"
              value={config.primary_db_identifier}
              onChange={(e) => setConfig({ ...config, primary_db_identifier: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., mycompany-primary-db"
              required
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Database className="h-4 w-4 mr-2" />
              Read Replica Identifier
            </label>
            <input
              type="text"
              value={config.read_replica_identifier}
              onChange={(e) => setConfig({ ...config, read_replica_identifier: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., mycompany-read-replica"
              required
            />
          </div>
        </div>

        {/* Instance Class */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Database className="h-4 w-4 mr-2" />
            Instance Class
          </label>
          <select
            value={config.instance_class}
            onChange={(e) => setConfig({ ...config, instance_class: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="db.t3.micro">db.t3.micro</option>
            <option value="db.t3.small">db.t3.small</option>
            <option value="db.t3.medium">db.t3.medium</option>
            <option value="db.t3.large">db.t3.large</option>
            <option value="db.m5.large">db.m5.large</option>
            <option value="db.m5.xlarge">db.m5.xlarge</option>
          </select>
        </div>

        {/* VPC CIDR */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Globe className="h-4 w-4 mr-2" />
            VPC CIDR
          </label>
          <input
            type="text"
            value={config.vpc_cidr}
            onChange={(e) => setConfig({ ...config, vpc_cidr: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 172.16.0.0/16"
            required
          />
        </div>

        {/* Public Subnet CIDRs */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Globe className="h-4 w-4 mr-2" />
            Public Subnet CIDRs
          </label>
          {config.public_subnet_cidrs.map((subnet, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={subnet}
                onChange={(e) => handleSubnetChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 172.16.1.0/24"
                required
              />
              {config.public_subnet_cidrs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSubnet(index)}
                  className="px-3 py-2 text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addSubnet}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            + Add Subnet
          </button>
        </div>

        {/* Notification Email */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Mail className="h-4 w-4 mr-2" />
            Notification Email
          </label>
          <input
            type="email"
            value={config.notification_email}
            onChange={(e) => setConfig({ ...config, notification_email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="admin@yourcompany.com"
            required
          />
        </div>

        {/* Environment and Tag */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Tag className="h-4 w-4 mr-2" />
              Environment
            </label>
            <select
              value={config.environment}
              onChange={(e) => setConfig({ ...config, environment: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </select>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Tag className="h-4 w-4 mr-2" />
              Tag Name
            </label>
            <input
              type="text"
              value={config.tag_name}
              onChange={(e) => setConfig({ ...config, tag_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., MyCompanyDR"
              required
            />
          </div>
        </div>

        {/* AWS IAM Credentials */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="flex items-center text-lg font-medium text-blue-900 mb-4">
            <Shield className="h-5 w-5 mr-2" />
            AWS IAM Credentials
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Key className="h-4 w-4 mr-2" />
                IAM Role ARN
              </label>
              <input
                type="text"
                value={config.iamRoleArn}
                onChange={(e) => setConfig({ ...config, iamRoleArn: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="arn:aws:iam::123456789012:role/YourRoleName"
                required
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Key className="h-4 w-4 mr-2" />
                External ID
              </label>
              <input
                type="text"
                value={config.externalId}
                onChange={(e) => setConfig({ ...config, externalId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="unique-external-id"
                required
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Deploy DR Configuration
        </button>
      </form>
    </div>
  );
};

export default DRConfigForm;