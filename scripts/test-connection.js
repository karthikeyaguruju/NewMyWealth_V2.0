// Test MongoDB connection
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
    try {
        console.log('Testing MongoDB connection...');

        // Try to connect and query
        const users = await prisma.user.findMany({
            include: {
                _count: {
                    select: { categories: true }
                }
            }
        });

        console.log('✅ Database connected successfully!');
        console.log(`Found ${users.length} users in database:`);

        users.forEach(user => {
            console.log(`- User: ${user.email} (ID: ${user.id})`);
            console.log(`  Categories: ${user._count.categories}`);
        });

        const totalCategories = await prisma.category.count();
        console.log(`\nTotal categories in database: ${totalCategories}`);

        const transactionCount = await prisma.transaction.count();
        console.log(`Found ${transactionCount} transactions in database`);

    } catch (error) {
        console.error('❌ Database connection failed!');
        console.error('Error:', error.message);

        if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
            console.error('\n💡 Possible issues:');
            console.error('1. Check if DATABASE_URL in .env file is correct');
            console.error('2. Check if MongoDB Atlas IP whitelist includes your IP');
            console.error('3. Check if your internet connection is working');
        }
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();
