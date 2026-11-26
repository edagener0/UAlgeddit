-- Case-insensitive unique usernames: "Alice" and "alice" can no longer coexist,
-- even when both are registered concurrently.
ALTER TABLE "users" ADD COLUMN "username_lower" VARCHAR(20);

UPDATE "users" SET "username_lower" = lower("username");

ALTER TABLE "users" ALTER COLUMN "username_lower" SET NOT NULL;

CREATE UNIQUE INDEX "users_username_lower_key" ON "users"("username_lower");
