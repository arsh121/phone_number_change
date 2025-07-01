const fs = require('fs').promises;
const path = require('path');
const { getCollection, connectToDatabase } = require('./config/database');

async function migrateData() {
    try {
        console.log('Starting data migration...');
        
        // Connect to database
        await connectToDatabase();
        
        // Read existing JSON files
        const dataDir = path.join(__dirname, 'data');
        const agentsFile = path.join(dataDir, 'agents.json');
        const logsFile = path.join(dataDir, 'logs.json');
        
        // Migrate agents
        try {
            const agentsData = await fs.readFile(agentsFile, 'utf8');
            const agents = JSON.parse(agentsData);
            
            if (agents.length > 0) {
                const agentsCollection = await getCollection('agents');
                
                // Check if agents already exist
                const existingCount = await agentsCollection.countDocuments();
                
                if (existingCount === 0) {
                    await agentsCollection.insertMany(agents);
                    console.log(`Migrated ${agents.length} agents to MongoDB`);
                } else {
                    console.log('Agents already exist in MongoDB, skipping migration');
                }
            }
        } catch (error) {
            console.log('No existing agents.json file found or error reading it:', error.message);
        }
        
        // Migrate logs
        try {
            const logsData = await fs.readFile(logsFile, 'utf8');
            const logs = JSON.parse(logsData);
            
            if (logs.length > 0) {
                const logsCollection = await getCollection('logs');
                
                // Check if logs already exist
                const existingCount = await logsCollection.countDocuments();
                
                if (existingCount === 0) {
                    await logsCollection.insertMany(logs);
                    console.log(`Migrated ${logs.length} logs to MongoDB`);
                } else {
                    console.log('Logs already exist in MongoDB, skipping migration');
                }
            }
        } catch (error) {
            console.log('No existing logs.json file found or error reading it:', error.message);
        }
        
        console.log('Data migration completed successfully!');
        
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    migrateData();
}

module.exports = { migrateData }; 