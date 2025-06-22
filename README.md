# Khatabook Number Change Portal

A comprehensive portal for managing customer phone number change verification requests with agent management capabilities.

## Features

### For Agents
- **Customer Information Management**: Enter and manage customer details for number change requests
- **OTP Generation**: Generate secure OTPs for customer verification
- **Multi-Channel Messaging**: Send OTPs and forms via:
  - Push Notifications
  - SMS
  - WhatsApp (English & Hindi)
- **Access Control**: Handle cases where customers have/don't have access to old SIM/WhatsApp

### For Admins
- **Agent Management**: Create, edit, delete, and manage support team agents
- **Activity Monitoring**: Real-time logs of all verification activities
- **Status Management**: Activate/deactivate agents as needed
- **Data Export**: Download activity logs in CSV format
- **Search & Filter**: Advanced filtering and search capabilities

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Authentication**: bcryptjs for password hashing
- **Data Storage**: JSON files (file-based database)
- **Styling**: Custom CSS with Khatabook branding

## Setup Instructions

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Number_Change_Portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the backend server**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`
   - The application will automatically serve the frontend

### Default Credentials

#### Admin Access
- **Username**: `admin`
- **Password**: `admin123`

#### Sample Agents (Pre-loaded)
- **Agent ID**: `AG001`, **Password**: `agent123`
- **Agent ID**: `AG002`, **Password**: `agent456`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Agent login
- `POST /api/auth/admin-login` - Admin login

### Agent Management
- `GET /api/agents` - Get all agents
- `POST /api/agents` - Create new agent
- `PUT /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent
- `PATCH /api/agents/:id/status` - Toggle agent status

### Activity Logs
- `GET /api/logs` - Get all activity logs
- `POST /api/logs` - Add new activity log

## Agent Management Features

### Creating Agents
1. Login as admin
2. Click "Manage Agents" in the sidebar
3. Fill in the agent details:
   - Full Name
   - Email (must be unique)
   - Phone (format: +91XXXXXXXXXX)
   - Password (minimum 6 characters)
4. Click "Create Agent"

### Managing Agents
- **Edit**: Click the edit button to modify agent details
- **Toggle Status**: Activate/deactivate agents using the status toggle
- **Delete**: Remove agents permanently (with confirmation)
- **Search**: Filter agents by name, email, or ID

### Agent Validation
- Email must be unique across all agents
- Phone numbers must follow Indian format (+91XXXXXXXXXX)
- Passwords are automatically hashed using bcrypt
- Agent IDs are auto-generated (AG001, AG002, etc.)

## Data Storage

The application uses JSON files for data storage:
- `backend/data/agents.json` - Agent information
- `backend/data/logs.json` - Activity logs

Data is automatically initialized with sample agents on first run.

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt
- **Input Validation**: Comprehensive validation for all user inputs
- **CORS Protection**: Configured for secure cross-origin requests
- **Error Handling**: Proper error responses without exposing sensitive data

## File Structure

```
Number_Change_Portal/
├── index.html              # Main application page
├── styles.css              # Application styles
├── script.js               # Frontend JavaScript
├── package.json            # Node.js dependencies
├── README.md               # This file
└── backend/
    ├── server.js           # Express server
    └── data/               # Data storage directory
        ├── agents.json     # Agent data
        └── logs.json       # Activity logs
```

## Development

### Adding New Features
1. Backend API endpoints in `backend/server.js`
2. Frontend functionality in `script.js`
3. Styling updates in `styles.css`

### Testing
- Test agent creation with various input combinations
- Verify OTP generation and messaging functionality
- Check admin dashboard features
- Test responsive design on different screen sizes

## Production Deployment

For production deployment:
1. Set up environment variables for sensitive data
2. Use a proper database (PostgreSQL, MongoDB, etc.)
3. Implement proper session management
4. Add rate limiting and additional security measures
5. Set up HTTPS
6. Configure proper logging and monitoring

## Support

For technical support or feature requests, please contact the development team.

## License

This project is proprietary software developed for Khatabook. 