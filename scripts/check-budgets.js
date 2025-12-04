// Check budgets in database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBudgets() {
    try {
        console.log('Checking Budgets...');

        const budgets = await prisma.budget.findMany({
            include: {
                category: true,
                user: true
            }
        });

        console.log(`Found ${budgets.length} budgets:`);

        budgets.forEach(b => {
            console.log(`- ID: ${b.id}`);
            console.log(`  User: ${b.user.email}`);
            console.log(`  Category: ${b.category.name} (ID: ${b.categoryId})`);
            console.log(`  Amount: ${b.amount}`);
            console.log(`  Month: ${b.month}`);
            console.log('---');
        });

    } catch (error) {
        console.error('Error checking budgets:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkBudgets();
