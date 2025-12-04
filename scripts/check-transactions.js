// Check transactions
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTransactions() {
    try {
        console.log('Checking Transactions...');

        const transactions = await prisma.transaction.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { user: true }
        });

        console.log(`Found ${transactions.length} recent transactions:`);

        transactions.forEach(t => {
            console.log(`- ID: ${t.id}`);
            console.log(`  User: ${t.user.email}`);
            console.log(`  Type: ${t.type}`);
            console.log(`  Amount: ${t.amount}`);
            console.log(`  Date: ${t.date}`);
            console.log(`  CreatedAt: ${t.createdAt}`);
            console.log('---');
        });

    } catch (error) {
        console.error('Error checking transactions:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkTransactions();
