const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Use environment variable for data persistence
const DATA_BACKUP = process.env.DATA_BACKUP || '[]';
const LOGS_BACKUP = process.env.LOGS_BACKUP || '[]';

// Data storage paths
const DATA_DIR = path.join(__dirname, '..', 'data');
const AGENTS_FILE = path.join(DATA_DIR, 'agents.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

// Initialize data files if they don't exist
async function initializeDataFiles() {
    await ensureDataDir();
    
    try {
        await fs.access(AGENTS_FILE);
    } catch {
        // Try to restore from environment variable first
        let agentsData;
        try {
            agentsData = JSON.parse(DATA_BACKUP);
        } catch {
            // Use default agents if no backup
            agentsData = [
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
        }
        
        await fs.writeFile(AGENTS_FILE, JSON.stringify(agentsData, null, 2));
    }
    
    try {
        await fs.access(LOGS_FILE);
    } catch {
        // Try to restore from environment variable first
        let logsData;
        try {
            logsData = JSON.parse(LOGS_BACKUP);
        } catch {
            logsData = [];
        }
        
        await fs.writeFile(LOGS_FILE, JSON.stringify(logsData, null, 2));
    }
}

// Read data from file
async function readDataFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return [];
    }
}

// Write data to file and update environment backup
async function writeDataFile(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        
        // Update environment backup for persistence
        if (filePath === AGENTS_FILE) {
            process.env.DATA_BACKUP = JSON.stringify(data);
        } else if (filePath === LOGS_FILE) {
            process.env.LOGS_BACKUP = JSON.stringify(data);
        }
        
        return true;
    } catch (error) {
        console.error(`Error writing file ${filePath}:`, error);
        return false;
    }
}

// Backup data to environment variables (for Render deployment)
async function backupData() {
    try {
        const agents = await readDataFile(AGENTS_FILE);
        const logs = await readDataFile(LOGS_FILE);
        
        console.log('Data backup created. Add these to your Render environment variables:');
        console.log('DATA_BACKUP=' + JSON.stringify(agents));
        console.log('LOGS_BACKUP=' + JSON.stringify(logs));
        
        return { agents, logs };
    } catch (error) {
        console.error('Error backing up data:', error);
        return null;
    }
}

module.exports = {
    AGENTS_FILE,
    LOGS_FILE,
    initializeDataFiles,
    readDataFile,
    writeDataFile,
    backupData
}; 