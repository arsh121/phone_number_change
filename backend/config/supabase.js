const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

let supabase;

// Initialize Supabase client
function getSupabase() {
    if (!supabase) {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
        }
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return supabase;
}

// Initialize database tables
async function initializeDatabase() {
    try {
        const client = getSupabase();
        
        // Create agents table if it doesn't exist
        const { error: agentsError } = await client
            .from('agents')
            .select('count')
            .limit(1);
            
        if (agentsError && agentsError.code === 'PGRST116') {
            // Table doesn't exist, create it via SQL
            const { error: createError } = await client.rpc('create_agents_table');
            if (createError) {
                console.log('Agents table creation failed, will be created automatically by Supabase');
            }
        }
        
        // Create logs table if it doesn't exist
        const { error: logsError } = await client
            .from('logs')
            .select('count')
            .limit(1);
            
        if (logsError && logsError.code === 'PGRST116') {
            // Table doesn't exist, create it via SQL
            const { error: createError } = await client.rpc('create_logs_table');
            if (createError) {
                console.log('Logs table creation failed, will be created automatically by Supabase');
            }
        }
        
        console.log('Database initialized successfully');
        
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

// Initialize default data
async function initializeDefaultData() {
    try {
        const client = getSupabase();
        
        // Check if agents exist
        const { data: existingAgents, error: countError } = await client
            .from('agents')
            .select('id')
            .limit(1);
            
        if (countError) {
            console.error('Error checking existing agents:', countError);
            return;
        }
        
        if (!existingAgents || existingAgents.length === 0) {
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
                    created_at: new Date().toISOString(),
                    last_login: null
                },
                {
                    id: 'AG002',
                    name: 'Jane Smith',
                    password: '$2a$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ',
                    email: 'jane.smith@khatabook.com',
                    phone: '9876543211',
                    role: 'agent',
                    status: 'active',
                    created_at: new Date().toISOString(),
                    last_login: null
                }
            ];
            
            const { error: insertError } = await client
                .from('agents')
                .insert(defaultAgents);
                
            if (insertError) {
                console.error('Error inserting default agents:', insertError);
            } else {
                console.log('Default agents initialized');
            }
        }
        
        console.log('Default data initialization completed');
        
    } catch (error) {
        console.error('Error initializing default data:', error);
        throw error;
    }
}

module.exports = {
    getSupabase,
    initializeDatabase,
    initializeDefaultData
}; 