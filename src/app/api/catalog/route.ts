import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    include: {
      products: {
        where: { active: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const serialized = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    updatedAt: cat.updatedAt.toISOString(),
    products: cat.products.map((p) => ({
      id: p.id,
      categoryId: p.categoryId,
      name: p.name,
      price: p.price.toString(),
      active: p.active,
      updatedAt: p.updatedAt.toISOString(),
    })),
  }));

  return NextResponse.json({ categories: serialized });
}
