import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

async function main() {
  try {
    // Run Prisma migrations
    console.log('Running Prisma migrations...')
    execSync('npx prisma migrate deploy', { stdio: 'inherit' })

    // Initialize Prisma client
    const prisma = new PrismaClient()

    // Test database connection
    await prisma.$connect()
    console.log('Successfully connected to database')

    // Perform any additional initialization if needed

    await prisma.$disconnect()
    console.log('Database initialization completed successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    process.exit(1)
  }
}

main()