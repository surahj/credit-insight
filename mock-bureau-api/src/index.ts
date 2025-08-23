import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data generator
function generateMockCreditData(email: string) {
  // Use email to create deterministic but varied data
  const hash = email.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  const seed = Math.abs(hash);

  // Generate deterministic "random" values based on email
  const score = 300 + (seed % 551); // Score between 300-850

  const riskBands = ['excellent', 'good', 'fair', 'poor', 'very_poor'];
  let riskBand = riskBands[4]; // Default to very_poor

  if (score >= 800) riskBand = 'excellent';
  else if (score >= 740) riskBand = 'good';
  else if (score >= 670) riskBand = 'fair';
  else if (score >= 580) riskBand = 'poor';

  const enquiries6m = seed % 8; // 0-7 enquiries
  const defaults = seed % 4; // 0-3 defaults
  const openLoans = seed % 6; // 0-5 open loans
  const tradeLines = 5 + (seed % 16); // 5-20 trade lines

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

// Middleware to check API key
function validateApiKey(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      error: 'Missing X-API-KEY header',
      code: 'MISSING_API_KEY',
    });
  }

  // In a real system, you'd validate against a database
  // For mock, we'll accept any non-empty key
  if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return res.status(401).json({
      error: 'Invalid API key',
      code: 'INVALID_API_KEY',
    });
  }

  next();
}

// Middleware to simulate random failures and delays
function simulateReliabilityIssues(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const random = Math.random();

  // 5% chance of 500 error
  if (random < 0.05) {
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: 'Temporary service unavailability',
    });
  }

  // 3% chance of 429 rate limit
  if (random < 0.08) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
      retry_after: 30,
    });
  }

  // 2% chance of 400 bad request
  if (random < 0.1) {
    return res.status(400).json({
      error: 'Bad request',
      code: 'INVALID_REQUEST',
      message: 'Request validation failed',
    });
  }

  // Simulate random delay (50-500ms)
  const delay = 50 + Math.random() * 450;
  setTimeout(next, delay);
}

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Mock Credit Bureau API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.post(
  '/v1/credit/check',
  validateApiKey,
  simulateReliabilityIssues,
  (req, res) => {
    const { email, user_id, additional_data } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Missing required field: email',
        code: 'MISSING_EMAIL',
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        code: 'INVALID_EMAIL',
      });
    }

    try {
      const creditData = generateMockCreditData(email);

      res.json({
        status: 'success',
        data: creditData,
        request_id: `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        processing_time_ms: Math.floor(50 + Math.random() * 450),
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to process credit check',
        code: 'PROCESSING_ERROR',
      });
    }
  },
);

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    available_endpoints: ['GET /health', 'POST /v1/credit/check'],
  });
});

// Error handling middleware
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  },
);

app.listen(PORT, () => {
  console.log(`Mock Credit Bureau API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Credit check: POST http://localhost:${PORT}/v1/credit/check`);
  console.log('Required header: X-API-KEY');
});
