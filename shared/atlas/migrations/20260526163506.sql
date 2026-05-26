-- Create "penalty" table
CREATE TABLE "public"."penalty" (
  "id" uuid NOT NULL,
  "points" integer[] NULL,
  "teacher" uuid NULL,
  "methodist" uuid NULL,
  "note" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_methodist" FOREIGN KEY ("methodist") REFERENCES "public"."users" ("keycloak_id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "fk_teacher" FOREIGN KEY ("teacher") REFERENCES "public"."users" ("keycloak_id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
