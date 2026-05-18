import 'dotenv/config'
import { PrismaClient } from '../lib/generated/prisma/client'

const db = new PrismaClient()

async function main() {
  // Open position
  const pos = await db.position.create({
    data: {
      title: 'Operations Coordinator',
      status: 'OPEN',
      employmentType: 'Full-time',
      location: 'Mumbai, India',
      compensationRange: 'Competitive',
      purpose: 'Coordinate day-to-day operations across departments.',
    },
  })
  console.log('Created position:', pos.title)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
