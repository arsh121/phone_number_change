const { getSupabase, initializeDefaultData } = require('./config/supabase');

async function setup() {
    try {
        console.log('Setting up Supabase database...');
        
        // Test database connection
        const supabase = getSupabase();
        console.log('✅ Supabase connection successful');
        
        // Initialize default data
        await initializeDefaultData();
        console.log('✅ Default data initialized');
        
        console.log('\n🎉 Setup completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Start the server: npm start');
        console.log('2. Test the application locally');
        console.log('3. Deploy to Render with environment variables set');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.log('\nTroubleshooting:');
        console.log('1. Check your SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
        console.log('2. Ensure your Supabase project is set up correctly');
        console.log('3. Verify your database tables are created');
        process.exit(1);
    }
}

// Run setup if this file is executed directly
if (require.main === module) {
    setup();
}

module.exports = { setup }; 