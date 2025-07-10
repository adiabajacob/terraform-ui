import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import { getTemporaryCredentials } from "./aws.js";
import { broadcastToCompany } from "./websocket.js";

const prisma = new PrismaClient();

export const createDeployment = async (
  companyId,
  drConfig,
  solutionType = "READ_REPLICA"
) => {
  try {
    // Write tfvars file
    await writeTfvarsFile(companyId, drConfig, solutionType);

    // Create deployment record
    const deployment = await prisma.deployment.create({
      data: {
        companyId,
        solutionType,
        terraformVarsJson: JSON.stringify(drConfig),
        status: "PENDING",
      },
      include: {
        company: {
          select: { id: true, name: true },
        },
      },
    });

    // Execute deployment asynchronously
    setTimeout(() => {
      executeDeployment(deployment.id, companyId, solutionType);
    }, 1000);

    return deployment;
  } catch (error) {
    console.error("Error creating deployment:", error);
    throw error;
  }
};

const writeTfvarsFile = async (companyId, drConfig, solutionType) => {
  try {
    // Determine the correct Terraform directory based on solution type
    const terraformBaseDir =
      solutionType === "SNAPSHOT" ? "snapshot-resources" : "terraform";
    const tfvarsDir = path.join(
      process.cwd(),
      "..",
      terraformBaseDir,
      "tfvars"
    );
    await fs.mkdir(tfvarsDir, { recursive: true });

    let tfvarsContent;

    if (solutionType === "SNAPSHOT") {
      // Generate tfvars content for snapshot solution
      tfvarsContent = Object.entries(drConfig)
        .filter(
          ([key]) => !["iamRoleArn", "externalId", "solutionType"].includes(key)
        ) // Exclude credentials and solution type
        .map(([key, value]) => {
          if (typeof value === "string") {
            return `${key} = "${value}"`;
          } else if (Array.isArray(value)) {
            return `${key} = [${value.map((v) => `"${v}"`).join(", ")}]`;
          } else if (typeof value === "object" && value !== null) {
            // Handle nested objects like tags
            const objectContent = Object.entries(value)
              .map(([k, v]) => `    ${k} = "${v}"`)
              .join("\n");
            return `${key} = {\n${objectContent}\n  }`;
          } else {
            return `${key} = ${value}`;
          }
        })
        .join("\n");
    } else {
      // Generate tfvars content for read replica solution (existing logic)
      tfvarsContent = Object.entries(drConfig)
        .filter(
          ([key]) => !["iamRoleArn", "externalId", "solutionType"].includes(key)
        ) // Exclude credentials and solution type
        .map(([key, value]) => {
          if (typeof value === "string") {
            return `${key} = "${value}"`;
          } else if (Array.isArray(value)) {
            return `${key} = [${value.map((v) => `"${v}"`).join(", ")}]`;
          } else {
            return `${key} = ${value}`;
          }
        })
        .join("\n");
    }

    const filePath = path.join(tfvarsDir, `company_${companyId}.tfvars`);
    await fs.writeFile(filePath, tfvarsContent);

    console.log(`Tfvars file written: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error("Error writing tfvars file:", error);
    throw error;
  }
};

const executeDeployment = async (deploymentId, companyId, solutionType) => {
  let logs = "";

  try {
    // Update status to RUNNING
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: { status: "RUNNING" },
    });

    // Broadcast status update
    broadcastToCompany(companyId, {
      type: "deployment_status",
      deploymentId,
      status: "RUNNING",
      message: "Deployment started",
    });

    // Get AWS credentials
    const credentials = await getTemporaryCredentials(companyId);

    // Set up environment variables
    const env = {
      ...process.env,
      AWS_ACCESS_KEY_ID: credentials.AccessKeyId,
      AWS_SECRET_ACCESS_KEY: credentials.SecretAccessKey,
      AWS_SESSION_TOKEN: credentials.SessionToken,
      AWS_REGION: process.env.AWS_REGION || "us-east-1",
    };

    // Determine the correct Terraform directory based on solution type
    const terraformBaseDir =
      solutionType === "SNAPSHOT" ? "snapshot-resources" : "terraform";
    const tfvarsFile = path.join(
      process.cwd(),
      "..",
      terraformBaseDir,
      "tfvars",
      `company_${companyId}.tfvars`
    );
    const terraformDir = path.join(process.cwd(), "..", terraformBaseDir);

    // Check if terraform directory exists
    try {
      await fs.access(terraformDir);
    } catch (error) {
      throw new Error(
        `Terraform directory not found. Please ensure terraform configuration exists in ./${terraformBaseDir}/`
      );
    }

    // Run terraform init
    logs += `=== Running terraform init (${solutionType}) ===\n`;
    await runTerraformCommand(
      "init",
      [],
      terraformDir,
      env,
      deploymentId,
      companyId,
      (output) => {
        logs += output + "\n";
      }
    );

    // Create or select workspace for this company
    logs += "\n=== Managing workspace ===\n";
    try {
      // Try to create a new workspace
      await runTerraformCommand(
        "workspace",
        ["new", companyId],
        terraformDir,
        env,
        deploymentId,
        companyId,
        (output) => {
          logs += output + "\n";
        }
      );
    } catch (error) {
      // If workspace already exists, select it
      await runTerraformCommand(
        "workspace",
        ["select", companyId],
        terraformDir,
        env,
        deploymentId,
        companyId,
        (output) => {
          logs += output + "\n";
        }
      );
    }

    // Run terraform plan
    logs += "\n=== Running terraform plan ===\n";
    await runTerraformCommand(
      "plan",
      ["-var-file=" + tfvarsFile],
      terraformDir,
      env,
      deploymentId,
      companyId,
      (output) => {
        logs += output + "\n";
      }
    );

    // Run terraform apply
    logs += "\n=== Running terraform apply ===\n";
    await runTerraformCommand(
      "apply",
      ["-var-file=" + tfvarsFile, "-auto-approve"],
      terraformDir,
      env,
      deploymentId,
      companyId,
      (output) => {
        logs += output + "\n";
      }
    );

    // Update deployment as successful
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: "SUCCEEDED",
        logs,
      },
    });

    broadcastToCompany(companyId, {
      type: "deployment_status",
      deploymentId,
      status: "SUCCEEDED",
      message: "Deployment completed successfully",
    });
  } catch (error) {
    console.error("Deployment failed:", error);

    logs += `\n=== DEPLOYMENT FAILED ===\n${error.message}\n`;

    // Update deployment as failed
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: "FAILED",
        logs,
      },
    });

    broadcastToCompany(companyId, {
      type: "deployment_status",
      deploymentId,
      status: "FAILED",
      message: "Deployment failed: " + error.message,
    });
  }
};

const runTerraformCommand = (
  command,
  args,
  cwd,
  env,
  deploymentId,
  companyId,
  onOutput
) => {
  return new Promise((resolve, reject) => {
    console.log(`Running terraform ${command} in ${cwd}`);

    const terraform = spawn("terraform", [command, ...args], {
      cwd,
      env,
      stdio: "pipe",
    });

    terraform.stdout.on("data", (data) => {
      const output = data.toString();
      console.log("STDOUT:", output);
      onOutput(output);

      // Broadcast real-time logs
      broadcastToCompany(companyId, {
        type: "deployment_log",
        deploymentId,
        log: output,
      });
    });

    terraform.stderr.on("data", (data) => {
      const output = data.toString();
      console.log("STDERR:", output);
      onOutput(output);

      // Broadcast real-time logs
      broadcastToCompany(companyId, {
        type: "deployment_log",
        deploymentId,
        log: output,
      });
    });

    terraform.on("close", (code) => {
      console.log(`Terraform ${command} exited with code ${code}`);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Terraform ${command} failed with exit code ${code}`));
      }
    });

    terraform.on("error", (error) => {
      console.error(`Terraform ${command} error:`, error);
      reject(error);
    });
  });
};

