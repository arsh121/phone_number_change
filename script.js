let currentUser = null;
let currentOTP = null;
let activityLogs = [];
let agents = [];

// API Base URL - works for both local and production
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : window.location.origin + '/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        if (currentUser.role === 'admin') {
            showAdminDashboard();
        } else {
            showDashboard();
        }
        return;
    }
    setupEventListeners();
}

function setupEventListeners() {
    // Tab switching
    document.getElementById('agentTab').addEventListener('click', function() {
        switchTab('agent');
    });
    document.getElementById('adminTab').addEventListener('click', function() {
        switchTab('admin');
    });

    // Login form submissions
    const agentLoginForm = document.getElementById('agentLoginForm');
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (agentLoginForm) agentLoginForm.addEventListener('submit', handleAgentLogin);
    if (adminLoginForm) adminLoginForm.addEventListener('submit', handleAdminLogin);
}

function setupTabSwitching() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = btn.getAttribute('data-tab');
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.login-form').forEach(f => f.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(tab + 'LoginForm').classList.add('active');
        });
    });
}

// API Helper Functions
async function apiCall(endpoint, options = {}) {
    try {
        console.log(`Making API call to: ${API_BASE_URL}${endpoint}`, options);
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (!response.ok) {
            throw new Error(data.error || data.errors?.join(', ') || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error Details:', {
            endpoint: `${API_BASE_URL}${endpoint}`,
            options: options,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

// Login handlers
async function handleAgentLogin(event) {
    event.preventDefault();
    
    const agentId = document.getElementById('agentId').value;
    const password = document.getElementById('agentPassword').value;
    
    try {
        const agent = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ agentId, password })
        });
        
        currentUser = { type: 'agent', ...agent };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showDashboard();
    } catch (error) {
        showStatusMessage(error.message, 'error');
    }
}

async function handleAdminLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    try {
        const admin = await apiCall('/auth/admin-login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        currentUser = { type: 'admin', ...admin };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showAdminDashboard();
    } catch (error) {
        showStatusMessage(error.message, 'error');
    }
}

