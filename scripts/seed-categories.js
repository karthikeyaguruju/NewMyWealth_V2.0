// Seed default categories for all users
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = {
    Income: [
        'Salary',
        'Freelance',
        'Business',
        'Investments',
        'Rental Income',
        'Other Income'
    ],
    Expense: [
        'Food & Dining',
        'Transportation',
        'Shopping',
        'Entertainment',
        'Bills & Utilities',
        'Healthcare',
        'Education',
        'Travel',
        'Personal Care',
        'Home & Garden',
        'Gifts & Donations',
        'Other Expenses'
    ],
    Investment: [
        'Stocks',
        'Mutual Funds',
        'Real Estate',
        'Cryptocurrency',
        'Gold',
        'Bonds',
        'Fixed Deposit',
        'PPF',
        'Other Investments'
    ]
};

async function seedCategories() {
    try {
        console.log('Starting category seeding...\n');

        // Get all users
        const users = await prisma.user.findMany({
            select: { id: true, email: true }
        });

        if (users.length === 0) {
            console.log('No users found. Please create a user account first.');
            return;
        }

        console.log(`Found ${users.length} users\n`);

        for (const user of users) {
            console.log(`Seeding categories for user: ${user.email}`);

            let totalCreated = 0;

            for (const [categoryGroup, categories] of Object.entries(DEFAULT_CATEGORIES)) {
                for (const categoryName of categories) {
                    // Check if category already exists
                    const existing = await prisma.category.findFirst({
                        where: {
                            userId: user.id,
                            name: categoryName,
                            categoryGroup: categoryGroup
                        }
                    });

                    if (!existing) {
                        await prisma.category.create({
                            data: {
                                name: categoryName,
                                categoryGroup: categoryGroup,
                                isDefault: true,
                                userId: user.id
                            }
                        });
                        totalCreated++;
                    }
                }
            }

            console.log(`  ✅ Created ${totalCreated} categories for ${user.email}\n`);
        }

        console.log('✅ Category seeding completed successfully!');

        // Show summary
        const totalCategories = await prisma.category.count();
        console.log(`\nTotal categories in database: ${totalCategories}`);

    } catch (error) {
        console.error('❌ Error seeding categories:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedCategories();
