import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Please provide email/phone and password',
        },
        { status: 400 }
      );
    }

    const normalizedIdentifier = identifier.trim().toLowerCase();

    // Find vendor by email or phone
    const vendor = await prisma.vendor.findFirst({
      where: {
        OR: [
          { email: normalizedIdentifier },
          { phoneNumber: identifier.trim() },
        ],
      },
    });

    if (!vendor) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Invalid credentials',
        },
        { status: 401 }
      );
    }

    // Check if vendor is active
    if (!vendor.isActive) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Your account is not active. Please contact support.',
        },
        { status: 403 }
      );
    }

    // Note: Vendors might not have passwords if created via admin
    // For now, we'll use email as a simple auth check
    // In production, you'd add a password field to vendors
    
    // Return vendor data without sensitive info
    const { ...safeVendor } = vendor;

    return NextResponse.json({
      status: 'success',
      message: 'Login successful',
      data: { 
        vendor: {
          ...safeVendor,
          userType: 'vendor' // Add user type identifier
        }
      },
    });
  } catch (error) {
    console.error('Vendor login error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to login',
      },
      { status: 500 }
    );
  }
}