// Dashboard display functions
function showDashboard() {
    document.body.innerHTML = `
        <div class="dashboard">
            <div class="dashboard-header">
                <h1>
                    <div class="khatabook-logo">
                        <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 0C8.95431 0 0 8.95431 0 20C0 31.0457 8.95431 40 20 40C31.0457 40 40 31.0457 40 20C40 8.95431 31.0457 0 20 0Z" fill="white"/>
                            <path d="M12 16C12 13.7909 13.7909 12 16 12H24C26.2091 12 28 13.7909 28 16V24C28 26.2091 26.2091 28 24 28H16C13.7909 28 12 26.2091 12 24V16Z" fill="#dc2626"/>
                            <path d="M16 18H24V20H16V18Z" fill="white"/>
                            <path d="M16 22H20V24H16V22Z" fill="white"/>
                        </svg>
                        <span class="khatabook-logo-text">Number Change Portal</span>
                    </div>
                </h1>
                <div class="user-info">
                    <span>Welcome, ${currentUser.name} (${currentUser.id})</span>
                    <button class="logout-btn" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </div>
            
            <div class="main-content">
                <div class="page-header">
                    <h1 class="page-title">Customer Number Change Request</h1>
                    <p class="page-subtitle">Process customer phone number change verification requests</p>
                </div>
                
                <div class="form-container">
                    <div class="form-header">
                        <h3>Customer Information</h3>
                        <p>Enter the customer details and phone numbers for verification</p>
                    </div>
                    
                    <div class="form-body">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="agentName">
                                    <i class="fas fa-user"></i>
                                    Agent Name
                                </label>
                                <input type="text" id="agentName" value="${currentUser.name}" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="agentId">
                                    <i class="fas fa-id-card"></i>
                                    Agent ID
                                </label>
                                <input type="text" id="agentId" value="${currentUser.id}" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="customerId">
                                    <i class="fas fa-user-tag"></i>
                                    Customer ID / KB ID
                                </label>
                                <input type="text" id="customerId" placeholder="Enter Customer ID" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="oldPhone">
                                    <i class="fas fa-phone"></i>
                                    Original Phone Number
                                </label>
                                <input type="tel" id="oldPhone" placeholder="Enter ten digit mobile number" maxlength="10" pattern="[0-9]{10}" required oninput="validatePhoneNumber(this)">
                            </div>
                            
                            <div class="form-group">
                                <label for="newPhone">
                                    <i class="fas fa-phone"></i>
                                    New Phone Number
                                </label>
                                <input type="tel" id="newPhone" placeholder="Enter ten digit mobile number" maxlength="10" pattern="[0-9]{10}" required oninput="validatePhoneNumber(this)">
                            </div>
                        </div>
                        
                        <div class="access-section">
                            <div class="access-question">
                                <i class="fas fa-question-circle"></i>
                                Does the customer have access to the old SIM / WhatsApp account?
                            </div>
                            <div class="radio-group">
                                <label class="radio-option">
                                    <input type="radio" name="hasAccess" value="yes" onchange="toggleAccessOptions()">
                                    <span>Yes - Customer can receive OTP</span>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="hasAccess" value="no" onchange="toggleAccessOptions()">
                                    <span>No - Customer needs form message</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- OTP Section (shown when access = yes) -->
                <div id="otpSection" class="hidden">
                    <div class="action-section">
                        <div class="action-header">
                            <h4><i class="fas fa-key"></i> OTP Generation & Verification</h4>
                        </div>
                        <div class="action-body">
                            <div class="action-buttons">
                                <button type="button" class="btn btn-primary" onclick="generateOTP()">
                                    <i class="fas fa-key"></i>
                                    Generate OTP
                                </button>
                            </div>
                            
                            <div id="otpDisplay" class="otp-display hidden">
                                <h3>Generated OTP</h3>
                                <div class="otp-number" id="otpNumber"></div>
                                <p>This OTP will be sent to the customer for verification</p>
                            </div>
                            
                            <div id="sendOTPButtons" class="action-buttons hidden">
                                <button type="button" class="btn btn-success" onclick="sendOTP('push')">
                                    <i class="fas fa-bell"></i>
                                    Send Push Notification
                                </button>
                                <button type="button" class="btn btn-warning" onclick="sendOTP('sms')">
                                    <i class="fas fa-sms"></i>
                                    Send SMS
                                </button>
                                <button type="button" class="btn btn-success" onclick="sendOTP('whatsapp')">
                                    <i class="fab fa-whatsapp"></i>
                                    Send WhatsApp
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Form Section (shown when access = no) -->
                <div id="formSection" class="hidden">
                    <div class="action-section">
                        <div class="action-header">
                            <h4><i class="fas fa-envelope"></i> Send Form Messages</h4>
                        </div>
                        <div class="action-body">
                            <div class="action-buttons">
                                <button type="button" class="btn btn-success" onclick="sendForm('whatsapp', 'english')">
                                    <i class="fab fa-whatsapp"></i>
                                    Send WhatsApp (English)
                                </button>
                                <button type="button" class="btn btn-success" onclick="sendForm('whatsapp', 'hindi')">
                                    <i class="fab fa-whatsapp"></i>
                                    Send WhatsApp (Hindi)
                                </button>
                                <button type="button" class="btn btn-warning" onclick="sendForm('sms', 'english')">
                                    <i class="fas fa-sms"></i>
                                    Send SMS (English)
                                </button>
                                <button type="button" class="btn btn-warning" onclick="sendForm('sms', 'hindi')">
                                    <i class="fas fa-sms"></i>
                                    Send SMS (Hindi)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div id="statusContainer" class="status-container"></div>
    `;
    // Add phone number validation on form submission
    setTimeout(() => {
        const form = document.querySelector('.form-container');
        if (form) {
            form.addEventListener('submit', function(e) {
                const oldPhone = document.getElementById('oldPhone').value;
                const newPhone = document.getElementById('newPhone').value;
                if (!/^\d{10}$/.test(oldPhone) || !/^\d{10}$/.test(newPhone)) {
                    e.preventDefault();
                    showStatusMessage('Please enter valid 10-digit mobile numbers for both old and new phone fields.', 'error');
                }
            });
        }
    }, 0);
}

