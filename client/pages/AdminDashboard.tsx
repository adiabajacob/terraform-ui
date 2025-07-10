import React, { useState, useEffect } from "react";
import { Building2, Activity, Database, Eye } from "lucide-react";
import CompanyManagement from "../components/CompanyManagement";
import LogViewer from "../components/LogViewer";

interface Company {
  id: string;
  name: string;
  contactEmail: string;
  createdAt: string;
  _count: {
    users: number;
    deployments: number;
  };
}

interface Deployment {
  id: string;
  status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";
  solutionType: "READ_REPLICA" | "SNAPSHOT";
  createdAt: string;
  terraformVarsJson: string;
  company: {
    id: string;
    name: string;
  };
}

const AdminDashboard: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"companies" | "deployments">(
    "companies"
  );
  const [selectedDeployment, setSelectedDeployment] =
    useState<Deployment | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [companiesRes, deploymentsRes] = await Promise.all([
        fetch("/api/companies", { headers }),
        fetch("/api/deployments", { headers }),
      ]);

      if (companiesRes.ok && deploymentsRes.ok) {
        const companiesData = await companiesRes.json();
        const deploymentsData = await deploymentsRes.json();

        setCompanies(companiesData);
        setDeployments(deploymentsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getOverallStats = () => {
    const totalDeployments = deployments.length;
    const runningDeployments = deployments.filter(
      (d) => d.status === "RUNNING"
    ).length;
    const successfulDeployments = deployments.filter(
      (d) => d.status === "SUCCEEDED"
    ).length;
    const failedDeployments = deployments.filter(
      (d) => d.status === "FAILED"
    ).length;

    return {
      totalCompanies: companies.length,
      totalDeployments,
      runningDeployments,
      successfulDeployments,
      failedDeployments,
    };
  };

  const stats = getOverallStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={() => setActiveTab("companies")}
            className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 transition-colors"
          >
            Manage Companies
          </button>
        </div>
        <p className="text-gray-600">
          Manage companies and monitor all deployments
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <Building2 className="h-5 w-5 text-brand-primary mr-2" />
            <div>
              <p className="text-sm text-gray-600">Companies</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalCompanies}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <Database className="h-5 w-5 text-brand-primary mr-2" />
            <div>
              <p className="text-sm text-gray-600">Total Deployments</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalDeployments}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <Activity className="h-5 w-5 text-brand-primary mr-2" />
            <div>
              <p className="text-sm text-gray-600">Running</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.runningDeployments}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="h-5 w-5 bg-green-500 rounded-full mr-2"></div>
            <div>
              <p className="text-sm text-gray-600">Successful</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.successfulDeployments}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="h-5 w-5 bg-brand-secondary rounded-full mr-2"></div>
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.failedDeployments}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("companies")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "companies"
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Building2 className="h-4 w-4 inline mr-2" />
              Companies
            </button>
            <button
              onClick={() => setActiveTab("deployments")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "deployments"
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Database className="h-4 w-4 inline mr-2" />
              All Deployments
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "companies" && (
            <CompanyManagement companies={companies} onRefresh={fetchData} />
          )}

          {activeTab === "deployments" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                All Deployments
              </h2>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {deployments.map((deployment) => (
                      <tr key={deployment.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {deployment.company.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {
                                  JSON.parse(deployment.terraformVarsJson)
                                    .primary_db_identifier
                                }
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              deployment.status === "SUCCEEDED"
                                ? "bg-green-100 text-green-800"
                                : deployment.status === "FAILED"
                                ? "bg-brand-secondary/10 text-brand-secondary"
                                : deployment.status === "RUNNING"
                                ? "bg-brand-primary/10 text-brand-primary"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {deployment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div>
                              {new Date(
                                deployment.createdAt
                              ).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(
                                deployment.createdAt
                              ).toLocaleTimeString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => setSelectedDeployment(deployment)}
                            className="flex items-center space-x-1 text-brand-primary hover:text-brand-primary/80"
                          >
                            <Eye className="h-4 w-4" />
                            View Logs
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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

export default AdminDashboard;
