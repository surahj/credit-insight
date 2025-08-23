"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
function generateMockCreditData(email) {
    const hash = email.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0);
    const seed = Math.abs(hash);
    const score = 300 + (seed % 551);
    const riskBands = ['excellent', 'good', 'fair', 'poor', 'very_poor'];
    let riskBand = riskBands[4];
    if (score >= 800)
        riskBand = 'excellent';
    else if (score >= 740)
        riskBand = 'good';
    else if (score >= 670)
        riskBand = 'fair';
    else if (score >= 580)
        riskBand = 'poor';
    const enquiries6m = seed % 8;
    const defaults = seed % 4;
    const openLoans = seed % 6;
    const tradeLines = 5 + (seed % 16);
    return {
        score,
        risk_band: riskBand,
        enquiries_6m: enquiries6m,
        defaults,
        open_loans: openLoans,
        trade_lines: tradeLines,
        reference_id: `BUREAU_${Date.now()}_${seed}`,
        timestamp: new Date().toISOString(),
    };
}
function validateApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(401).json({
            error: 'Missing X-API-KEY header',
            code: 'MISSING_API_KEY'
        });
    }
    if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
        return res.status(401).json({
            error: 'Invalid API key',
            code: 'INVALID_API_KEY'
        });
    }
    next();
}
function simulateReliabilityIssues(req, res, next) {
    const random = Math.random();
    if (random < 0.05) {
        return res.status(500).json({
            error: 'Internal server error',
            code: 'INTERNAL_ERROR',
            message: 'Temporary service unavailability'
        });
    }
    if (random < 0.08) {
        return res.status(429).json({
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later',
            retry_after: 30
        });
    }
    if (random < 0.10) {
        return res.status(400).json({
            error: 'Bad request',
            code: 'INVALID_REQUEST',
            message: 'Request validation failed'
        });
    }
    const delay = 50 + Math.random() * 450;
    setTimeout(next, delay);
}
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Mock Credit Bureau API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});
app.post('/v1/credit/check', validateApiKey, simulateReliabilityIssues, (req, res) => {
    const { email, user_id, additional_data } = req.body;
    if (!email) {
        return res.status(400).json({
            error: 'Missing required field: email',
            code: 'MISSING_EMAIL'
        });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            error: 'Invalid email format',
            code: 'INVALID_EMAIL'
        });
    }
    try {
        const creditData = generateMockCreditData(email);
        res.json({
            status: 'success',
            data: creditData,
            request_id: `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            processing_time_ms: Math.floor(50 + Math.random() * 450)
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to process credit check',
            code: 'PROCESSING_ERROR'
        });
    }
});
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        code: 'NOT_FOUND',
        available_endpoints: [
            'GET /health',
            'POST /v1/credit/check'
        ]
    });
});
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
    });
});
app.listen(PORT, () => {
    console.log(`Mock Credit Bureau API running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Credit check: POST http://localhost:${PORT}/v1/credit/check`);
    console.log('Required header: X-API-KEY');
});
