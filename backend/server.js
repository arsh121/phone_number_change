const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const fetch = require('node-fetch');
const path = require('path');
const { getSupabase, initializeDefaultData } = require('./config/supabase');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Generate unique agent ID
function generateAgentId(existingAgents) {
    const maxId = Math.max(...existingAgents.map(agent => {
        const num = parseInt(agent.id.replace('AG', ''));
        return isNaN(num) ? 0 : num;
    }), 0);
    return `AG${String(maxId + 1).padStart(3, '0')}`;
}

// Validation functions
function validateAgentData(agentData) {
    const errors = [];
    
    if (!agentData.agentId || agentData.agentId.trim().length < 2) {
        errors.push('Agent ID must be at least 2 characters long');
    }
    
    if (!agentData.name || agentData.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
    }
    
    if (!agentData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(agentData.email)) {
        errors.push('Valid email is required');
    }
    
    if (!agentData.phone || !/^\d{10}$/.test(agentData.phone)) {
        errors.push('Phone number must be a 10-digit number');
    }
    
    if (!agentData.password || agentData.password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }
    
    return errors;
}

// API Routes

// Get all agents
app.get('/api/agents', async (req, res) => {
    try {
        const supabase = getSupabase();
        const { data: agents, error } = await supabase
            .from('agents')
            .select('*');
            
        if (error) {
            console.error('Error fetching agents:', error);
            return res.status(500).json({ error: 'Failed to fetch agents' });
        }
        
        // Don't send password hashes in response
        const safeAgents = agents.map(agent => {
            const { password, ...safeAgent } = agent;
            return safeAgent;
        });
        res.json(safeAgents);
    } catch (error) {
        console.error('Error fetching agents:', error);
        res.status(500).json({ error: 'Failed to fetch agents' });
    }
});

// Create new agent
app.post('/api/agents', async (req, res) => {
    try {
        const supabase = getSupabase();
        const agentData = req.body;
        
        // Validate input
        const errors = validateAgentData(agentData);
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }
        
        // Check if email already exists
        const { data: emailExists } = await supabase
            .from('agents')
            .select('id')
            .eq('email', agentData.email)
            .single();
            
        if (emailExists) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        
        // Check if Agent ID already exists
        const { data: agentIdExists } = await supabase
            .from('agents')
            .select('id')
            .eq('id', agentData.agentId)
            .single();
            
        if (agentIdExists) {
            return res.status(400).json({ error: 'Agent ID already exists' });
        }
        
        // Use provided Agent ID or generate one
        const { data: existingAgents } = await supabase
            .from('agents')
            .select('id');
            
        const agentId = agentData.agentId || generateAgentId(existingAgents || []);
        
        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(agentData.password, saltRounds);
        
        // Create new agent
        const newAgent = {
            id: agentId,
            name: agentData.name.trim(),
            email: agentData.email.toLowerCase(),
            phone: agentData.phone,
            password: hashedPassword,
            role: 'agent',
            status: 'active',
            created_at: new Date().toISOString(),
            last_login: null
        };
        
        const { data: insertedAgent, error: insertError } = await supabase
            .from('agents')
            .insert(newAgent)
            .select()
            .single();
            
        if (insertError) {
            console.error('Error inserting agent:', insertError);
            return res.status(500).json({ error: 'Failed to create agent' });
        }
        
        // Return agent without password
        const { password, ...safeAgent } = insertedAgent;
        res.status(201).json(safeAgent);
        
    } catch (error) {
        console.error('Error creating agent:', error);
        res.status(500).json({ error: 'Failed to create agent' });
    }
});

