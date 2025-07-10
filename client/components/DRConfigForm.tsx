import React, { useState } from "react";
import {
  Save,
  Shield,
  Database,
  Globe,
  Mail,
  Tag,
  Key,
  Copy,
  Camera,
} from "lucide-react";
import { useNotification } from "../contexts/NotificationContext";

interface BaseDRConfig {
  solutionType: "READ_REPLICA" | "SNAPSHOT";
  iamRoleArn: string;
  externalId: string;
}

interface ReadReplicaConfig extends BaseDRConfig {
  solutionType: "READ_REPLICA";
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
}

interface SnapshotConfig extends BaseDRConfig {
  solutionType: "SNAPSHOT";
  primary_region: string;
  dr_region: string;
  primary_db_identifier: string;
  project_name: string;
  sns_email: string;
  tags: {
    Environment: string;
    ManagedBy: string;
  };
}

type DRConfig = ReadReplicaConfig | SnapshotConfig;

interface DRConfigFormProps {
  onSubmit: (config: DRConfig) => void;
  loading?: boolean;
}

const DRConfigForm: React.FC<DRConfigFormProps> = ({
  onSubmit,
  loading = false,
}) => {
  const { showWarning, showInfo } = useNotification();
  const [solutionType, setSolutionType] = useState<"READ_REPLICA" | "SNAPSHOT">(
    "READ_REPLICA"
  );

  const [readReplicaConfig, setReadReplicaConfig] = useState({
    aws_region: "eu-central-1",
    aws_read_replica_region: "eu-west-1",
    primary_db_identifier: "",
    read_replica_identifier: "",
    instance_class: "db.t3.micro",
    vpc_cidr: "172.16.0.0/16",
    public_subnet_cidrs: ["172.16.1.0/24", "172.16.2.0/24"],
    notification_email: "",
    environment: "production",
    tag_name: "",
    iamRoleArn: "",
    externalId: "",
  });

  const [snapshotConfig, setSnapshotConfig] = useState({
    primary_region: "eu-central-1",
    dr_region: "eu-west-1",
    primary_db_identifier: "",
    project_name: "rds-dr",
    sns_email: "",
    tags: {
      Environment: "DR",
      ManagedBy: "Terraform",
    },
    iamRoleArn: "",
    externalId: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (solutionType === "READ_REPLICA") {
      // Validate read replica config
      if (
        readReplicaConfig.aws_region ===
        readReplicaConfig.aws_read_replica_region
      ) {
        showWarning(
          "Invalid Configuration",
          "Primary and read replica regions must be different for disaster recovery."
        );
        return;
      }

      if (readReplicaConfig.public_subnet_cidrs.some((cidr) => !cidr.trim())) {
        showWarning(
          "Invalid Configuration",
          "All subnet CIDRs must be filled in."
        );
        return;
      }

      const config: ReadReplicaConfig = {
        solutionType: "READ_REPLICA",
        ...readReplicaConfig,
      };

      showInfo(
        "Deployment Started",
        "Your Read Replica DR configuration is being deployed. You can monitor progress in real-time."
      );
      onSubmit(config);
    } else {
      // Validate snapshot config
      if (snapshotConfig.primary_region === snapshotConfig.dr_region) {
        showWarning(
          "Invalid Configuration",
          "Primary and DR regions must be different for disaster recovery."
        );
        return;
      }

      const config: SnapshotConfig = {
        solutionType: "SNAPSHOT",
        ...snapshotConfig,
      };

      showInfo(
        "Deployment Started",
        "Your Snapshot-based DR configuration is being deployed. You can monitor progress in real-time."
      );
      onSubmit(config);
    }
  };

  const handleReadReplicaSubnetChange = (index: number, value: string) => {
    const newSubnets = [...readReplicaConfig.public_subnet_cidrs];
    newSubnets[index] = value;
    setReadReplicaConfig({
      ...readReplicaConfig,
      public_subnet_cidrs: newSubnets,
    });
  };

  const addSubnet = () => {
    setReadReplicaConfig({
      ...readReplicaConfig,
      public_subnet_cidrs: [...readReplicaConfig.public_subnet_cidrs, ""],
    });
  };

  const removeSubnet = (index: number) => {
    const newSubnets = readReplicaConfig.public_subnet_cidrs.filter(
      (_, i) => i !== index
    );
    setReadReplicaConfig({
      ...readReplicaConfig,
      public_subnet_cidrs: newSubnets,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <Database className="h-6 w-6 text-brand-primary mr-3" />
        <h2 className="text-xl font-semibold text-gray-900">
          DR Configuration
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Solution Type Selection */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="text-sm font-medium text-gray-700 mb-3 block">
            Select Disaster Recovery Solution
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="relative cursor-pointer">
              <input
                type="radio"
                name="solutionType"
                value="READ_REPLICA"
                checked={solutionType === "READ_REPLICA"}
                onChange={(e) =>
                  setSolutionType(e.target.value as "READ_REPLICA" | "SNAPSHOT")
                }
                className="sr-only"
              />
              <div
                className={`p-4 border-2 rounded-lg transition-colors ${
                  solutionType === "READ_REPLICA"
                    ? "border-brand-primary bg-brand-primary/5"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center mb-2">
                  <Copy className="h-5 w-5 text-brand-primary mr-2" />
                  <span className="font-medium">Read Replica</span>
                </div>
                <p className="text-sm text-gray-600">
                  Real-time replication with automatic failover. Best for high
                  availability.
                </p>
              </div>
            </label>

            <label className="relative cursor-pointer">
              <input
                type="radio"
                name="solutionType"
                value="SNAPSHOT"
                checked={solutionType === "SNAPSHOT"}
                onChange={(e) =>
                  setSolutionType(e.target.value as "READ_REPLICA" | "SNAPSHOT")
                }
                className="sr-only"
              />
              <div
                className={`p-4 border-2 rounded-lg transition-colors ${
                  solutionType === "SNAPSHOT"
                    ? "border-brand-primary bg-brand-primary/5"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center mb-2">
                  <Camera className="h-5 w-5 text-brand-primary mr-2" />
                  <span className="font-medium">Snapshot-based</span>
                </div>
                <p className="text-sm text-gray-600">
                  Automated snapshots with cross-region backup. Cost-effective
                  solution.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* AWS Credentials - Common for both solutions */}
        <div className="bg-brand-secondary/5 p-4 rounded-lg border border-brand-secondary/20">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Key className="h-5 w-5 text-brand-secondary mr-2" />
            AWS Credentials
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                IAM Role ARN
              </label>
              <input
                type="text"
                value={
                  solutionType === "READ_REPLICA"
                    ? readReplicaConfig.iamRoleArn
                    : snapshotConfig.iamRoleArn
                }
                onChange={(e) => {
                  if (solutionType === "READ_REPLICA") {
                    setReadReplicaConfig({
                      ...readReplicaConfig,
                      iamRoleArn: e.target.value,
                    });
                  } else {
                    setSnapshotConfig({
                      ...snapshotConfig,
                      iamRoleArn: e.target.value,
                    });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                placeholder="arn:aws:iam::123456789012:role/your-role"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                External ID
              </label>
              <input
                type="text"
                value={
                  solutionType === "READ_REPLICA"
                    ? readReplicaConfig.externalId
                    : snapshotConfig.externalId
                }
                onChange={(e) => {
                  if (solutionType === "READ_REPLICA") {
                    setReadReplicaConfig({
                      ...readReplicaConfig,
                      externalId: e.target.value,
                    });
                  } else {
                    setSnapshotConfig({
                      ...snapshotConfig,
                      externalId: e.target.value,
                    });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                placeholder="your-external-id"
                required
              />
            </div>
          </div>
        </div>

        {/* Read Replica Configuration */}
        {solutionType === "READ_REPLICA" && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Copy className="h-5 w-5 text-brand-primary mr-2" />
              Read Replica Configuration
            </h3>

            {/* AWS Regions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Globe className="h-4 w-4 mr-2" />
                  Primary AWS Region
                </label>
                <select
                  value={readReplicaConfig.aws_region}
                  onChange={(e) =>
                    setReadReplicaConfig({
                      ...readReplicaConfig,
                      aws_region: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
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
                  value={readReplicaConfig.aws_read_replica_region}
                  onChange={(e) =>
                    setReadReplicaConfig({
                      ...readReplicaConfig,
                      aws_read_replica_region: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
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
                  value={readReplicaConfig.primary_db_identifier}
                  onChange={(e) =>
                    setReadReplicaConfig({
                      ...readReplicaConfig,
                      primary_db_identifier: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
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
                  value={readReplicaConfig.read_replica_identifier}
                  onChange={(e) =>
                    setReadReplicaConfig({
                      ...readReplicaConfig,
                      read_replica_identifier: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
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
                value={readReplicaConfig.instance_class}
                onChange={(e) =>
                  setReadReplicaConfig({
                    ...readReplicaConfig,
                    instance_class: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
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
                value={readReplicaConfig.vpc_cidr}
                onChange={(e) =>
                  setReadReplicaConfig({
                    ...readReplicaConfig,
                    vpc_cidr: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
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
              <div className="space-y-2">
                {readReplicaConfig.public_subnet_cidrs.map((cidr, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={cidr}
                      onChange={(e) =>
                        handleReadReplicaSubnetChange(index, e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                      placeholder="e.g., 172.16.1.0/24"
                      required
                    />
                    {readReplicaConfig.public_subnet_cidrs.length > 1 && (
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
                  className="text-brand-primary hover:text-brand-primary/80 text-sm"
                >
                  + Add Subnet
                </button>
              </div>
            </div>

            {/* Notification Email */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 mr-2" />
                Notification Email
              </label>
              <input
                type="email"
                value={readReplicaConfig.notification_email}
                onChange={(e) =>
                  setReadReplicaConfig({
                    ...readReplicaConfig,
                    notification_email: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                placeholder="admin@company.com"
                required
              />
            </div>

            {/* Environment and Tag */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Shield className="h-4 w-4 mr-2" />
                  Environment
                </label>
                <select
                  value={readReplicaConfig.environment}
                  onChange={(e) =>
                    setReadReplicaConfig({
                      ...readReplicaConfig,
                      environment: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
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
                  value={readReplicaConfig.tag_name}
                  onChange={(e) =>
                    setReadReplicaConfig({
                      ...readReplicaConfig,
                      tag_name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                  placeholder="e.g., mycompany-dr"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Snapshot Configuration */}
        {solutionType === "SNAPSHOT" && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Camera className="h-5 w-5 text-brand-primary mr-2" />
              Snapshot Configuration
            </h3>

            {/* AWS Regions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Globe className="h-4 w-4 mr-2" />
                  Primary Region
                </label>
                <select
                  value={snapshotConfig.primary_region}
                  onChange={(e) =>
                    setSnapshotConfig({
                      ...snapshotConfig,
                      primary_region: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
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
                  DR Region
                </label>
                <select
                  value={snapshotConfig.dr_region}
                  onChange={(e) =>
                    setSnapshotConfig({
                      ...snapshotConfig,
                      dr_region: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                  required
                >
                  <option value="eu-west-1">EU West 1 (Ireland)</option>
                  <option value="eu-central-1">EU Central 1 (Frankfurt)</option>
                  <option value="us-east-1">US East 1 (N. Virginia)</option>
                  <option value="us-west-2">US West 2 (Oregon)</option>
                </select>
              </div>
            </div>

            {/* Database Identifier and Project Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Database className="h-4 w-4 mr-2" />
                  Primary DB Identifier
                </label>
                <input
                  type="text"
                  value={snapshotConfig.primary_db_identifier}
                  onChange={(e) =>
                    setSnapshotConfig({
                      ...snapshotConfig,
                      primary_db_identifier: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                  placeholder="e.g., mycompany-primary-db"
                  required
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Tag className="h-4 w-4 mr-2" />
                  Project Name
                </label>
                <input
                  type="text"
                  value={snapshotConfig.project_name}
                  onChange={(e) =>
                    setSnapshotConfig({
                      ...snapshotConfig,
                      project_name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                  placeholder="e.g., rds-dr"
                  required
                />
              </div>
            </div>

            {/* SNS Email */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 mr-2" />
                SNS Notification Email
              </label>
              <input
                type="email"
                value={snapshotConfig.sns_email}
                onChange={(e) =>
                  setSnapshotConfig({
                    ...snapshotConfig,
                    sns_email: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                placeholder="admin@company.com"
                required
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-6 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Deploying..." : "Deploy DR Solution"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DRConfigForm;