async function showAdminDashboard() {
    document.body.innerHTML = `
        <div class="dashboard">
            <div class="dashboard-header">
                <h1>
                    <div class="khatabook-logo">
                        <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 0C8.95431 0 0 8.95431 0 20C0 31.0457 8.95431 40 20 40C31.0457 40 40 31.0457 40 20C40 8.95431 31.0457 0 20 0Z" fill="white"/>
                            <path d="M12 16C12 13.7909 13.7909 12 16 12H24C26.2091 12 28 13.7909 28 16V24C28 26.2091 26.2091 28 24 28H16C13.7909 28 12 26.2091 12 24V16Z" fill="#dc2626"/>
                            <path d="M16 18H24V20H16V18Z" fill="white"/>
                            <path d="M16 22H20V24H16V22Z" fill="white"/>
                        </svg>
                        <span class="khatabook-logo-text">Admin Dashboard</span>
                    </div>
                </h1>
                <div class="user-info">
                    <span>Welcome, Admin</span>
                    <button class="logout-btn" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </div>
            
            <div class="main-content">
                <div class="page-header">
                    <h1 class="page-title">Admin Dashboard</h1>
                    <p class="page-subtitle">Monitor and manage number change verification activities</p>
                </div>
                
                <div class="admin-grid">
                    <div class="admin-sidebar">
                        <h3 class="section-title">
                            <i class="fas fa-cog"></i>
                            Admin Actions
                        </h3>
                        
                        <div class="action-buttons">
                            <button class="btn btn-primary" onclick="showAgentManagement()">
                                <i class="fas fa-users"></i>
                                Manage Agents
                            </button>
                            <button class="btn btn-secondary" onclick="showLogs()">
                                <i class="fas fa-list"></i>
                                View Logs
                            </button>
                            <button class="btn btn-success" onclick="downloadLogs()">
                                <i class="fas fa-download"></i>
                                Download CSV
                            </button>
                        </div>
                    </div>
                    
                    <div class="admin-main">
                        <h3 class="section-title">
                            <i class="fas fa-chart-line"></i>
                            Activity Overview
                        </h3>
                        
                        <div class="table-container">
                            <div class="table-header">
                                <h4>Recent Activity Logs</h4>
                                <div class="table-filters">
                                    <input type="date" id="dateFilter" onchange="filterLogs()">
                                    <input type="text" placeholder="Search..." id="searchFilter" onkeyup="filterLogs()">
                                </div>
                            </div>
                            
                            <table id="logsTable">
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>Agent</th>
                                        <th>Channel</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody id="logsTableBody">
                                    <!-- Logs will be populated here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div id="statusContainer" class="status-container"></div>
    `;
    
    await loadLogs();
}

