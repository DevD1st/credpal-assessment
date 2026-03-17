-- Initialize CredPal FX Trading App database schemas

-- Create schemas for each service
CREATE SCHEMA IF NOT EXISTS accounts;
CREATE SCHEMA IF NOT EXISTS notifications;
CREATE SCHEMA IF NOT EXISTS wallets;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA accounts TO credpal;
GRANT ALL PRIVILEGES ON SCHEMA notifications TO    credpal;
GRANT ALL PRIVILEGES ON SCHEMA wallets TO  credpal;

-- Set default search path
ALTER DATABASE credpal SET search_path TO accounts, notifications, wallets, public;
