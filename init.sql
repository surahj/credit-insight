-- MySQL initialization script for Credit Insight Service
-- This script is automatically executed when the MySQL container starts

-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS credit_insight_db;

-- Use the database
USE credit_insight_db;

-- Grant privileges to the application user
GRANT ALL PRIVILEGES ON credit_insight_db.* TO 'credit_user'@'%';

-- Flush privileges
FLUSH PRIVILEGES;

-- Set timezone to UTC
SET GLOBAL time_zone = '+00:00';

-- Enable MySQL general query log for debugging (development only)
-- SET GLOBAL general_log = 'ON';
-- SET GLOBAL general_log_file = '/var/log/mysql/mysql.log';

-- Configure MySQL settings for better performance
SET GLOBAL innodb_buffer_pool_size = 268435456; -- 256MB
SET GLOBAL max_connections = 200;
SET GLOBAL wait_timeout = 28800;
SET GLOBAL interactive_timeout = 28800;

-- Create an admin user (for development/testing)
-- In production, this should be done more securely
SET @admin_email = 'admin@creditinsight.com';
SET @admin_password = '$2b$12$rOiGXcmG5DKpF8rKiNyKMeN.xGV3dEWjV6K4ZZfJsVvF4Qm.KLMWK'; -- hashed "admin123"

-- Note: The actual tables will be created by TypeORM when the application starts
-- This script only sets up the database and user permissions
