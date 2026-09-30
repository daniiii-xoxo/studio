import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@studio/database/prisma';

export async function GET(req: NextRequest) {
  try {
    const totalItems = await prisma.inventoryItem.count();

    // Category distribution
    const categories = await prisma.inventoryCategory.findMany({
      include: {
        _count: { select: { items: true } },
      },
    });

    const stockByCategory = categories.map((c) => ({
      name: c.name,
      count: c._count.items,
      color: c.color || '#3b82f6',
    }));

    // Find Low Stock / Out of Stock Items
    const allItems = await prisma.inventoryItem.findMany({
      select: {
        id: true,
        name: true,
        inventoryCode: true,
        quantity: true,
        minQuantity: true,
        status: true,
        type: true,
        category: { select: { name: true } },
        nextMaintenanceDate: true,
      },
    });

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const pmsAlerts = allItems.filter(
      (i) => i.nextMaintenanceDate && new Date(i.nextMaintenanceDate) <= thirtyDaysFromNow
    ).length;

    const lowStockItems = allItems
      .filter((i) => {
        const threshold = i.minQuantity > 0 ? i.minQuantity : 5;
        return (
          i.quantity <= threshold ||
          i.quantity === 0 ||
          i.status === 'Low Stock' ||
          i.status === 'Out of Stock'
        );
      })
      .map((i) => ({
        ...i,
        stock: i.quantity,
        minStock: i.minQuantity > 0 ? i.minQuantity : 5,
        category: i.category?.name || 'General',
      }));

    // Find Heavily Used Equipment (Top Checkouts)
    const checkouts = await prisma.inventoryBorrowing.groupBy({
      by: ['itemId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const mostUsed = await Promise.all(
      checkouts.map(async (c) => {
        const item = await prisma.inventoryItem.findUnique({
          where: { id: c.itemId },
          select: { name: true, inventoryCode: true, quantity: true, category: { select: { name: true } } },
        });
        return {
          name: item?.name || 'Unknown',
          code: item?.inventoryCode || '',
          category: item?.category?.name || 'General',
          count: c._count.id,
          stock: item?.quantity || 0,
        };
      })
    );

    // Active Borrowings count
    const activeBorrowingsCount = await prisma.inventoryBorrowing.count({
      where: { status: 'BORROWED' },
    });

    return NextResponse.json({
      totalItems,
      stockByCategory,
      lowStockItems,
      mostUsed,
      activeBorrowingsCount,
      pmsAlerts,
    });
  } catch (error: any) {
    console.error('[GET /api/inventory/analytics] error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics', details: error?.message }, { status: 500 });
  }
}