export const getDeploymentLogs = async (deploymentId) => {
  try {
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      select: { logs: true },
    });

    return deployment?.logs || "";
  } catch (error) {
    console.error("Error fetching deployment logs:", error);
    throw error;
  }
};

export const destroyDeployment = async (deploymentId) => {
  try {
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: { company: true },
    });

    if (!deployment) {
      throw new Error("Deployment not found");
    }

    const companyId = deployment.companyId;
    const drConfig = JSON.parse(deployment.terraformVarsJson);
    const solutionType = deployment.solutionType; // Get solution type from deployment record

    // Create destroy deployment record
    const destroyDeployment = await prisma.deployment.create({
      data: {
        companyId,
        terraformVarsJson: deployment.terraformVarsJson,
        status: "RUNNING",
      },
    });

    // Execute terraform destroy
    setTimeout(() => {
      executeDestroy(destroyDeployment.id, companyId, drConfig, solutionType);
    }, 1000);

    return destroyDeployment;
  } catch (error) {
    console.error("Error initiating destroy:", error);
    throw error;
  }
};

const executeDestroy = async (
  deploymentId,
  companyId,
  drConfig,
  solutionType
) => {
  let logs = "";

  try {
    // Get AWS credentials
    const credentials = await getTemporaryCredentials(companyId);

    // Set up environment variables
    const env = {
      ...process.env,
      AWS_ACCESS_KEY_ID: credentials.AccessKeyId,
      AWS_SECRET_ACCESS_KEY: credentials.SecretAccessKey,
      AWS_SESSION_TOKEN: credentials.SessionToken,
      AWS_REGION: process.env.AWS_REGION || "us-east-1",
    };

    // Determine the correct Terraform directory based on solution type
    const terraformBaseDir =
      solutionType === "SNAPSHOT" ? "snapshot-resources" : "terraform";
    const tfvarsFile = path.join(
      process.cwd(),
      "..",
      terraformBaseDir,
      "tfvars",
      `company_${companyId}.tfvars`
    );
    const terraformDir = path.join(process.cwd(), "..", terraformBaseDir);

    // Select workspace for this company
    logs += "=== Selecting workspace ===\n";
    await runTerraformCommand(
      "workspace",
      ["select", companyId],
      terraformDir,
      env,
      deploymentId,
      companyId,
      (output) => {
        logs += output + "\n";
      }
    );

    // Run terraform destroy
    logs += "=== Running terraform destroy ===\n";
    await runTerraformCommand(
      "destroy",
      ["-var-file=" + tfvarsFile, "-auto-approve"],
      terraformDir,
      env,
      deploymentId,
      companyId,
      (output) => {
        logs += output + "\n";
      }
    );

    // Update deployment as successful
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: "SUCCEEDED",
        logs,
      },
    });

    broadcastToCompany(companyId, {
      type: "deployment_status",
      deploymentId,
      status: "SUCCEEDED",
      message: "Infrastructure destroyed successfully",
    });
  } catch (error) {
    console.error("Destroy failed:", error);

    logs += `\n=== DESTROY FAILED ===\n${error.message}\n`;

    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: "FAILED",
        logs,
      },
    });

    broadcastToCompany(companyId, {
      type: "deployment_status",
      deploymentId,
      status: "FAILED",
      message: "Destroy failed: " + error.message,
    });
  }
};