// Agent Management Functions
async function showAgentManagement() {
    try {
        agents = await apiCall('/agents');
        
        document.querySelector('.admin-main').innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Agent Management</h1>
                <p class="page-subtitle">Create, edit, and manage support team agents</p>
            </div>
            
            <div class="action-section">
                <div class="action-header">
                    <h4><i class="fas fa-plus"></i> Add New Agent</h4>
                </div>
                <div class="action-body">
                    <form id="addAgentForm" class="agent-form">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="agentId">Agent ID</label>
                                <input type="text" id="agentId" placeholder="e.g., AG001, AG002" required>
                            </div>
                            <div class="form-group">
                                <label for="agentName">Full Name</label>
                                <input type="text" id="agentName" required>
                            </div>
                            <div class="form-group">
                                <label for="agentEmail">Email</label>
                                <input type="email" id="agentEmail" required>
                            </div>
                            <div class="form-group">
                                <label for="agentPhone">Phone</label>
                                <input type="tel" name="phone" id="agentPhone" placeholder="Enter ten digit mobile number" maxlength="10" pattern="[0-9]{10}" required oninput="validatePhoneNumber(this)">
                            </div>
                            <div class="form-group">
                                <label for="agentPassword">Password</label>
                                <input type="password" id="agentPassword" required>
                            </div>
                        </div>
                        <div class="action-buttons">
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-plus"></i>
                                Create Agent
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <div class="table-container">
                <div class="table-header">
                    <h4>All Agents</h4>
                    <div class="table-filters">
                        <input type="text" placeholder="Search agents..." id="agentSearch" onkeyup="filterAgents()">
                    </div>
                </div>
                
                <table id="agentsTable">
                    <thead>
                        <tr>
                            <th>Agent ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Status</th>
                            <th>Last Login</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="agentsTableBody">
                        <!-- Agents will be populated here -->
                    </tbody>
                </table>
            </div>
        `;
        
        displayAgents(agents);
        setupAgentFormListeners();
        
    } catch (error) {
        showStatusMessage('Failed to load agents: ' + error.message, 'error');
    }
}

function displayAgents(agentsToShow) {
    const tbody = document.getElementById('agentsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    agentsToShow.forEach(agent => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${agent.id}</td>
            <td>${agent.name}</td>
            <td>${agent.email}</td>
            <td>${agent.phone}</td>
            <td>
                <span class="status-${agent.status === 'active' ? 'success' : 'error'}">
                    ${agent.status.toUpperCase()}
                </span>
            </td>
            <td>${agent.lastLogin ? new Date(agent.lastLogin).toLocaleString() : 'Never'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-secondary" onclick="editAgent('${agent.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-${agent.status === 'active' ? 'warning' : 'success'}" onclick="toggleAgentStatus('${agent.id}', '${agent.status}')">
                        <i class="fas fa-${agent.status === 'active' ? 'pause' : 'play'}"></i>
                    </button>
                    <button class="btn btn-danger" onclick="deleteAgent('${agent.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function setupAgentFormListeners() {
    const form = document.getElementById('addAgentForm');
    if (form) {
        form.addEventListener('submit', handleAddAgent);
    }
}

async function handleAddAgent(event) {
    event.preventDefault();
    
    const formData = {
        agentId: document.getElementById('agentId').value.trim(),
        name: document.getElementById('agentName').value.trim(),
        email: document.getElementById('agentEmail').value.trim(),
        phone: document.getElementById('agentPhone').value.trim(),
        password: document.getElementById('agentPassword').value
    };
    
    // Client-side validation
    const errors = [];
    if (!formData.agentId || formData.agentId.length < 2) {
        errors.push('Agent ID must be at least 2 characters long');
    }
    if (!formData.name || formData.name.length < 2) {
        errors.push('Name must be at least 2 characters long');
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.push('Valid email is required');
    }
    if (!formData.phone || !/^\d{10}$/.test(formData.phone)) {
        errors.push('Phone number must be a 10-digit number');
    }
    if (!formData.password || formData.password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }
    
    if (errors.length > 0) {
        showStatusMessage('Validation errors: ' + errors.join(', '), 'error');
        return;
    }
    
    try {
        console.log('Submitting agent data:', formData);
        
        const newAgent = await apiCall('/agents', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        console.log('Agent created successfully:', newAgent);
        
        agents.push(newAgent);
        displayAgents(agents);
        
        // Reset form
        event.target.reset();
        
        showStatusMessage('Agent created successfully!', 'success');
    } catch (error) {
        console.error('Failed to create agent:', error);
        showStatusMessage('Failed to create agent: ' + error.message, 'error');
    }
}

async function editAgent(agentId) {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;
    
    // For now, show a simple edit form
    const newName = prompt('Enter new name:', agent.name);
    const newEmail = prompt('Enter new email:', agent.email);
    const newPhone = prompt('Enter new phone:', agent.phone);
    
    if (newName && newEmail && newPhone) {
        try {
            const updatedAgent = await apiCall(`/agents/${agentId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    name: newName,
                    email: newEmail,
                    phone: newPhone
                })
            });
            
            const index = agents.findIndex(a => a.id === agentId);
            agents[index] = updatedAgent;
            displayAgents(agents);
            
            showStatusMessage('Agent updated successfully!', 'success');
        } catch (error) {
            showStatusMessage('Failed to update agent: ' + error.message, 'error');
        }
    }
}

