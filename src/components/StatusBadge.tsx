import React from 'react';
import { Clock, CheckCircle, XCircle, Activity, AlertTriangle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showIcon = true, size = 'md' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'PENDING':
        return {
          icon: Clock,
          color: 'bg-gray-100 text-gray-800',
          iconColor: 'text-gray-500'
        };
      case 'RUNNING':
        return {
          icon: Activity,
          color: 'bg-orange-100 text-orange-800',
          iconColor: 'text-orange-500'
        };
      case 'SUCCEEDED':
        return {
          icon: CheckCircle,
          color: 'bg-green-100 text-green-800',
          iconColor: 'text-green-500'
        };
      case 'FAILED':
        return {
          icon: XCircle,
          color: 'bg-red-100 text-red-800',
          iconColor: 'text-red-500'
        };
      default:
        return {
          icon: AlertTriangle,
          color: 'bg-gray-100 text-gray-800',
          iconColor: 'text-gray-500'
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          badge: 'px-2 py-1 text-xs',
          icon: 'h-3 w-3'
        };
      case 'md':
        return {
          badge: 'px-2 py-1 text-xs',
          icon: 'h-4 w-4'
        };
      case 'lg':
        return {
          badge: 'px-3 py-1 text-sm',
          icon: 'h-5 w-5'
        };
    }
  };

  const config = getStatusConfig();
  const sizeClasses = getSizeClasses();
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${config.color} ${sizeClasses.badge}`}>
      {showIcon && (
        <Icon className={`${sizeClasses.icon} ${config.iconColor} mr-1`} />
      )}
      {status}
    </span>
  );
};

export default StatusBadge;