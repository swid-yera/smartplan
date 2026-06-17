-- feat(kpi): add custom organization entry for gratitude letters

INSERT INTO award_categories (
    id,
    award_types,
    name,
    icon,
    description,
    created_at,
    updated_at
)
VALUES (
    'cced00d7-ee5f-48c9-8fd8-e885ad6bffcb',
    '{155f99cb-ff4c-4e0f-8ee1-677e4b7c4f52}',
    '{"kz": "Алғыс хаттар", "ru": "Благодарственные письма"}'::jsonb,
    'star',
    '{"kz": "Сертификаттарды, алғыс хаттарды, мақтау қағаздарын және басқа да мұғалімдерге берілетін марапаттарды қосуға арналған бөлім.", "ru": "Раздел для добавления грамот, благодарственных писем, похвальных листов и других наград преподавателя."}'::jsonb,
    '2026-05-25 11:53:07.09105+00',
    '2026-06-08 10:54:00.82562+00'
)
ON CONFLICT (id) DO UPDATE
SET
    award_types = EXCLUDED.award_types,
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    description = EXCLUDED.description,
    updated_at = NOW();

INSERT INTO award_category_fields (
    id,
    category_id,
    key,
    label,
    type,
    required,
    placeholder,
    help_text,
    options,
    validation,
    sort_order
)
VALUES (
    '4caa9792-bf04-47e8-b2a6-6af95b17abad',
    'cced00d7-ee5f-48c9-8fd8-e885ad6bffcb',
    'name',
    '{"kz": "Ұсынған ұйымның атауы", "ru": "Наименование организации вручителя"}'::jsonb,
    'select',
    true,
    NULL,
    NULL,
    '["Министерство просвещения/Оқу-ағарту министрлігі", "Управление образования города Алматы/ Алматы қаласы Білім", "Союза отраслевых ассоциаций/ Салалық қауымдастықтар одағы", "Общественное объединение «ҰСТАЗ»/ «ҰСТАЗ» қоғамдық бірлестігі.", "Колледж", "Городской методический кабинет ТиПО/ТжКББ қалалық әдістемелік кабинеті", "АКИМАТ города Алматы/Алматы қаласының Әкімдігі", "АКИМАТ Ауэзовского района/Әуезов ауданының Әкімдігі", "Партия AMANAT/ AMANAT партиясы", "НПП «ATAMEKEN»/ ҰКП «ATAMEKEN»", "Другое..."]'::jsonb,
    '{}'::jsonb,
    1
)
ON CONFLICT (category_id, key) DO UPDATE
SET
    label = EXCLUDED.label,
    type = EXCLUDED.type,
    required = EXCLUDED.required,
    placeholder = EXCLUDED.placeholder,
    help_text = EXCLUDED.help_text,
    options = EXCLUDED.options,
    validation = EXCLUDED.validation,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

INSERT INTO award_category_fields (
    id,
    category_id,
    key,
    label,
    type,
    required,
    placeholder,
    help_text,
    options,
    validation,
    sort_order
)
VALUES (
    'f2a3f2f2-1f5c-4c78-9b47-7d6d0e2d4db5',
    'cced00d7-ee5f-48c9-8fd8-e885ad6bffcb',
    'description',
    '{"kz": "Қосымша ақпарат", "ru": "Дополнительная информация"}'::jsonb,
    'text',
    false,
    '{"kz": "ТОО \"All Service\"", "ru": "ТОО \"All Service\""}'::jsonb,
    '{"kz": "Егер сіз Ұйым атауы: «Другое...» таңдасаңыз, осы өрісті толтырыңыз.", "ru": "Если выбрали Наименование организации: \"Другое...\", заполните это поле"}'::jsonb,
    '[]'::jsonb,
    '{}'::jsonb,
    2
)
ON CONFLICT (category_id, key) DO UPDATE
SET
    label = EXCLUDED.label,
    type = EXCLUDED.type,
    required = EXCLUDED.required,
    placeholder = EXCLUDED.placeholder,
    help_text = EXCLUDED.help_text,
    options = EXCLUDED.options,
    validation = EXCLUDED.validation,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

INSERT INTO award_category_fields (
    id,
    category_id,
    key,
    label,
    type,
    required,
    placeholder,
    help_text,
    options,
    validation,
    sort_order
)
VALUES (
    'c03847af-f8b2-4704-b84b-29505d0fe859',
    'cced00d7-ee5f-48c9-8fd8-e885ad6bffcb',
    'date',
    '{"kz": "Жеткізу күні", "ru": "Дата вручения"}'::jsonb,
    'date',
    false,
    NULL,
    NULL,
    '[]'::jsonb,
    '{}'::jsonb,
    3
)
ON CONFLICT (category_id, key) DO UPDATE
SET
    label = EXCLUDED.label,
    type = EXCLUDED.type,
    required = EXCLUDED.required,
    placeholder = EXCLUDED.placeholder,
    help_text = EXCLUDED.help_text,
    options = EXCLUDED.options,
    validation = EXCLUDED.validation,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

INSERT INTO award_category_fields (
    id,
    category_id,
    key,
    label,
    type,
    required,
    placeholder,
    help_text,
    options,
    validation,
    sort_order
)
VALUES (
    '8500a4e9-293c-4690-aafd-79f1b6c89ad7',
    'cced00d7-ee5f-48c9-8fd8-e885ad6bffcb',
    'file',
    '{"kz": "файл", "ru": "файл"}'::jsonb,
    'file',
    false,
    NULL,
    NULL,
    '[]'::jsonb,
    '{"maxSizeMb": 20, "mimeTypes": ["application/pdf", "image/png", "image/jpeg", "image/jpeg", "image/webp"], "extensions": ["pdf", "png", "jpg", "jpeg", "webp"]}'::jsonb,
    4
)
ON CONFLICT (category_id, key) DO UPDATE
SET
    label = EXCLUDED.label,
    type = EXCLUDED.type,
    required = EXCLUDED.required,
    placeholder = EXCLUDED.placeholder,
    help_text = EXCLUDED.help_text,
    options = EXCLUDED.options,
    validation = EXCLUDED.validation,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();
