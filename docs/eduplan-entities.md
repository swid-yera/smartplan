# entities

## table users

```
-  keycloak_id: uuid, not null, primary key
-  session_id: uuid, primary key

-  email: text, not null
-  username: text, not null
-  first_name: text
-  last_name: text
-  phone: text

-  roles: []text, not null, default: {} // Teachers, Methodists, Admins

-  rups: []text //rups ids, references: rups table
-  total_points: int, not null, default:0
-  awards: []text //awards ids, references: awards table

-  password_changed_at: timestamptz
-  last_seen_at: timestampz

-  created_at: timestamptz, not null, default: now()
-  updated_at: timestamptz, not null, default: now()
```

## table groups

```
-  keycloak_id: uuid, not null, primary key
-  name: text, not null, primary key
-  qualification: text
-  specialty: text
```

### table rups

```
-  id: uuid, not null, primary key
-  name: text, not null
-  status: text, enum:[DRAFT, IN_REVIEW, APPROVED, REJECTED]
-  reason: text
-  course: int, not null // from 1 to 4
-  study_form: text, enum:[CORRESPONDENCE, FULL_TIME]
-  study_year: text, not null
-  type: text, enum:[PRACTICE, THEORY]
-  total_hours: int, not null, default: 0

-  contacts: text[] // users ids, references: users table
-  group_ids: text[] // groups ids, references: groups table
-  methodist: text //user id, references: users table
-  teacher: text, references: users table

-  exploration_note_id: uuid, references: rup_exploration_notes table
-  disciplines: text[] // disciplines ids, references: rup_disciplines

-  created_at: timestamptz, not null, default: now()
-  updated_at: timestamptz, not null, default: now()
```

### table rup_exploration_notes

```
-  id: uuid, not null, primary key
-  basis: text
-  goals: text
-  summary: text
-  competencies: text

-  prerequisites: text
-  postrequisites: text

-  internet_resources_id: uuid, references: rup_resources table
-  technical_resources_id: uuid, references: rup_resources table
```

### table rup_resources

```
-  id: uuid, not null, primary key
-  name: text, not null
-  link: text
```

### table rup_disciplines

```
-  id: uuid, not null, primary key
-  name: text, not null
-  code: text
-  total_hours: int, not null, default: 0

-  semesters: text[] // discipline_semesters ids, references: semesters table
-  topics: text[] // discipline_topics ids, references: topics table
```

### table discipline_semesters

```
-  id: uuid, not null, primary key
-  semester: int, not null //from 1 to 8
-  total_hours: int, not null, default: 0
```

### table discipline_topics

```
-  id: uuid, not null, primary key
-  name: text, not null

-  type: text, enum:[SNZ, PRACTICAL, COMBINED]
-  total_hours: int, not null, default: 0

-  theory_hours: int, not null, default: 0
-  practice_hours: int, not null, default: 0
-  individual_hours: int, not null, default: 0
-  srsp_hours: int, not null, default: 0
-  srs_hours: int, not null, default: 0
```

## table awards

```
-  id: uuid, not null, primary key
-  status: text, enum:[DRAFT, IN_REVIEW, APPROVED, REJECTED]
-  reason: text // if status = "REJECTED"
-  methodist: text //user id, references: users table
-  total_points: int, not null, default: 0
-  violation: text, enum:[NONE, REMARK, REBUKE, SEVERE_REPRIMAND]
-  type: text, // reference award_types table

-  text: text
-  images: text[], //url image in minio bucket, default: []
-  documents: text[], //url document in minio bucket, default: []
-  links: text[], //url resources, default: []

-  created_at: timestamptz, not null, default: now()
-  updated_at: timestamptz, not null, default: now()
```

### table award_types

```
-  id: uuid, not null, primary key
-  name: text, not null
-  variants: text[], // reference award_type_variants
```

### table award_type_variants

```
-  id: uuid, not null, primary key
-  name: text, not null
-  description: text
-  criteria: text[], references: award_type_criteria table
```

### table award_type_criteria

```
-  id: uuid, not null, primary
-  name: text, not null
-  points: int
-  method: text, enum:[NORMAL, MEASURING, PENALTY]
-  bonus_name: text
-  bonus_points: int
-  bonus_method: text, enum:[NORMAL, MEASURING, PENALTY]
```
