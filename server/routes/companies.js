import express from 'express';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { requireAdmin } from '../middleware/auth.js';
import { sendCompanyCredentials } from '../services/email.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

// Get all companies (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        users: {
          select: { id: true, email: true, role: true }
        },
        deployments: {
          select: { id: true, status: true, createdAt: true }
        },
        _count: {
          select: { users: true, deployments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Get company by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check access
    if (req.user.role !== 'ADMIN' && req.user.companyId !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, email: true, role: true }
        },
        deployments: {
          orderBy: { createdAt: 'desc' }
        },
        credentials: true
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

// Create company (admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, contactEmail, sendEmail = true } = req.body;

    if (!name || !contactEmail) {
      return res.status(400).json({ error: 'Name and contact email are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: contactEmail.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    // Generate a secure random password
    const generatedPassword = crypto.randomBytes(12).toString('base64').slice(0, 16);
    const passwordHash = await bcrypt.hash(generatedPassword, 12);

    // Create company and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: name.trim(),
          contactEmail: contactEmail.toLowerCase()
        }
      });

      const user = await tx.user.create({
        data: {
          email: contactEmail.toLowerCase(),
          passwordHash,
          role: 'COMPANY',
          companyId: company.id
        }
      });

      return { company, user };
    });

    // Send email with credentials if requested
    if (sendEmail) {
      try {
        await sendCompanyCredentials(name, contactEmail, generatedPassword);
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Don't fail the entire operation if email fails
        return res.status(201).json({
          ...result.company,
          warning: 'Company created successfully, but failed to send email notification'
        });
      }
    }

    res.status(201).json({
      ...result.company,
      message: sendEmail ? 'Company created and credentials sent via email' : 'Company created successfully',
      ...(process.env.NODE_ENV === 'development' && !sendEmail ? { generatedPassword } : {})
    });
  } catch (error) {
    console.error('Error creating company:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A company with this email already exists' });
    }
    res.status(500).json({ error: 'Failed to create company: ' + error.message });
  }
});

// Update company
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contactEmail } = req.body;

    if (!name || !contactEmail) {
      return res.status(400).json({ error: 'Name and contact email are required' });
    }

    // Check access
    if (req.user.role !== 'ADMIN' && req.user.companyId !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const company = await prisma.company.update({
      where: { id },
      data: { 
        name: name.trim(), 
        contactEmail: contactEmail.trim().toLowerCase() 
      }
    });

    res.json(company);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A company with this email already exists' });
    }
    console.error('Error updating company:', error);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

// Delete company (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if company has deployments
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: { deployments: true }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (company._count.deployments > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete company with existing deployments' 
      });
    }

    // Delete company and associated user in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete associated user first
      await tx.user.deleteMany({
        where: { companyId: id }
      });
      
      // Then delete the company
      await tx.company.delete({
        where: { id }
      });
    });

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

export default router;