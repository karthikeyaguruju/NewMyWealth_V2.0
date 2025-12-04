// Run this script to clean corrupted data from the database
// Usage: node scripts/clean-database.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDatabase() {
    try {
        console.log('Starting database cleanup...');

        // Delete all budgets (they have null categoryId issues)
        const deletedBudgets = await prisma.budget.deleteMany({});
        console.log(`Deleted ${deletedBudgets.count} budgets`);

        // Delete all transactions (they have date format issues)
        const deletedTransactions = await prisma.transaction.deleteMany({});
        console.log(`Deleted ${deletedTransactions.count} transactions`);

        // Delete all categories (they have null updatedAt issues)
        const deletedCategories = await prisma.category.deleteMany({});
        console.log(`Deleted ${deletedCategories.count} categories`);

        console.log('Database cleaned successfully!');
        console.log('You can now use the application to create fresh data.');
    } catch (error) {
        console.error('Error cleaning database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanDatabase();
