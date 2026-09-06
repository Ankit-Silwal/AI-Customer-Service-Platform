SELECT 'CREATE DATABASE workspace_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'workspace_db')\gexec
SELECT 'CREATE DATABASE "workplace"' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'workplace')\gexec
SELECT 'CREATE DATABASE knowledge_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'knowledge_db')\gexec
SELECT 'CREATE DATABASE conversation_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'conversation_db')\gexec
SELECT 'CREATE DATABASE ticket_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ticket_db')\gexec
SELECT 'CREATE DATABASE analytics_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'analytics_db')\gexec
SELECT 'CREATE DATABASE notification_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'notification_db')\gexec