async function toggleAgentStatus(agentId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
        const updatedAgent = await apiCall(`/agents/${agentId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus })
        });
        
        const index = agents.findIndex(a => a.id === agentId);
        agents[index] = updatedAgent;
        displayAgents(agents);
        
        showStatusMessage(`Agent ${newStatus} successfully!`, 'success');
    } catch (error) {
        showStatusMessage('Failed to update agent status: ' + error.message, 'error');
    }
}

async function deleteAgent(agentId) {
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
        return;
    }
    
    try {
        await apiCall(`/agents/${agentId}`, {
            method: 'DELETE'
        });
        
        agents = agents.filter(a => a.id !== agentId);
        displayAgents(agents);
        
        showStatusMessage('Agent deleted successfully!', 'success');
    } catch (error) {
        showStatusMessage('Failed to delete agent: ' + error.message, 'error');
    }
}

function filterAgents() {
    const searchTerm = document.getElementById('agentSearch')?.value.toLowerCase();
    if (!searchTerm) {
        displayAgents(agents);
        return;
    }
    
    const filteredAgents = agents.filter(agent =>
        agent.name.toLowerCase().includes(searchTerm) ||
        agent.email.toLowerCase().includes(searchTerm) ||
        agent.id.toLowerCase().includes(searchTerm)
    );
    
    displayAgents(filteredAgents);
}

// Form functionality
function toggleAccessOptions() {
    const hasAccess = document.querySelector('input[name="hasAccess"]:checked').value;
    const otpSection = document.getElementById('otpSection');
    const formSection = document.getElementById('formSection');
    
    if (hasAccess === 'yes') {
        otpSection.classList.remove('hidden');
        formSection.classList.add('hidden');
    } else {
        otpSection.classList.add('hidden');
        formSection.classList.remove('hidden');
    }
}

function generateOTP() {
    currentOTP = Math.floor(1000 + Math.random() * 9000).toString();
    
    document.getElementById('otpNumber').textContent = currentOTP;
    document.getElementById('otpDisplay').classList.remove('hidden');
    document.getElementById('sendOTPButtons').classList.remove('hidden');
    
    showStatusMessage('OTP generated successfully!', 'success');
}

function sendOTP(channel) {
    if (!currentOTP) {
        showStatusMessage('Please generate OTP first', 'error');
        return;
    }
    
    const customerId = document.getElementById('customerId').value;
    const oldPhone = document.getElementById('oldPhone').value;
    const newPhone = document.getElementById('newPhone').value;
    
    if (!customerId) {
        showStatusMessage('Please enter Customer ID/KB ID first', 'error');
        return;
    }
    
    if ((channel === 'sms' || channel === 'whatsapp') && !oldPhone) {
        showStatusMessage('Please enter the old phone number first', 'error');
        return;
    }
    
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<span class="loading"></span> Sending...';
    button.disabled = true;
    
    if (channel === 'push') {
        // Call CleverTap API for push notification
        sendPushNotification(customerId, currentOTP, button, originalText);
    } else if (channel === 'sms') {
        // Call SMS API
        sendSMS(oldPhone, currentOTP, button, originalText);
    } else if (channel === 'whatsapp') {
        // Call WhatsApp API
        sendWhatsApp(oldPhone, currentOTP, button, originalText);
    } else {
        // For other channels, keep the existing simulation for now
        setTimeout(() => {
            const success = Math.random() > 0.1; // 90% success rate
            
            if (success) {
                logActivity('OTP', channel, 'success');
                showStatusMessage(`${channel.toUpperCase()} OTP sent successfully!`, 'success');
            } else {
                logActivity('OTP', channel, 'failed');
                showStatusMessage(`Failed to send ${channel.toUpperCase()} OTP`, 'error');
            }
            
            button.innerHTML = originalText;
            button.disabled = false;
        }, 2000);
    }
}

async function sendPushNotification(customerId, otp, button, originalText) {
    try {
        const response = await fetch(`${API_BASE_URL}/send-push-notification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customerId: customerId,
                otp: otp
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            logActivity('OTP', 'push', 'success');
            showStatusMessage('Push notification sent successfully!', 'success');
        } else {
            logActivity('OTP', 'push', 'failed');
            showStatusMessage(`Failed to send push notification: ${data.message}`, 'error');
        }
    } catch (error) {
        console.error('Push notification error:', error);
        logActivity('OTP', 'push', 'failed');
        showStatusMessage(`Failed to send push notification: ${error.message}`, 'error');
    } finally {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

async function sendSMS(oldPhone, otp, button, originalText) {
    try {
        // Format phone number (add 91 prefix if not present)
        let phoneNumber = oldPhone;
        if (!phoneNumber.startsWith('91')) {
            phoneNumber = '91' + phoneNumber;
        }
        
        // Call SMSGupshup via backend proxy (to avoid CORS issues)
        const smsUrl = `https://enterprise.smsgupshup.com/GatewayAPI/rest?userid=2000193891&password=x394F4ge&send_to=${phoneNumber}&msg=Your%20Khatabook%20verification%20OTP%20is%20${otp}&method=SendMessage&format=JSON&v=1.1&auth_scheme=Plain&msg_type=Text&principalEntityId=1601100000000000654&dltTemplateId=1007194642344586649`;
        
        console.log('Calling SMS via backend proxy:', smsUrl);
        
        // Use backend proxy endpoint to avoid CORS
        const response = await fetch(`${API_BASE_URL}/proxy-sms?url=${encodeURIComponent(smsUrl)}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        console.log('Proxy response status:', response.status);
        
        const proxyData = await response.json();
        console.log('Proxy response:', proxyData);
        
        if (!proxyData.success) {
            throw new Error(proxyData.error || 'Proxy request failed');
        }
        
        let data;
        try {
            data = JSON.parse(proxyData.data);
        } catch (parseError) {
            console.error('Failed to parse SMS response:', parseError);
            throw new Error('Invalid response from SMS service');
        }
        
        // SMSGupshup response format: { "response": { "status": "success", ... } }
        if (data.response && data.response.status === 'success') {
            logActivity('OTP', 'sms', 'success');
            showStatusMessage('SMS sent successfully!', 'success');
        } else {
            const errorMsg = data.response?.details || data.response?.status || 'Unknown error';
            logActivity('OTP', 'sms', 'failed');
            showStatusMessage(`Failed to send SMS: ${errorMsg}`, 'error');
        }
    } catch (error) {
        console.error('SMS error:', error);
        logActivity('OTP', 'sms', 'failed');
        showStatusMessage(`Failed to send SMS: ${error.message}`, 'error');
    } finally {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

async function sendWhatsApp(oldPhone, otp, button, originalText) {
    try {
        const response = await fetch(`${API_BASE_URL}/send-whatsapp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                oldPhone: oldPhone,
                otp: otp
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            logActivity('OTP', 'whatsapp', 'success');
            showStatusMessage('WhatsApp message sent successfully!', 'success');
        } else {
            logActivity('OTP', 'whatsapp', 'failed');
            showStatusMessage(`Failed to send WhatsApp message: ${data.error}`, 'error');
        }
    } catch (error) {
        console.error('WhatsApp error:', error);
        logActivity('OTP', 'whatsapp', 'failed');
        showStatusMessage(`Failed to send WhatsApp message: ${error.message}`, 'error');
    } finally {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

function sendForm(channel, language) {
    const newPhone = document.getElementById('newPhone').value;
    
    if (!newPhone) {
        showStatusMessage('Please enter the new phone number first', 'error');
        return;
    }
    
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<span class="loading"></span> Sending...';
    button.disabled = true;
    
    if (channel === 'whatsapp') {
        // Call WhatsApp Form API
        sendWhatsAppForm(newPhone, language, button, originalText);
    } else if (channel === 'sms') {
        // Call SMS Form API
        sendSMSForm(newPhone, language, button, originalText);
    } else {
        // For other channels, keep the existing simulation for now
        setTimeout(() => {
            const success = Math.random() > 0.1; // 90% success rate
            
            if (success) {
                logActivity('Form', channel, 'success', language);
                showStatusMessage(`${channel.toUpperCase()} form (${language}) sent successfully!`, 'success');
            } else {
                logActivity('Form', channel, 'failed', language);
                showStatusMessage(`Failed to send ${channel.toUpperCase()} form (${language})`, 'error');
            }
            
            button.innerHTML = originalText;
            button.disabled = false;
        }, 2000);
    }
}

async function sendWhatsAppForm(newPhone, language, button, originalText) {
    try {
        const response = await fetch(`${API_BASE_URL}/send-whatsapp-form`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                newPhone: newPhone,
                language: language
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            logActivity('Form', 'whatsapp', 'success', language);
            showStatusMessage(`WhatsApp form (${language}) sent successfully!`, 'success');
        } else {
            logActivity('Form', 'whatsapp', 'failed', language);
            showStatusMessage(`Failed to send WhatsApp form (${language}): ${data.error}`, 'error');
        }
    } catch (error) {
        console.error('WhatsApp Form error:', error);
        logActivity('Form', 'whatsapp', 'failed', language);
        showStatusMessage(`Failed to send WhatsApp form (${language}): ${error.message}`, 'error');
    } finally {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

async function sendSMSForm(newPhone, language, button, originalText) {
    try {
        // Format phone number (remove +91 if present, ensure it's 10 digits)
        let phoneNumber = newPhone.replace('+91', '').replace(/\s/g, '');
        
        if (!/^\d{10}$/.test(phoneNumber)) {
            showStatusMessage('Invalid phone number format. Please enter a 10-digit number.', 'error');
            return;
        }
        
        // Call SMSGupshup via backend proxy (to avoid CORS issues)
        let smsFormUrl;
        if (language === 'hindi') {
            // Hindi SMS form URL
            smsFormUrl = `https://enterprise.smsgupshup.com/GatewayAPI/rest?userid=2000193891&password=x394F4ge&send_to=91${phoneNumber}&msg=We%20have%20received%20your%20request%20to%20update%20your%20Khatabook%20phone%20number.%20Click%20the%20link%20to%20complete%20the%20process%3A%20https://forms.gle/RxSM1cFmpqJ5E5dp9&method=SendMessage&format=JSON&v=1.1&auth_scheme=Plain&msg_type=Text&principalEntityId=1601100000000000654&dltTemplateId=1007657052465213311`;
        } else {
            // English SMS form URL
            smsFormUrl = `https://enterprise.smsgupshup.com/GatewayAPI/rest?userid=2000193891&password=x394F4ge&send_to=91${phoneNumber}&msg=We%20have%20received%20your%20request%20to%20update%20your%20Khatabook%20phone%20number.%20Click%20the%20link%20to%20complete%20the%20process%3A%20https://forms.gle/kXKU5HCtrjKDYZPH9&method=SendMessage&format=JSON&v=1.1&auth_scheme=Plain&msg_type=Text&principalEntityId=1601100000000000654&dltTemplateId=1007657052465213311`;
        }
        
        console.log('Calling SMS form via backend proxy:', smsFormUrl);
        
        // Use backend proxy endpoint to avoid CORS
        const response = await fetch(`${API_BASE_URL}/proxy-sms?url=${encodeURIComponent(smsFormUrl)}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        console.log('Proxy form response status:', response.status);
        
        const proxyData = await response.json();
        console.log('Proxy form response:', proxyData);
        
        if (!proxyData.success) {
            throw new Error(proxyData.error || 'Proxy request failed');
        }
        
        let data;
        try {
            data = JSON.parse(proxyData.data);
        } catch (parseError) {
            console.error('Failed to parse SMS form response:', parseError);
            throw new Error('Invalid response from SMS service');
        }
        
        // SMSGupshup response format: { "response": { "status": "success", ... } }
        if (data.response && data.response.status === 'success') {
            logActivity('Form', 'sms', 'success', language);
            showStatusMessage(`SMS form (${language}) sent successfully!`, 'success');
        } else {
            const errorMsg = data.response?.details || data.response?.status || 'Unknown error';
            logActivity('Form', 'sms', 'failed', language);
            showStatusMessage(`Failed to send SMS form (${language}): ${errorMsg}`, 'error');
        }
    } catch (error) {
        console.error('SMS Form error:', error);
        logActivity('Form', 'sms', 'failed', language);
        showStatusMessage(`Failed to send SMS form (${language}): ${error.message}`, 'error');
    } finally {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// Logging functionality
async function logActivity(messageType, channel, status, language = '') {
    const log = {
        timestamp: new Date().toISOString(),
        agentName: currentUser.name || 'Admin',
        agentId: currentUser.id || 'ADMIN',
        customerId: document.getElementById('customerId')?.value || 'N/A',
        oldPhone: document.getElementById('oldPhone')?.value || 'N/A',
        newPhone: document.getElementById('newPhone')?.value || 'N/A',
        otp: currentOTP || 'N/A',
        channel: channel,
        messageType: messageType,
        language: language,
        status: status
    };
    
    try {
        await apiCall('/logs', {
            method: 'POST',
            body: JSON.stringify(log)
        });
        
        activityLogs.push(log);
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
}

async function loadLogs() {
    try {
        activityLogs = await apiCall('/logs');
        displayLogs(activityLogs);
    } catch (error) {
        console.error('Failed to load logs:', error);
        showStatusMessage('Failed to load activity logs', 'error');
    }
}

function displayLogs(logs) {
    const tbody = document.getElementById('logsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    logs.forEach(log => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(log.timestamp).toLocaleString()}</td>
            <td>${log.agentName} (${log.agentId})</td>
            <td>${log.channel.toUpperCase()}${log.language ? ` (${log.language})` : ''}</td>
            <td>${log.messageType}</td>
            <td>
                <span class="status-${log.status === 'success' ? 'success' : 'error'}">
                    ${log.status.toUpperCase()}
                </span>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterLogs() {
    const dateFilter = document.getElementById('dateFilter')?.value;
    const searchFilter = document.getElementById('searchFilter')?.value.toLowerCase();
    
    let filteredLogs = activityLogs;
    
    if (dateFilter) {
        const filterDate = new Date(dateFilter);
        filteredLogs = filteredLogs.filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate.toDateString() === filterDate.toDateString();
        });
    }
    
    if (searchFilter) {
        filteredLogs = filteredLogs.filter(log => 
            log.agentName.toLowerCase().includes(searchFilter) ||
            log.agentId.toLowerCase().includes(searchFilter) ||
            log.customerId.toLowerCase().includes(searchFilter) ||
            log.channel.toLowerCase().includes(searchFilter)
        );
    }
    
    displayLogs(filteredLogs);
}

function downloadLogs() {
    const csvContent = convertToCSV(activityLogs);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

function convertToCSV(logs) {
    const headers = ['Timestamp', 'Agent Name', 'Agent ID', 'Customer ID', 'Old Phone', 'New Phone', 'OTP', 'Channel', 'Message Type', 'Language', 'Status'];
    const csvRows = [headers.join(',')];
    
    logs.forEach(log => {
        const row = [
            log.timestamp,
            log.agentName,
            log.agentId,
            log.customerId,
            log.oldPhone,
            log.newPhone,
            log.otp,
            log.channel,
            log.messageType,
            log.language,
            log.status
        ];
        csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
}

// Utility functions
function showStatusMessage(message, type) {
    const container = document.getElementById('statusContainer');
    if (!container) return;
    
    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message status-${type}`;
    statusDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${message}
    `;
    
    container.appendChild(statusDiv);
    
    setTimeout(() => {
        statusDiv.remove();
    }, 5000);
}

function logout() {
    localStorage.removeItem('currentUser');
    location.reload();
}

// Admin functions
function showLogs() {
    // Always render the logs view in the admin main area, regardless of current subpage
    document.querySelector('.admin-main').innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Activity Logs</h1>
            <p class="page-subtitle">Monitor all number change verification activities</p>
        </div>
        
        <div class="table-container">
            <div class="table-header">
                <h4>Activity Logs</h4>
                <div class="table-filters">
                    <input type="date" id="dateFilter" onchange="filterLogs()">
                    <input type="text" placeholder="Search..." id="searchFilter" onkeyup="filterLogs()">
                </div>
            </div>
            
            <table id="logsTable">
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>Agent</th>
                        <th>Channel</th>
                        <th>Type</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody id="logsTableBody">
                    <!-- Logs will be populated here -->
                </tbody>
            </table>
        </div>
    `;
    
    // Load and display the logs
    loadLogs();
}

// Phone number validation helper
function validatePhoneNumber(input) {
    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 10);
}

function switchTab(tab) {
    const agentTab = document.getElementById('agentTab');
    const adminTab = document.getElementById('adminTab');
    const agentForm = document.getElementById('agentLoginForm');
    const adminForm = document.getElementById('adminLoginForm');
    if (tab === 'agent') {
        agentTab.classList.add('active');
        adminTab.classList.remove('active');
        agentForm.classList.add('active');
        adminForm.classList.remove('active');
    } else {
        adminTab.classList.add('active');
        agentTab.classList.remove('active');
        adminForm.classList.add('active');
        agentForm.classList.remove('active');
    }
} 