// Update agent
app.put('/api/agents/:id', async (req, res) => {
    try {
        const supabase = getSupabase();
        const agentId = req.params.id;
        const updateData = req.body;
        
        // Check if agent exists
        const { data: existingAgent } = await supabase
            .from('agents')
            .select('*')
            .eq('id', agentId)
            .single();
            
        if (!existingAgent) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        
        // Validate input (excluding password for updates)
        const validationData = { ...updateData };
        if (!validationData.password) {
            validationData.password = 'temp123'; // Temporary for validation
        }
        const errors = validateAgentData(validationData);
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }
        
        // Check if email already exists (excluding current agent)
        const { data: emailExists } = await supabase
            .from('agents')
            .select('id')
            .eq('email', updateData.email)
            .neq('id', agentId)
            .single();
            
        if (emailExists) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        
        // Update agent data
        const updateFields = {
            name: updateData.name.trim(),
            email: updateData.email.toLowerCase(),
            phone: updateData.phone
        };
        
        // Update password if provided
        if (updateData.password) {
            const saltRounds = 10;
            updateFields.password = await bcrypt.hash(updateData.password, saltRounds);
        }
        
        const { data: updatedAgent, error: updateError } = await supabase
            .from('agents')
            .update(updateFields)
            .eq('id', agentId)
            .select()
            .single();
            
        if (updateError) {
            console.error('Error updating agent:', updateError);
            return res.status(500).json({ error: 'Failed to update agent' });
        }
        
        // Return agent without password
        const { password, ...safeAgent } = updatedAgent;
        res.json(safeAgent);
        
    } catch (error) {
        console.error('Error updating agent:', error);
        res.status(500).json({ error: 'Failed to update agent' });
    }
});

// Delete agent
app.delete('/api/agents/:id', async (req, res) => {
    try {
        const supabase = getSupabase();
        const agentId = req.params.id;
        
        const { error } = await supabase
            .from('agents')
            .delete()
            .eq('id', agentId);
            
        if (error) {
            console.error('Error deleting agent:', error);
            return res.status(500).json({ error: 'Failed to delete agent' });
        }
        
        res.json({ message: 'Agent deleted successfully' });
        
    } catch (error) {
        console.error('Error deleting agent:', error);
        res.status(500).json({ error: 'Failed to delete agent' });
    }
});

// Toggle agent status
app.patch('/api/agents/:id/status', async (req, res) => {
    try {
        const supabase = getSupabase();
        const agentId = req.params.id;
        const { status } = req.body;
        
        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        
        const { data: updatedAgent, error } = await supabase
            .from('agents')
            .update({ status })
            .eq('id', agentId)
            .select()
            .single();
            
        if (error) {
            console.error('Error updating agent status:', error);
            return res.status(500).json({ error: 'Failed to update agent status' });
        }
        
        if (!updatedAgent) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        
        const { password, ...safeAgent } = updatedAgent;
        res.json(safeAgent);
        
    } catch (error) {
        console.error('Error updating agent status:', error);
        res.status(500).json({ error: 'Failed to update agent status' });
    }
});

// Agent login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { agentId, password } = req.body;
        const supabase = getSupabase();
        
        const { data: agent } = await supabase
            .from('agents')
            .select('*')
            .eq('id', agentId)
            .eq('status', 'active')
            .single();
            
        if (!agent) {
            return res.status(401).json({ error: 'Invalid credentials or inactive account' });
        }
        
        const isValidPassword = await bcrypt.compare(password, agent.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Update last login
        await supabase
            .from('agents')
            .update({ last_login: new Date().toISOString() })
            .eq('id', agentId);
        
        // Return agent without password
        const { password: _, ...safeAgent } = agent;
        res.json(safeAgent);
        
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Admin login
app.post('/api/auth/admin-login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Simple admin authentication (in production, use proper admin management)
        if (username === 'admin' && password === 'admin123') {
            res.json({
                id: 'ADMIN',
                name: 'Administrator',
                role: 'admin',
                email: 'admin@khatabook.com'
            });
        } else {
            res.status(401).json({ error: 'Invalid admin credentials' });
        }
        
    } catch (error) {
        console.error('Error during admin login:', error);
        res.status(500).json({ error: 'Admin login failed' });
    }
});

