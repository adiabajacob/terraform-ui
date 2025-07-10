import React, { useState } from "react";
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Users,
  Calendar,
  X,
  Save,
} from "lucide-react";
import { useNotification } from "../contexts/NotificationContext";

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

interface CompanyManagementProps {
  companies: Company[];
  onRefresh: () => void;
}

const CompanyManagement: React.FC<CompanyManagementProps> = ({
  companies,
  onRefresh,
}) => {
  const { showSuccess, showError } = useNotification();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    contactEmail: "",
    sendEmail: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create company");
      }

      setShowCreateModal(false);
      setFormData({ name: "", contactEmail: "", sendEmail: true });
      onRefresh();
      const result = await response.json();
      showSuccess(
        "Company Created",
        result.message || `${formData.name} has been created successfully.`
      );

      if (result.warning) {
        showError("Email Warning", result.warning);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create company";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/companies/${editingCompany.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update company");
      }

      setEditingCompany(null);
      setFormData({ name: "", contactEmail: "", sendEmail: true });
      onRefresh();
      showSuccess(
        "Company Updated",
        `${formData.name} has been updated successfully.`
      );
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update company";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (companyId: string, companyName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${companyName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/companies/${companyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete company");
      }

      onRefresh();
      showSuccess(
        "Company Deleted",
        `${companyName} has been deleted successfully.`
      );
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete company";
      showError("Delete Failed", errorMessage);
    }
  };

  const openEditModal = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      contactEmail: company.contactEmail,
      sendEmail: true,
    });
    setError("");
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setEditingCompany(null);
    setFormData({ name: "", contactEmail: "", sendEmail: true });
    setError("");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Companies</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90 flex items-center transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </button>
      </div>

      {companies.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No companies found</p>
          <p className="text-sm text-gray-400">
            Create your first company to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <div
              key={company.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <Building2 className="h-8 w-8 text-brand-primary mr-3" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {company.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Created {new Date(company.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(company)}
                    className="p-1 text-gray-400 hover:text-brand-primary transition-colors"
                    title="Edit company"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(company.id, company.name)}
                    className="p-1 text-gray-400 hover:text-brand-secondary transition-colors"
                    title="Delete company"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {company.contactEmail}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-500">
                    <Users className="h-4 w-4 mr-1" />
                    {company._count.users} users
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    {company._count.deployments} deployments
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Company Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Create New Company
              </h3>
              <button
                onClick={closeModals}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter company name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, contactEmail: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="contact@company.com"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sendEmail"
                  checked={formData.sendEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, sendEmail: e.target.checked })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="sendEmail"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Send login credentials via email
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Create Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {editingCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Company
              </h3>
              <button
                onClick={closeModals}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter company name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, contactEmail: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="contact@company.com"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Update Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyManagement;
