#!/bin/bash

set -euo pipefail

# === Prompt user for each input ===
read -p "Enter primary region: " PRIMARY_REGION
read -p "Enter DR region: " DR_REGION
read -p "Enter DB identifier: " PRIMARY_DB_IDENTIFIER
read -p "Enter SNS email: " SNS_EMAIL

echo "🔧 Initializing Terraform..."
terraform init

echo "📐 Planning Terraform with user input..."
terraform plan \
  -var="primary_region=${PRIMARY_REGION}" \
  -var="dr_region=${DR_REGION}" \
  -var="primary_db_identifier=${PRIMARY_DB_IDENTIFIER}" \
  -var="sns_email=${SNS_EMAIL}" \
  -out=tfplan.out

echo "🚀 Applying Terraform plan (auto-approve)..."
terraform apply -auto-approve tfplan.out

echo "✅ Terraform apply complete."
