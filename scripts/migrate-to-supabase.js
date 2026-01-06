const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

// Initialize Clients
const prisma = new PrismaClient();
const supabase = createClient(
    'https://wtnvicqmtxsbjeduvlzx.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0bnZpY3FtdHhzYmplZHV2bHp4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY5MTg4MSwiZXhwIjoyMDgzMjY3ODgxfQ._gn7Wn_GRnYtTBiZsN1wVbAXLq_c-N9xcN-qKb4hXnE'
);

async function migrate() {
    console.log('🚀 Starting Migration from MongoDB to Supabase...');

    try {
        // 1. Get all users from MongoDB
        const mongoUsers = await prisma.user.findMany();
        console.log(`Found ${mongoUsers.length} users in MongoDB.`);

        for (const mUser of mongoUsers) {
            console.log(`\n--- Migrating user: ${mUser.email} ---`);

            // 2. Find the user in Supabase Auth (They must have signed up first)
            const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
            const sUser = users.find(u => u.email === mUser.email);

            if (!sUser) {
                console.log(`⚠️ User ${mUser.email} not found in Supabase. Please sign up in the app first!`);
                continue;
            }

            const sUserId = sUser.id;
            console.log(`✅ Found Supabase User ID: ${sUserId}`);

            // 3. Migrate Categories
            console.log('Migrating Categories...');
            const mCategories = await prisma.category.findMany({ where: { userId: mUser.id } });

            // Create a mapping of Old ID -> New UUID
            const categoryMapping = {};

            for (const cat of mCategories) {
                const { data: newCat, error: catErr } = await supabase
                    .from('categories')
                    .upsert({
                        user_id: sUserId,
                        name: cat.name,
                        category_group: cat.categoryGroup,
                        is_default: cat.isDefault
                    }, { onConflict: 'user_id, name, category_group' })
                    .select()
                    .single();

                if (catErr) {
                    console.error(`Error migrating category ${cat.name}:`, catErr.message);
                } else {
                    categoryMapping[cat.id] = newCat.id;
                }
            }
            console.log(`Migrated ${Object.keys(categoryMapping).length} categories.`);

            // 4. Migrate Transactions
            console.log('Migrating Transactions...');
            const mTransactions = await prisma.transaction.findMany({ where: { userId: mUser.id } });

            const sTransactions = mTransactions.map(t => ({
                user_id: sUserId,
                category_id: categoryMapping[t.categoryId] || null,
                type: t.type.toLowerCase(),
                amount: t.amount,
                date: t.date.toISOString(),
                notes: t.notes,
                status: t.status || 'active'
            }));

            if (sTransactions.length > 0) {
                const { error: txErr } = await supabase.from('transactions').insert(sTransactions);
                if (txErr) console.error('Error migrating transactions:', txErr.message);
                else console.log(`Successfully moved ${sTransactions.length} transactions.`);
            }

            // 5. Migrate Stocks
            console.log('Migrating Stocks...');
            const mStocks = await prisma.stock.findMany({ where: { userId: mUser.id } });

            const sStocks = mStocks.map(s => ({
                user_id: sUserId,
                symbol: s.symbol,
                name: s.name,
                quantity: s.quantity,
                buy_price: s.buyPrice,
                broker: s.broker,
                type: s.type,
                date: s.date ? s.date.toISOString() : new Date().toISOString()
            }));

            if (sStocks.length > 0) {
                const { error: stockErr } = await supabase.from('stocks').insert(sStocks);
                if (stockErr) console.error('Error migrating stocks:', stockErr.message);
                else console.log(`Successfully moved ${sStocks.length} stocks.`);
            }
        }

        console.log('\n✨ Migration Complete!');

    } catch (err) {
        console.error('❌ Critical Migration Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
