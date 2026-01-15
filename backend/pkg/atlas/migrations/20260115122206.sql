-- Create enum type "user_role"
CREATE TYPE "public"."user_role" AS ENUM ('ADMIN', 'TEACHER', 'METHODIST');
-- Modify "users" table
ALTER TABLE "public"."users" DROP COLUMN "roles", ADD COLUMN "role" "public"."user_role" NOT NULL;
