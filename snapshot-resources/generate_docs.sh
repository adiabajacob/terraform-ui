#!/bin/bash

# Initialize DOCS.md
echo "<!-- BEGIN_TF_DOCS -->" > DOCS.md
echo "# Terraform DOCSumentation" >> DOCS.md

# Root documentation
echo "## Root Configuration" >> DOCS.md
terraform-docs markdown table . >> DOCS.md

# Module documentation
for module in modules/*/; do
  module_name=$(basename "$module")
  echo -e "\n## Module: $module_name\n" >> DOCS.md
  terraform-docs markdown table "$module" >> DOCS.md
done

echo "<!-- END_TF_DOCS -->" >> DOCS.md