import React from "react";
import { CheckCircle, XCircle, Clock, Play } from "lucide-react";

interface StatusBadgeProps {
  status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case "PENDING":
        return {
          icon: Clock,
          text: "Pending",
          className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        };
      case "RUNNING":
        return {
          icon: Play,
          text: "Running",
          className:
            "bg-brand-primary/10 text-brand-primary border-brand-primary/20",
        };
      case "SUCCEEDED":
        return {
          icon: CheckCircle,
          text: "Success",
          className: "bg-green-100 text-green-800 border-green-200",
        };
      case "FAILED":
        return {
          icon: XCircle,
          text: "Failed",
          className:
            "bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20",
        };
      default:
        return {
          icon: Clock,
          text: "Unknown",
          className: "bg-gray-100 text-gray-800 border-gray-200",
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <div
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
    >
      <IconComponent className="h-3 w-3 mr-1" />
      {config.text}
    </div>
  );
};

export default StatusBadge;
