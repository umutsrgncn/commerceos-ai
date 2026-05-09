-- Read-only Postgres user used by the AI service for natural-language
-- query execution. Idempotent: safe to apply repeatedly.
--
-- Apply to a fresh database via docker-entrypoint-initdb.d (first launch
-- only) or manually:
--
--   docker exec -i commerceos-postgres psql -U commerceos -d commerceos \
--     < db/init/01-readonly-user.sql

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'commerceos_readonly') THEN
    CREATE USER commerceos_readonly WITH PASSWORD 'readonly_pwd_2026';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE commerceos TO commerceos_readonly;
GRANT USAGE ON SCHEMA public TO commerceos_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO commerceos_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO commerceos_readonly;

-- Future tables/sequences created by Prisma migrations also inherit SELECT.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO commerceos_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON SEQUENCES TO commerceos_readonly;
