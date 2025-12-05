import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/products/[id]/stock - Update product stock quantity (for cart operations)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { quantityChange, operation } = body; // quantityChange: positive to add, negative to subtract

    if (quantityChange === undefined || quantityChange === null) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Quantity change is required',
        },
        { status: 400 }
      );
    }

    // Get current product
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        stockQuantity: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Product not found',
        },
        { status: 404 }
      );
    }

    // Calculate new stock quantity
    const newStockQuantity = product.stockQuantity + quantityChange;

    // Validate stock cannot go negative
    if (newStockQuantity < 0) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Insufficient stock. Cannot reduce stock below 0.',
          data: {
            currentStock: product.stockQuantity,
            requestedChange: quantityChange,
          },
        },
        { status: 400 }
      );
    }

    // Update stock quantity
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        stockQuantity: newStockQuantity,
      },
      select: {
        id: true,
        productName: true,
        stockQuantity: true,
      },
    });

    return NextResponse.json({
      status: 'success',
      message: 'Stock updated successfully',
      data: {
        product: updatedProduct,
        previousStock: product.stockQuantity,
        newStock: newStockQuantity,
        change: quantityChange,
      },
    });
  } catch (error) {
    console.error('Failed to update stock:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to update stock',
      },
      { status: 500 }
    );
  }
}

