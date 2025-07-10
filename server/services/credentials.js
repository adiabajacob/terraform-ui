import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { validateCredentials } from './aws.js';

const prisma = new PrismaClient();

export const saveCredentials = async (companyId, iamRoleArn, externalId) => {
  try {
    // Validate credentials before saving
    const isValid = await validateCredentials(iamRoleArn, externalId);
    
    if (!isValid) {
      throw new Error('Invalid AWS credentials provided');
    }

    // Save or update credentials
    const credentials = await prisma.companyCredential.upsert({
      where: { companyId },
      update: {
        iamRoleArn,
        externalId
      },
      create: {
        companyId,
        iamRoleArn,
        externalId
      }
    });

    return credentials;
  } catch (error) {
    console.error('Error saving credentials:', error);
    throw error;
  }
};

export const getCredentials = async (companyId) => {
  try {
    const credentials = await prisma.companyCredential.findUnique({
      where: { companyId }
    });

    return credentials;
  } catch (error) {
    console.error('Error fetching credentials:', error);
    throw error;
  }
};