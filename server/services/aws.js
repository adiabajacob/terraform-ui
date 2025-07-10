import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

export const getTemporaryCredentials = async (companyId) => {
  try {
    // Get company credentials
    const credentials = await prisma.companyCredential.findUnique({
      where: { companyId }
    });

    if (!credentials) {
      throw new Error('Company credentials not found');
    }

    // Configure AWS STS client
    const stsClient = new STSClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    // Assume role with external ID
    const command = new AssumeRoleCommand({
      RoleArn: credentials.iamRoleArn,
      RoleSessionName: `dr-deployment-${companyId}-${Date.now()}`,
      ExternalId: credentials.externalId,
      DurationSeconds: 3600 // 1 hour
    });

    const result = await stsClient.send(command);
    return result.Credentials;
  } catch (error) {
    console.error('Error assuming role:', error);
    throw new Error('Failed to assume AWS role: ' + error.message);
  }
};

export const validateCredentials = async (iamRoleArn, externalId) => {
  try {
    const stsClient = new STSClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    const command = new AssumeRoleCommand({
      RoleArn: iamRoleArn,
      RoleSessionName: `validation-${Date.now()}`,
      ExternalId: externalId,
      DurationSeconds: 900 // 15 minutes
    });

    await stsClient.send(command);
    return true;
  } catch (error) {
    console.error('Credential validation failed:', error);
    return false;
  }
};