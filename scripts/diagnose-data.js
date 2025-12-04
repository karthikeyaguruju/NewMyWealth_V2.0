// Test MongoDB connection and list users with category counts
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
    try {
        console.log('Testing MongoDB connection...');

        // Get all users with their category counts
        const users = await prisma.user.findMany({
            include: {
                _count: {
                    select: { categories: true, transactions: true }
                }
            }
        });

        console.log('✅ Database connected successfully!');
        console.log(`Found ${users.length} users in database:`);

        users.forEach(user => {
            console.log(`\nUser: ${user.email} (ID: ${user.id})`);
            console.log(`  - Categories: ${user._count.categories}`);
            console.log(`  - Transactions: ${user._count.transactions}`);
        });

        const totalCategories = await prisma.category.count();
        console.log(`\nTotal categories in database: ${totalCategories}`);

    } catch (error) {
        console.error('❌ Database connection failed!');
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();
