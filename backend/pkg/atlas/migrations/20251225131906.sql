-- Create enum type "enum_criteria_method"
CREATE TYPE "public"."enum_criteria_method" AS ENUM ('NORMAL', 'MEASURING');
-- Modify "award_type_criteria" table
ALTER TABLE public.award_type_criteria
ALTER COLUMN points TYPE integer[]
USING CASE
    WHEN points IS NULL THEN NULL
    ELSE ARRAY[points]
END,
ALTER COLUMN method TYPE public.enum_criteria_method
USING CASE
    WHEN method::text IN ('NORMAL', 'MEASURING')
        THEN method::text::public.enum_criteria_method
    ELSE NULL
END,
ALTER COLUMN method SET DEFAULT 'NORMAL',
DROP COLUMN bonus_name,
DROP COLUMN bonus_points,
DROP COLUMN bonus_method;
-- Modify "users" table
ALTER TABLE "public"."users" ADD COLUMN "violation" "public"."violation_enum" NOT NULL;
-- Modify "award_type_variants" table
ALTER TABLE "public"."award_type_variants" ADD COLUMN "bonuscriteria" uuid[] NULL;
-- Modify "awards" table
ALTER TABLE "public"."awards" DROP COLUMN "violation", ADD COLUMN "teacher" uuid NOT NULL, ADD COLUMN "variant" uuid NULL, ADD COLUMN "criteria" uuid NULL, ADD CONSTRAINT "awards_criteria_fkey" FOREIGN KEY ("criteria") REFERENCES "public"."award_type_criteria" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION, ADD CONSTRAINT "awards_teacher_fkey" FOREIGN KEY ("teacher") REFERENCES "public"."users" ("keycloak_id") ON UPDATE NO ACTION ON DELETE NO ACTION, ADD CONSTRAINT "awards_type_fkey" FOREIGN KEY ("type") REFERENCES "public"."award_types" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION, ADD CONSTRAINT "awards_variant_fkey" FOREIGN KEY ("variant") REFERENCES "public"."award_type_variants" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Drop enum type "criteria_method_enum"
DROP TYPE "public"."criteria_method_enum";