// Get activity logs
app.get('/api/logs', async (req, res) => {
    try {
        const supabase = getSupabase();
        const { data: logs, error } = await supabase
            .from('logs')
            .select('*')
            .order('timestamp', { ascending: false });
            
        if (error) {
            console.error('Error fetching logs:', error);
            return res.status(500).json({ error: 'Failed to fetch logs' });
        }
        
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// Add activity log
app.post('/api/logs', async (req, res) => {
    try {
        const supabase = getSupabase();
        const logEntry = {
            ...req.body,
            timestamp: new Date().toISOString()
        };
        
        const { data: insertedLog, error } = await supabase
            .from('logs')
            .insert(logEntry)
            .select()
            .single();
            
        if (error) {
            console.error('Error inserting log:', error);
            return res.status(500).json({ error: 'Failed to add log' });
        }
        
        res.status(201).json(insertedLog);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add log' });
    }
});

// CleverTap API endpoint for push notifications
app.post('/api/send-push-notification', async (req, res) => {
    try {
        const { customerId, otp } = req.body;
        
        if (!customerId || !otp) {
            return res.status(400).json({ error: 'Customer ID and OTP are required' });
        }
        
        console.log('Sending push notification to CleverTap:', {
            customerId,
            otp,
            url: 'https://api.clevertap.com/1/send/externaltrigger.json'
        });
        
        const requestBody = {
            to: {
                identity: [customerId]
            },
            campaign_id: "1750575722",
            ExternalTrigger: {
                OTP: otp
            }
        };
        
        console.log('CleverTap request body:', JSON.stringify(requestBody, null, 2));
        
        const response = await fetch('https://api.clevertap.com/1/send/externaltrigger.json', {
            method: 'POST',
            headers: {
                'X-CleverTap-Account-Id': 'R9Z-4RW-855Z',
                'X-CleverTap-Passcode': 'ERK-ASE-CPKL',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('CleverTap response status:', response.status);
        console.log('CleverTap response headers:', Object.fromEntries(response.headers.entries()));
        
        // Get response text first
        const responseText = await response.text();
        console.log('CleverTap response text:', responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse CleverTap response as JSON:', parseError);
            console.log('Raw response:', responseText);
            
            // Return a structured error response
            return res.status(500).json({
                success: false,
                message: 'Invalid response from CleverTap API',
                error: 'Response is not valid JSON',
                rawResponse: responseText,
                status: response.status
            });
        }
        
        if (response.ok) {
            console.log('CleverTap API success:', data);
            res.json({ success: true, message: 'Push notification sent successfully', data });
        } else {
            console.log('CleverTap API error:', data);
            res.status(response.status).json({ 
                success: false, 
                message: 'Failed to send push notification', 
                error: data,
                status: response.status
            });
        }
        
    } catch (error) {
        console.error('Push notification error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error', 
            error: error.message 
        });
    }
});

// SMS API endpoint using SMSGupshup
app.post('/api/send-sms', async (req, res) => {
    try {
        const { oldPhone, otp } = req.body;
        
        if (!oldPhone || !otp) {
            return res.status(400).json({ error: 'Phone number and OTP are required' });
        }
        
        // Remove +91 prefix if present and ensure it's a 10-digit number
        let phoneNumber = oldPhone.replace('+91', '').replace(/\s/g, '');
        
        // Validate phone number format
        if (!/^\d{10}$/.test(phoneNumber)) {
            return res.status(400).json({ 
                error: 'Invalid phone number format. Please enter a 10-digit number without +91 prefix' 
            });
        }
        
        console.log('Sending SMS via SMSGupshup:', {
            originalPhone: oldPhone,
            formattedPhone: phoneNumber,
            otp,
            url: 'https://enterprise.smsgupshup.com/GatewayAPI/rest'
        });
        
        // Construct the SMS API URL
        const smsUrl = `https://enterprise.smsgupshup.com/GatewayAPI/rest?userid=2000193891&password=x394F4ge&send_to=91${phoneNumber}&msg=Your%20Khatabook%20verification%20OTP%20is%20${otp}&method=SendMessage&format=JSON&v=1.1&auth_scheme=Plain&msg_type=Text&principalEntityId=1601100000000000654&dltTemplateId=1007194642344586649`;
        
        console.log('SMS API URL:', smsUrl);
        
        const response = await fetch(smsUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('SMS API response status:', response.status);
        console.log('SMS API response headers:', Object.fromEntries(response.headers.entries()));
        
        // Get response text first
        const responseText = await response.text();
        console.log('SMS API response text:', responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse SMS API response as JSON:', parseError);
            console.log('Raw SMS response:', responseText);
            
            return res.status(500).json({
                success: false,
                message: 'Invalid response from SMS API',
                error: 'Response is not valid JSON',
                rawResponse: responseText,
                status: response.status
            });
        }
        
        console.log('Parsed SMS API response:', JSON.stringify(data, null, 2));
        
        // Check for specific error conditions
        if (data.response) {
            if (data.response.status === 'success') {
                console.log('SMS API success:', data);
                res.json({ 
                    success: true, 
                    message: 'SMS sent successfully', 
                    data,
                    phoneNumber: phoneNumber,
                    messageId: data.response.id
                });
            } else {
                console.log('SMS API error:', data);
                const errorMessage = data.response.details || data.response.status || 'Unknown error';
                res.status(400).json({ 
                    success: false, 
                    message: 'Failed to send SMS', 
                    error: errorMessage,
                    data: data,
                    phoneNumber: phoneNumber
                });
            }
        } else {
            // Handle case where response structure is different
            console.log('Unexpected SMS API response structure:', data);
            res.status(500).json({
                success: false,
                message: 'Unexpected response from SMS API',
                data: data,
                phoneNumber: phoneNumber
            });
        }
        
    } catch (error) {
        console.error('SMS API error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error', 
            error: error.message 
        });
    }
});

// WhatsApp API endpoint using SMSGupshup
app.post('/api/send-whatsapp', async (req, res) => {
    try {
        const { oldPhone, otp } = req.body;
        
        if (!oldPhone || !otp) {
            return res.status(400).json({ error: 'Phone number and OTP are required' });
        }
        
        // Remove +91 prefix if present and ensure it's a 10-digit number
        let phoneNumber = oldPhone.replace('+91', '').replace(/\s/g, '');
        
        // Validate phone number format
        if (!/^\d{10}$/.test(phoneNumber)) {
            return res.status(400).json({ 
                error: 'Invalid phone number format. Please enter a 10-digit number without +91 prefix' 
            });
        }
        
        console.log('Sending WhatsApp via SMSGupshup:', {
            originalPhone: oldPhone,
            formattedPhone: phoneNumber,
            otp,
            url: 'https://mediaapi.smsgupshup.com/GatewayAPI/rest'
        });
        
        // Construct the WhatsApp API URL
        const whatsappUrl = `https://mediaapi.smsgupshup.com/GatewayAPI/rest?userid=2000186106&password=F4EUan&send_to=${phoneNumber}&v=1.1&format=json&msg_type=TEXT&method=SENDMESSAGE&msg=${otp}+is+your+verification+code.&isTemplate=true&footer=This+code+expires+in+10+minute.`;
        
        console.log('WhatsApp API URL:', whatsappUrl);
        
        const response = await fetch(whatsappUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('WhatsApp API response status:', response.status);
        console.log('WhatsApp API response headers:', Object.fromEntries(response.headers.entries()));
        
        // Get response text first
        const responseText = await response.text();
        console.log('WhatsApp API response text:', responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse WhatsApp API response as JSON:', parseError);
            console.log('Raw WhatsApp response:', responseText);
            
            return res.status(500).json({
                success: false,
                message: 'Invalid response from WhatsApp API',
                error: 'Response is not valid JSON',
                rawResponse: responseText,
                status: response.status
            });
        }
        
        console.log('Parsed WhatsApp API response:', JSON.stringify(data, null, 2));
        
        // Check for specific error conditions
        if (data.response) {
            if (data.response.status === 'success') {
                console.log('WhatsApp API success:', data);
                res.json({ 
                    success: true, 
                    message: 'WhatsApp message sent successfully', 
                    data,
                    phoneNumber: phoneNumber,
                    messageId: data.response.id
                });
            } else {
                console.log('WhatsApp API error:', data);
                const errorMessage = data.response.details || data.response.status || 'Unknown error';
                res.status(400).json({ 
                    success: false, 
                    message: 'Failed to send WhatsApp message', 
                    error: errorMessage,
                    data: data,
                    phoneNumber: phoneNumber
                });
            }
        } else {
            // Handle case where response structure is different
            console.log('Unexpected WhatsApp API response structure:', data);
            res.status(500).json({
                success: false,
                message: 'Unexpected response from WhatsApp API',
                data: data,
                phoneNumber: phoneNumber
            });
        }
        
    } catch (error) {
        console.error('WhatsApp API error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error', 
            error: error.message 
        });
    }
});

// WhatsApp Form API endpoint using SMSGupshup
app.post('/api/send-whatsapp-form', async (req, res) => {
    try {
        const { newPhone, language = 'english' } = req.body;
        
        if (!newPhone) {
            return res.status(400).json({ error: 'New phone number is required' });
        }
        
        // Remove +91 prefix if present and ensure it's a 10-digit number
        let phoneNumber = newPhone.replace('+91', '').replace(/\s/g, '');
        
        // Validate phone number format
        if (!/^\d{10}$/.test(phoneNumber)) {
            return res.status(400).json({ 
                error: 'Invalid phone number format. Please enter a 10-digit number without +91 prefix' 
            });
        }
        
        console.log('Sending WhatsApp form via SMSGupshup:', {
            originalPhone: newPhone,
            formattedPhone: phoneNumber,
            language,
            url: 'https://mediaapi.smsgupshup.com/GatewayAPI/rest'
        });
        
        // Construct the WhatsApp Form API URL based on language
        let whatsappFormUrl;
        if (language === 'hindi') {
            // Hindi WhatsApp form URL - using exact working sample format
            whatsappFormUrl = `https://mediaapi.smsgupshup.com/GatewayAPI/rest?userid=2000186106&password=F4EUan&send_to=${phoneNumber}&v=1.1&format=json&msg_type=TEXT&method=SENDMESSAGE&msg=%E0%A4%B9%E0%A4%AE%E0%A5%87%E0%A4%82+%E0%A4%86%E0%A4%AA%E0%A4%95%E0%A4%BE+Khatabook+%E0%A4%AE%E0%A5%8B%E0%A4%AC%E0%A4%BE%E0%A4%87%E0%A4%B2+%E0%A4%A8%E0%A4%82%E0%A4%AC%E0%A4%B0+%E0%A4%AC%E0%A4%A6%E0%A4%B2%E0%A4%A8%E0%A5%87+%E0%A4%95%E0%A4%BE+%E0%A4%B0%E0%A4%BF%E0%A4%95%E0%A5%8D%E0%A4%B5%E0%A5%87%E0%A4%B8%E0%A5%8D%E0%A4%9F+%E0%A4%AE%E0%A4%BF%E0%A4%B2%E0%A4%BE+%E0%A4%B9%E0%A5%88%E0%A5%A4%0A%0A%E0%A4%95%E0%A5%83%E0%A4%AA%E0%A4%AF%E0%A4%BE+%E0%A4%AA%E0%A5%8D%E0%A4%B0%E0%A5%8B%E0%A4%B8%E0%A5%87%E0%A4%B8+%E0%A4%B6%E0%A5%81%E0%A4%B0%E0%A5%82+%E0%A4%95%E0%A4%B0%E0%A4%A8%E0%A5%87+%E0%A4%95%E0%A5%87+%E0%A4%B2%E0%A4%BF%E0%A4%8F+%E0%A4%A8%E0%A5%80%E0%A4%9A%E0%A5%87+%E0%A4%A6%E0%A4%BF%E0%A4%8F+%E0%A4%B2%E0%A4%BF%E0%A4%82%E0%A4%95+%E0%A4%AA%E0%A4%B0+%E0%A4%95%E0%A5%8D%E0%A4%B2%E0%A4%BF%E0%A4%95+%E0%A4%95%E0%A4%B0%E0%A5%87%E0%A4%82%E0%A5%A4&isTemplate=true`;
        } else {
            // English WhatsApp form URL (default)
            whatsappFormUrl = `https://mediaapi.smsgupshup.com/GatewayAPI/rest?userid=2000186106&password=F4EUan&send_to=${phoneNumber}&v=1.1&format=json&msg_type=TEXT&method=SENDMESSAGE&msg=We+have+recieved+your+request+to+change+your+registered+Khatabook+Phone+Number%0A%0APlease+click+on+the+link+below+to+proceed+with+the+process&isTemplate=true`;
        }
        
        console.log('WhatsApp Form API URL:', whatsappFormUrl);
        
        const response = await fetch(whatsappFormUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('WhatsApp Form API response status:', response.status);
        console.log('WhatsApp Form API response headers:', Object.fromEntries(response.headers.entries()));
        
        // Get response text first
        const responseText = await response.text();
        console.log('WhatsApp Form API response text:', responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse WhatsApp Form API response as JSON:', parseError);
            console.log('Raw WhatsApp Form response:', responseText);
            
            return res.status(500).json({
                success: false,
                message: 'Invalid response from WhatsApp Form API',
                error: 'Response is not valid JSON',
                rawResponse: responseText,
                status: response.status
            });
        }
        
        console.log('Parsed WhatsApp Form API response:', JSON.stringify(data, null, 2));
        
        // Check for specific error conditions
        if (data.response) {
            if (data.response.status === 'success') {
                console.log('WhatsApp Form API success:', data);
                res.json({ 
                    success: true, 
                    message: 'WhatsApp form message sent successfully', 
                    data,
                    phoneNumber: phoneNumber,
                    language: language,
                    messageId: data.response.id
                });
            } else {
                console.log('WhatsApp Form API error:', data);
                const errorMessage = data.response.details || data.response.status || 'Unknown error';
                res.status(400).json({ 
                    success: false, 
                    message: 'Failed to send WhatsApp form message', 
                    error: errorMessage,
                    data: data,
                    phoneNumber: phoneNumber,
                    language: language
                });
            }
        } else {
            // Handle case where response structure is different
            console.log('Unexpected WhatsApp Form API response structure:', data);
            res.status(500).json({
                success: false,
                message: 'Unexpected response from WhatsApp Form API',
                data: data,
                phoneNumber: phoneNumber,
                language: language
            });
        }
        
    } catch (error) {
        console.error('WhatsApp Form API error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error', 
            error: error.message 
        });
    }
});

// SMS Form API endpoint using SMSGupshup
app.post('/api/send-sms-form', async (req, res) => {
    try {
        const { newPhone, language = 'english' } = req.body;
        
        if (!newPhone) {
            return res.status(400).json({ error: 'New phone number is required' });
        }
        
        // Remove +91 prefix if present and ensure it's a 10-digit number
        let phoneNumber = newPhone.replace('+91', '').replace(/\s/g, '');
        
        // Validate phone number format
        if (!/^\d{10}$/.test(phoneNumber)) {
            return res.status(400).json({ 
                error: 'Invalid phone number format. Please enter a 10-digit number without +91 prefix' 
            });
        }
        
        console.log('Sending SMS form via SMSGupshup:', {
            originalPhone: newPhone,
            formattedPhone: phoneNumber,
            language,
            url: 'https://enterprise.smsgupshup.com/GatewayAPI/rest'
        });
        
        // Construct the SMS Form API URL based on language
        let smsFormUrl;
        if (language === 'hindi') {
            // Hindi SMS form URL (updated with correct form link)
            smsFormUrl = `https://enterprise.smsgupshup.com/GatewayAPI/rest?userid=2000193891&password=x394F4ge&send_to=91${phoneNumber}&msg=We%20have%20received%20your%20request%20to%20update%20your%20Khatabook%20phone%20number.%20Click%20the%20link%20to%20complete%20the%20process%3A%20https://forms.gle/RxSM1cFmpqJ5E5dp9&method=SendMessage&format=JSON&v=1.1&auth_scheme=Plain&msg_type=Text&principalEntityId=1601100000000000654&dltTemplateId=1007657052465213311`;
        } else {
            // English SMS form URL
            smsFormUrl = `https://enterprise.smsgupshup.com/GatewayAPI/rest?userid=2000193891&password=x394F4ge&send_to=91${phoneNumber}&msg=We%20have%20received%20your%20request%20to%20update%20your%20Khatabook%20phone%20number.%20Click%20the%20link%20to%20complete%20the%20process%3A%20https://forms.gle/kXKU5HCtrjKDYZPH9&method=SendMessage&format=JSON&v=1.1&auth_scheme=Plain&msg_type=Text&principalEntityId=1601100000000000654&dltTemplateId=1007657052465213311`;
        }
        
        console.log('SMS Form API URL:', smsFormUrl);
        
        const response = await fetch(smsFormUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('SMS Form API response status:', response.status);
        console.log('SMS Form API response headers:', Object.fromEntries(response.headers.entries()));
        
        // Get response text first
        const responseText = await response.text();
        console.log('SMS Form API response text:', responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse SMS Form API response as JSON:', parseError);
            console.log('Raw SMS Form response:', responseText);
            
            return res.status(500).json({
                success: false,
                message: 'Invalid response from SMS Form API',
                error: 'Response is not valid JSON',
                rawResponse: responseText,
                status: response.status
            });
        }
        
        console.log('Parsed SMS Form API response:', JSON.stringify(data, null, 2));
        
        // Check for specific error conditions
        if (data.response) {
            if (data.response.status === 'success') {
                console.log('SMS Form API success:', data);
                res.json({ 
                    success: true, 
                    message: 'SMS form message sent successfully', 
                    data,
                    phoneNumber: phoneNumber,
                    language: language,
                    messageId: data.response.id
                });
            } else {
                console.log('SMS Form API error:', data);
                const errorMessage = data.response.details || data.response.status || 'Unknown error';
                res.status(400).json({ 
                    success: false, 
                    message: 'Failed to send SMS form message', 
                    error: errorMessage,
                    data: data,
                    phoneNumber: phoneNumber,
                    language: language
                });
            }
        } else {
            // Handle case where response structure is different
            console.log('Unexpected SMS Form API response structure:', data);
            res.status(500).json({
                success: false,
                message: 'Unexpected response from SMS Form API',
                data: data,
                phoneNumber: phoneNumber,
                language: language
            });
        }
        
    } catch (error) {
        console.error('SMS Form API error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error', 
            error: error.message 
        });
    }
});

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/styles.css', (req, res) => {
    res.sendFile(path.join(__dirname, '../styles.css'));
});

app.get('/script.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../script.js'));
});

// Initialize and start server
async function startServer() {
    await initializeDefaultData();
    
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Admin panel available at http://localhost:${PORT}`);
    });
}

startServer().catch(console.error); 