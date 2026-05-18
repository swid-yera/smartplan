-- Modify "award_category_fields" table
ALTER TABLE "public"."award_category_fields" DROP CONSTRAINT "fk_award_category_field_category", ADD CONSTRAINT "award_category_fields_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."award_categories" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;
