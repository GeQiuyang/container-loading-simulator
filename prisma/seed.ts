import { PrismaClient, ContainerType } from '@prisma/client';

const prisma = new PrismaClient();

const containers = [
  {
    type: ContainerType.GP20,
    name: '20GP Standard Container',
    length: 5.898,
    width: 2.352,
    height: 2.393,
    maxPayload: 28300,
    tareWeight: 2300,
  },
  {
    type: ContainerType.GP40,
    name: '40GP Standard Container',
    length: 12.032,
    width: 2.352,
    height: 2.393,
    maxPayload: 26700,
    tareWeight: 3750,
  },
  {
    type: ContainerType.HQ40,
    name: '40HQ High Cube Container',
    length: 12.032,
    width: 2.352,
    height: 2.698,
    maxPayload: 26500,
    tareWeight: 3940,
  },
  {
    type: ContainerType.OPEN_TOP,
    name: 'Open Top Container',
    length: 5.898,
    width: 2.352,
    height: 2.348,
    maxPayload: 28200,
    tareWeight: 2400,
  },
  {
    type: ContainerType.FLAT_RACK,
    name: 'Flat Rack Container',
    length: 5.958,
    width: 2.350,
    height: 2.250,
    maxPayload: 30000,
    tareWeight: 2800,
  },
];

const cargoItems = [
  {
    name: 'Steel Pipes Bundle',
    length: 5.8,
    width: 1.0,
    height: 1.0,
    weight: 5000,
    quantity: 2,
    rotatable: true,
  },
  {
    name: 'Wooden Pallet - Electronics',
    length: 1.2,
    width: 1.0,
    height: 1.5,
    weight: 800,
    quantity: 10,
    rotatable: true,
  },
  {
    name: 'Industrial Machine - Type A',
    length: 2.5,
    width: 1.8,
    height: 2.0,
    weight: 3500,
    quantity: 1,
    rotatable: false,
  },
  {
    name: 'Furniture Set - Office Desk',
    length: 1.6,
    width: 0.8,
    height: 0.75,
    weight: 45,
    quantity: 50,
    rotatable: true,
  },
  {
    name: 'Construction Beams',
    length: 4.0,
    width: 0.3,
    height: 0.3,
    weight: 600,
    quantity: 20,
    rotatable: true,
  },
];

async function main() {
  console.log('Seeding containers...');
  for (const container of containers) {
    await prisma.container.upsert({
      where: { id: container.type },
      update: container,
      create: { id: container.type, ...container },
    });
    console.log(`  ${container.name} (${container.type})`);
  }

  console.log('Seeding cargo items...');
  for (const item of cargoItems) {
    await prisma.cargoItem.create({ data: item });
    console.log(`  ${item.name} x${item.quantity}`);
  }

  console.log('Seed complete.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
