import React from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

interface NotificationToastProps {
  type: "success" | "error" | "warning" | "info";
  message: string;
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  type,
  message,
  onClose,
}) => {
  const getToastConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: CheckCircle,
          className: "bg-green-50 border-green-200 text-green-800",
          iconClassName: "text-green-400",
        };
      case "error":
        return {
          icon: XCircle,
          className:
            "bg-brand-secondary/10 border-brand-secondary/20 text-brand-secondary",
          iconClassName: "text-brand-secondary",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          className: "bg-yellow-50 border-yellow-200 text-yellow-800",
          iconClassName: "text-yellow-400",
        };
      case "info":
        return {
          icon: Info,
          className:
            "bg-brand-primary/10 border-brand-primary/20 text-brand-primary",
          iconClassName: "text-brand-primary",
        };
      default:
        return {
          icon: Info,
          className: "bg-gray-50 border-gray-200 text-gray-800",
          iconClassName: "text-gray-400",
        };
    }
  };

  const config = getToastConfig();
  const IconComponent = config.icon;

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white border rounded-lg shadow-lg p-4 ${config.className}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <IconComponent className={`h-5 w-5 ${config.iconClassName}`} />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;
