import React from "react";
import { Eye, Trash2, Copy, Camera } from "lucide-react";
import StatusBadge from "./StatusBadge";

interface Deployment {
  id: string;
  status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";
  solutionType: "READ_REPLICA" | "SNAPSHOT";
  createdAt: string;
  terraformVarsJson: string;
}

interface ReadReplicaConfig {
  aws_region: string;
  aws_read_replica_region: string;
  environment: string;
  instance_class: string;
  read_replica_identifier: string;
  tag_name: string;
  primary_db_identifier: string;
}

interface SnapshotConfig {
  primary_region: string;
  dr_region: string;
  project_name: string;
  primary_db_identifier: string;
  sns_email: string;
  tags?: { Environment?: string };
}

interface DeploymentListProps {
  deployments: Deployment[];
  onSelectDeployment: (deployment: Deployment) => void;
  onDestroyDeployment?: (deploymentId: string) => void;
}

const DeploymentList: React.FC<DeploymentListProps> = ({
  deployments,
  onSelectDeployment,
  onDestroyDeployment,
}) => {
  const handleDestroy = (deploymentId: string, dbIdentifier: string) => {
    if (!onDestroyDeployment) return;

    if (
      confirm(
        `Are you sure you want to destroy the infrastructure for "${dbIdentifier}"? This action cannot be undone.`
      )
    ) {
      onDestroyDeployment(deploymentId);
    }
  };

  const getSolutionIcon = (solutionType: string) => {
    return solutionType === "READ_REPLICA" ? (
      <Copy className="h-4 w-4 text-brand-primary" />
    ) : (
      <Camera className="h-4 w-4 text-brand-secondary" />
    );
  };

  const getSolutionLabel = (solutionType: string) => {
    return solutionType === "READ_REPLICA" ? "Read Replica" : "Snapshot";
  };

  const getRegionInfo = (
    config: ReadReplicaConfig | SnapshotConfig,
    solutionType: string
  ) => {
    if (solutionType === "READ_REPLICA") {
      const readReplicaConfig = config as ReadReplicaConfig;
      return `${readReplicaConfig.aws_region} → ${readReplicaConfig.aws_read_replica_region}`;
    } else {
      const snapshotConfig = config as SnapshotConfig;
      return `${snapshotConfig.primary_region} → ${snapshotConfig.dr_region}`;
    }
  };

  const getConfigDetails = (
    config: ReadReplicaConfig | SnapshotConfig,
    solutionType: string
  ) => {
    if (solutionType === "READ_REPLICA") {
      const readReplicaConfig = config as ReadReplicaConfig;
      return [
        { label: "Environment", value: readReplicaConfig.environment },
        { label: "Instance", value: readReplicaConfig.instance_class },
        { label: "Replica", value: readReplicaConfig.read_replica_identifier },
        { label: "Tag", value: readReplicaConfig.tag_name },
      ];
    } else {
      const snapshotConfig = config as SnapshotConfig;
      return [
        { label: "Project", value: snapshotConfig.project_name },
        { label: "Primary DB", value: snapshotConfig.primary_db_identifier },
        { label: "SNS Email", value: snapshotConfig.sns_email },
        { label: "Tags", value: `${snapshotConfig.tags?.Environment || "DR"}` },
      ];
    }
  };

  if (deployments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No deployments found</p>
        <p className="text-sm text-gray-400 mt-2">
          Create your first deployment to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Deployment History
      </h3>

      <div className="space-y-3">
        {deployments.map((deployment) => {
          const config = JSON.parse(deployment.terraformVarsJson);
          const details = getConfigDetails(config, deployment.solutionType);

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
                        {config.primary_db_identifier ||
                          config.primary_db_identifier}
                      </span>
                      <div className="flex items-center space-x-1">
                        {getSolutionIcon(deployment.solutionType)}
                        <span className="text-xs text-gray-500">
                          {getSolutionLabel(deployment.solutionType)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {getRegionInfo(config, deployment.solutionType)}
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
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-brand-primary hover:text-brand-primary/80 hover:bg-brand-primary/10 rounded-md transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Logs</span>
                  </button>

                  {onDestroyDeployment && deployment.status === "SUCCEEDED" && (
                    <button
                      onClick={() =>
                        handleDestroy(
                          deployment.id,
                          config.primary_db_identifier ||
                            config.primary_db_identifier
                        )
                      }
                      className="flex items-center space-x-1 px-3 py-1 text-sm text-brand-secondary hover:text-brand-secondary/80 hover:bg-brand-secondary/10 rounded-md transition-colors"
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
                  {details.map((detail, index) => (
                    <div key={index}>
                      <span className="text-gray-500">{detail.label}:</span>
                      <span className="ml-2 font-medium">{detail.value}</span>
                    </div>
                  ))}
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
