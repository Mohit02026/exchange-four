import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../lib/generated/prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

async function main() {
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
