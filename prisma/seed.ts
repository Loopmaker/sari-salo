import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const meals = await prisma.category.upsert({
    where: { id: "ca30984a-5632-4f9e-bc74-6db93253b650" },
    update: {},
    create: {
      id: "ca30984a-5632-4f9e-bc74-6db93253b650",
      name: "Meals",
    },
  });

  await prisma.product.upsert({
    where: { id: "5f4530d2-5aa4-4863-a1f0-0b9ba60552b5" },
    update: {},
    create: {
      id: "5f4530d2-5aa4-4863-a1f0-0b9ba60552b5",
      categoryId: meals.id,
      name: "Chicken Rice",
      price: 85.0,
      active: true,
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
