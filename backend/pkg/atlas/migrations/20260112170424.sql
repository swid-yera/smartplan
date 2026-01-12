-- Modify "groups" table
ALTER TABLE "public"."groups" DROP CONSTRAINT "groups_pkey", ADD PRIMARY KEY ("keycloak_id");
