const express = require('express');
const app = express();

// Simple proxy to forward SMS requests from Render to SMSGupshup
app.get('/proxy/sms', async (req, res) => {
    try {
        const { url } = req.query;
        
        if (!url) {
            return res.status(400).json({ 
                success: false, 
                error: 'URL parameter is required' 
            });
        }
        
        console.log('Proxying request to:', url);
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Khatabook-Proxy/1.0'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        const responseText = await response.text();
        
        console.log('Response status:', response.status);
        console.log('Response:', responseText);
        
        res.json({
            success: true,
            status: response.status,
            data: responseText
        });
        
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            errorCode: error.code
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`SMS Proxy service running on port ${PORT}`);
});

