import express from 'express';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { requireAdmin, requireCompanyAccess } from '../middleware/auth.js';
import { createDeployment, getDeploymentLogs, destroyDeployment } from '../services/deployment.js';
import { saveCredentials } from '../services/credentials.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get deployments
router.get('/', async (req, res) => {
  try {
    const { companyId } = req.query;
    
    let whereClause = {};
    
    if (req.user.role === 'ADMIN') {
      if (companyId) {
        whereClause.companyId = companyId;
      }
    } else {
      whereClause.companyId = req.user.companyId;
    }

    const deployments = await prisma.deployment.findMany({
      where: whereClause,
      include: {
        company: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(deployments);
  } catch (error) {
    console.error('Error fetching deployments:', error);
    res.status(500).json({ error: 'Failed to fetch deployments' });
  }
});

// Get deployment by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deployment = await prisma.deployment.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true }
        }
      }
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    // Check access
    if (req.user.role !== 'ADMIN' && req.user.companyId !== deployment.companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(deployment);
  } catch (error) {
    console.error('Error fetching deployment:', error);
    res.status(500).json({ error: 'Failed to fetch deployment' });
  }
});

// Create deployment
router.post('/', async (req, res) => {
  try {
    const {
      companyId,
      drConfig,
      iamRoleArn,
      externalId
    } = req.body;

    // Validate required fields
    if (!companyId || !drConfig || !iamRoleArn || !externalId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check company access
    if (req.user.role !== 'ADMIN' && req.user.companyId !== companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate DR config required fields
    const requiredFields = [
      'aws_region',
      'aws_read_replica_region',
      'primary_db_identifier',
      'read_replica_identifier',
      'instance_class',
      'vpc_cidr',
      'public_subnet_cidrs',
      'notification_email',
      'environment',
      'tag_name'
    ];

    for (const field of requiredFields) {
      if (!drConfig[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // Save credentials first
    await saveCredentials(companyId, iamRoleArn, externalId);

    // Create deployment
    const deployment = await createDeployment(companyId, drConfig);

    res.status(201).json(deployment);
  } catch (error) {
    console.error('Error creating deployment:', error);
    res.status(500).json({ 
      error: 'Failed to create deployment',
      message: error.message 
    });
  }
});

// Get deployment logs
router.get('/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deployment = await prisma.deployment.findUnique({
      where: { id },
      select: { id: true, companyId: true, logs: true }
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    // Check access
    if (req.user.role !== 'ADMIN' && req.user.companyId !== deployment.companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const logs = await getDeploymentLogs(id);
    res.json({ logs });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Destroy deployment
router.post('/:id/destroy', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deployment = await prisma.deployment.findUnique({
      where: { id },
      select: { id: true, companyId: true, status: true }
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    // Check access
    if (req.user.role !== 'ADMIN' && req.user.companyId !== deployment.companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only allow destroy of successful deployments
    if (deployment.status !== 'SUCCEEDED') {
      return res.status(400).json({ error: 'Can only destroy successful deployments' });
    }

    const destroyDeploymentRecord = await destroyDeployment(id);
    res.status(201).json(destroyDeploymentRecord);
  } catch (error) {
    console.error('Error destroying deployment:', error);
    res.status(500).json({ 
      error: 'Failed to destroy deployment',
      message: error.message 
    });
  }
});

// Update deployment status (for manual status updates)
router.patch('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const deployment = await prisma.deployment.update({
      where: { id },
      data: { status }
    });

    res.json(deployment);
  } catch (error) {
    console.error('Error updating deployment status:', error);
    res.status(500).json({ error: 'Failed to update deployment status' });
  }
});

export default router;