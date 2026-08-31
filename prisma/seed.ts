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

  const drinks = await prisma.category.upsert({
    where: { id: "d4e8f1a2-6b3c-4d5e-9f0a-1b2c3d4e5f6a" },
    update: {},
    create: {
      id: "d4e8f1a2-6b3c-4d5e-9f0a-1b2c3d4e5f6a",
      name: "Drinks",
    },
  });

  const desserts = await prisma.category.upsert({
    where: { id: "e5f9a2b3-7c4d-4e5f-a0b1-2c3d4e5f6a7b" },
    update: {},
    create: {
      id: "e5f9a2b3-7c4d-4e5f-a0b1-2c3d4e5f6a7b",
      name: "Desserts",
    },
  });

  await prisma.product.upsert({
    where: { id: "5f4530d2-5aa4-4863-a1f0-0b9ba60552b5" },
    update: {
      name: "Chicken Rice",
      price: 85.0,
      imagePath: "chicken-rice.jpg",
    },
    create: {
      id: "5f4530d2-5aa4-4863-a1f0-0b9ba60552b5",
      categoryId: meals.id,
      name: "Chicken Rice",
      price: 85.0,
      active: true,
      imagePath: "chicken-rice.jpg",
    },
  });

  await prisma.product.upsert({
    where: { id: "a1b6f0f0-9b2c-4b8b-9d0f-4c1e3f0a1b6a" },
    update: {
      name: "Chicken Adobo",
      price: 95.0,
      imagePath: "chicken-adobo.jpg",
    },
    create: {
      id: "a1b6f0f0-9b2c-4b8b-9d0f-4c1e3f0a1b6a",
      categoryId: meals.id,
      name: "Chicken Adobo",
      price: 95.0,
      active: true,
      imagePath: "chicken-adobo.jpg",
    },
  });

  await prisma.product.upsert({
    where: { id: "c3d8a1a1-7e4d-4a6a-8b1c-6e3f5b2c8d9e" },
    update: {
      name: "Beef Caldereta",
      price: 110.0,
      imagePath: "beef-caldereta.jpg",
    },
    create: {
      id: "c3d8a1a1-7e4d-4a6a-8b1c-6e3f5b2c8d9e",
      categoryId: meals.id,
      name: "Beef Caldereta",
      price: 110.0,
      active: true,
      imagePath: "beef-caldereta.jpg",
    },
  });

  await prisma.product.upsert({
    where: { id: "f6a0b3c4-8d5e-4f6a-b1c2-3d4e5f6a7b8c" },
    update: {},
    create: {
      id: "f6a0b3c4-8d5e-4f6a-b1c2-3d4e5f6a7b8c",
      categoryId: meals.id,
      name: "Sinigang",
      price: 100.0,
      active: true,
      imagePath: "sinigang.jpg",
    },
  });

  await prisma.product.upsert({
    where: { id: "a7b1c4d5-9e6f-4a7b-c2d3-4e5f6a7b8c9d" },
    update: {},
    create: {
      id: "a7b1c4d5-9e6f-4a7b-c2d3-4e5f6a7b8c9d",
      categoryId: meals.id,
      name: "Pancit Bihon",
      price: 90.0,
      active: true,
      imagePath: "pancit-bihon.jpg",
    },
  });

  await prisma.product.upsert({
    where: { id: "b8c2d5e6-af70-4b8c-d3e4-5f6a7b8c9d0e" },
    update: {},
    create: {
      id: "b8c2d5e6-af70-4b8c-d3e4-5f6a7b8c9d0e",
      categoryId: drinks.id,
      name: "Calamansi Juice",
      price: 30.0,
      active: true,
      imagePath: "calamansi-juice.jpg",
    },
  });

  await prisma.product.upsert({
    where: { id: "c9d3e6f7-b081-4c9d-e4f5-6a7b8c9d0e1f" },
    update: {},
    create: {
      id: "c9d3e6f7-b081-4c9d-e4f5-6a7b8c9d0e1f",
      categoryId: drinks.id,
      name: "Iced Tea",
      price: 25.0,
      active: true,
      imagePath: "iced-tea.jpg",
    },
  });

  await prisma.product.upsert({
    where: { id: "d0e4f7a8-c192-4d0e-f506-7b8c9d0e1f2a" },
    update: {},
    create: {
      id: "d0e4f7a8-c192-4d0e-f506-7b8c9d0e1f2a",
      categoryId: desserts.id,
      name: "Turon",
      price: 20.0,
      active: true,
      imagePath: "turon.jpg",
    },
  });

  await prisma.product.upsert({
    where: { id: "e1f5a8b9-d2a3-4e1f-a617-8c9d0e1f2a3b" },
    update: {},
    create: {
      id: "e1f5a8b9-d2a3-4e1f-a617-8c9d0e1f2a3b",
      categoryId: desserts.id,
      name: "Halo-Halo",
      price: 60.0,
      active: true,
      imagePath: "halo-halo.jpg",
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
