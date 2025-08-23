export interface SecurityConfig {
  bcryptRounds: number;
  maxFileSize: number;
  allowedFileTypes: string[];
  allowedOrigins: string[];
  sessionSecret: string;
  jwtSecret: string;
  jwtExpiration: string;
}

export const getSecurityConfig = (): SecurityConfig => ({
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['text/csv', 'application/csv'],
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  sessionSecret: process.env.SESSION_SECRET || 'fallback-session-secret',
  jwtSecret: process.env.JWT_SECRET || 'fallback-jwt-secret',
  jwtExpiration: process.env.JWT_EXPIRATION || '1d',
});
