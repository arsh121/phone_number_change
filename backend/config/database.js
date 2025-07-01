const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'number_change_portal';

let client;
let db;

// Connect to MongoDB
async function connectToDatabase() {
    try {
        if (!client) {
            client = new MongoClient(MONGODB_URI);
            await client.connect();
            db = client.db(DB_NAME);
            console.log('Connected to MongoDB successfully');
        }
        return db;
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw error;
    }
}

// Get database instance
async function getDatabase() {
    if (!db) {
        await connectToDatabase();
    }
    return db;
}

// Get collection
async function getCollection(collectionName) {
    const database = await getDatabase();
    return database.collection(collectionName);
}

// Initialize default data
async function initializeDefaultData() {
    try {
        const agentsCollection = await getCollection('agents');
        const logsCollection = await getCollection('logs');
        
        // Check if agents collection is empty
        const agentCount = await agentsCollection.countDocuments();
        
        if (agentCount === 0) {
            // Insert default agents
            const defaultAgents = [
                {
                    id: 'AG001',
                    name: 'John Doe',
                    password: '$2a$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ',
                    email: 'john.doe@khatabook.com',
                    phone: '9876543210',
                    role: 'agent',
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    lastLogin: null
                },
                {
                    id: 'AG002',
                    name: 'Jane Smith',
                    password: '$2a$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ',
                    email: 'jane.smith@khatabook.com',
                    phone: '9876543211',
                    role: 'agent',
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    lastLogin: null
                }
            ];
            
            await agentsCollection.insertMany(defaultAgents);
            console.log('Default agents initialized');
        }
        
        // Create indexes for better performance
        await agentsCollection.createIndex({ email: 1 }, { unique: true });
        await agentsCollection.createIndex({ id: 1 }, { unique: true });
        await logsCollection.createIndex({ timestamp: -1 });
        
        console.log('Database initialized successfully');
        
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

// Close database connection
async function closeDatabase() {
    if (client) {
        await client.close();
        console.log('Database connection closed');
    }
}

module.exports = {
    connectToDatabase,
    getDatabase,
    getCollection,
    initializeDefaultData,
    closeDatabase
}; 