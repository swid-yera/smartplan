# endpoint

endpoint

## auth

authentication and authorization endpoints

### GET `/login`

redirect to keycloak to login the account, then redirect to `/callback?`, keycloak will send tokens data to the query parameters

### GET `/callback?`

endpoint for keycloak to get tokens data from query parameters. then will set to frontend cookie session id which names `sid`. at the end redirect to the frontend

### GET `/logout`

delete the cookie, then send request to logout from keycloak to delete existing active tokens

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**response status 200**

```json
{
	"result": "successfully logged out"
}
```

**response status 300**

```json
{
	"error": "invalid token"
}
```

## users

get all, get by id, update endpoints

### GET `users/me`

return data about you, define user via sid token

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**response status 200**

```json
{
	"keycloak_id": "ads3-23fd-aeff-123s",
	"email": "example@example.com",
	"username": "theUserName2",
	"first_name": "Chelsea",
	"last_name": "Nicolas",
	"phone": "+77001234567", // string | null
	// roles Teachers, Methodists, Admins
	"roles": ["Teachers", "Methodists", "Admins"]
}
```

**response status 300**

```json
{
	"error": "invalid token"
}
```

### GET `/users`

get all users

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**query parameters**

| key    | value     | default value | description                                 |
| ------ | --------- | ------------- | ------------------------------------------- |
| page   | int       | 1             |                                             |
| limit  | int       | 10            |                                             |
| search | string    | ""            | firstName, lastName, email, username, phone |
| roles  | rolesEnum | []            |                                             |

**enums**

| name      | values                         |
| --------- | ------------------------------ |
| rolesEnum | [Teachers, Methodists, Admins] |

**response status 200**

```json
{
	"data": [
		{
			"keycloak_id": "ads3-23fd-aeff-123s",
			"email": "example@example.com",
			"username": "theUserName2",
			"first_name": "Julien",
			"last_name": "Johnston",
			"phone": "+77001234567", // string | null
			// roles Teachers, Methodists, Admins
			"roles": ["Methodists"]
		},
		{
			"keycloak_id": "ads3-23fd-aeff-123s",
			"email": "example@example.com",
			"username": "theUserName2",
			"first_name": "Norris",
			"last_name": "Green",
			"phone": "+77001234567", // string | null
			// roles Teachers, Methodists, Admins
			"roles": ["Teachers"]
		},
		...
	],
	"meta": {
		"total": 7,
		"page": 1,
		"limit": 10,
		"pages": 1
	}
}
```

**response status 300**

```json
{
	"error": "invalid token"
}
```

### GET `/users/:id`

get user by id in url

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**response status 200**

```json
{
	"keycloak_id": "ads3-23fd-aeff-123s",
	"email": "example@example.com",
	"username": "theUserName2",
	"first_name": "Eva",
	"last_name": "Crooks",
	"phone": "+77001234567", // string | null
	// roles Teachers, Methodists, Admins
	"roles": ["Methodists"]
}
```

**response status 300**

```json
{
	"error": "invalid keycloak_id"
}
```

### PUT `/users/:id`

update user by id

**permissions**

| field     | TEACHER | METHODIST | ADMIN |
| --------- | ------- | --------- | ----- |
| email     | self    | self      | any   |
| firstName | self    | self      | any   |
| lastName  | self    | self      | any   |
| phone     | self    | self      | any   |
| roles     | no      | no        | any   |

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"email": "example@example.com",
	"username": "theUserName2",
	"firstName": "Valerie",
	"lastName": "Parisian",
	"phone": "+77001234567",
	"roles": ["Methodists", "Admins"]
}
```

**response status 200**

```json
{
	"keycloak_id": "ads3-23fd-aeff-123s",
	"email": "example@example.com",
	"username": "theUserName2",
	"first_name": "Valerie",
	"last_name": "Parisian",
	"phone": "+77001234567",
	"roles": ["Methodists", "Admins"]
}
```

**response status 300**

```json
{
	"error": "invalid keycloak_id"
}
```

## groups

get all, get by id and update group information
without delete and create

### GET `/groups`

get all groups from keycloak

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**query parameters**

| key           | value  | default value |
| ------------- | ------ | ------------- |
| page          | int    | 1             |
| limit         | int    | 10            |
| search        | string | groupName     |
| specialty     | string | ""            |
| qualification | string | ""            |

```json
{
	"data": [
		{
			"keycloak_id": "ads3-23fd-aeff-123s",
			"name": "WEB25-1B",
			"qualification": "4S06130105 \"Техник информационных систем\"",
			"specialty": "06130100 \"Программное обеспечение\""
		},
		...
	],
	"meta": {
		"total": 7,
		"page": 1,
		"limit": 10,
		"pages": 1
	}
}
```

### GET `/groups/:id`

get group information by id in url

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**response status 200**

```json
{
	"keycloak_id": "ads3-23fd-aeff-123s",
	"name": "WEB25-1B",
	"qualification": "4S06130105 "Техник информационных систем"",
	"specialty": "06130100 "Программное обеспечение""
}
```

**response status 300**

```json
{
	"error": "invalid keycloak_id"
}
```

### PUT `/groups/:id`

update group by id, only admin can update

**permissions**

| field         | TEACHER | METHODIST | ADMIN |
| ------------- | ------- | --------- | ----- |
| name          | no      | no        | no    |
| qualification | no      | yes       | yes   |
| specialty     | no      | yes       | yes   |

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"qualification": "4S06130105 "Техник информационных систем"",
	"specialty": "06130100 "Программное обеспечение""
}
```

**response status 200**

```json
{
	"keycloak_id": "ads3-23fd-aeff-123s",
	"name": "WEB25-1B",
	"qualification": "4S06130105 \"Техник информационных систем\"",
	"specialty": "06130100 \"Программное обеспечение\""
}
```

**response status 300**

```json
{
	"error": "invalid keycloak_id"
}
```

## RUPs

get all, get by id, create, update and delete endpoints for rup

### big data

here collected RUP big data, in endpoints will be anchor to here

#### contacts

contacts is massive of users

```json
[
	{
		"keycloak_id": "ads3a-23fda-aeffa-123sa",
		"email": "money_optical@gmail.com",
		"username": "money_optical",
		"first_name": "Bonnie",
		"last_name": "Price",
		"phone": "+77001234567",
		"roles": ["Teachers"]
	},
	...
],
```

####

####

### GET `/rups`

get rups, filter feature in query parameters

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**query parameters**

| key           | value           | default value | description           |
| ------------- | --------------- | ------------- | --------------------- |
| page          | int             | 1             |                       |
| limit         | int             | 10            |                       |
| dateFrom      | string          | ""            |                       |
| dateTo        | string          | ""            |                       |
| search        | string          | ""            | code, name, groupName |
| status        | statusEnum[]    | []            | enum                  |
| type          | typeEnum[]      | []            | enum                  |
| studyForm     | studyFormEnum[] | []            | enum                  |
| studyYear     | string[]        | []            | example "2025-2026"   |
| course        | int[]           | []            | from 1 to 4           |
| specialty     | string[]        | []            | group specialty       |
| qualification | string[]        | []            | group qualification   |
| teacher       | string[]        | string[]      | teacher ids massive   |
| methodist     | string[]        | string[]      | methodist ids massive |

**enums**

| name          | values                                 |
| ------------- | -------------------------------------- |
| statusEnum    | [DRAFT, IN_REVIEW, APPROVED, REJECTED] |
| typeEnum      | [PRACTICE, THEORY]                     |
| studyFormEnum | [CORRESPONDENCE, FULL_TIME]            |

**response status 200**

```json
{
	"data": [
		{
			"id": "asd23f-fr5sdv-grv32c-c3rca",
			"status": "DRAFT",
			"reason": "",
			"name": "Ознакомление с SQL",
			"code": "ПМ6",
			"type": "PRACTICE",
			"studyYear": "2025",
			"course": 2,
			"studyForm": "CORRESPONDENCE",
			"totalHours": 72,

			"contacts": [
				{
					"keycloak_id": "ads3a-23fda-aeffa-123sa",
					"email": "money_optical@gmail.com",
					"username": "money_optical",
					"first_name": "Bonnie",
					"last_name": "Price",
					"phone": "+77001234567",
					"roles": ["Teachers"]
				},
				...
			],
			"groups": [
				{
					"keycloak_id": "da244-c0014-5f629-46f15",
					"name": "WEB25",
					"specialty": "06130100 \"Программное обеспечение\"",
					"qualification": "3W06130102 \"Web-дизайнер\""
				},
				...
			],
			"methodist": {
				"keycloak_id": "ads3a-23fda-aeffa-123sa",
				"email": "Kaitlin.Weimann25@yahoo.com",
				"username": "Hobart.Koch",
				"first_name": "Laverne",
				"last_name": "Hayes",
				"phone": "+77001234567",
				"roles": ["Methodists"]
			},
			"teacher": {
				"keycloak_id": "ads3a-23fda-aeffa-123sa",
				"email": "Kaitlin.Weimann25@yahoo.com",
				"username": "Hobart.Koch",
				"first_name": "Laverne",
				"last_name": "Hayes",
				"phone": "+77001234567",
				"roles": ["Teacher"]
			},

			"explorationNote": {
				"id": "asd23f-fr5sdv-grv32c-c3rca",
				"basis": "Краткое описание дисциплины,...",
				"goals": "Формирование у студентов знаний о...",
				"competencies": "Владеть методами и средствами...",

				"prerequisites": "ПМ5 ...",
				"postrequisites": "ПМ7 ...",

				"internetResources": [
					{
						"id": "asd23f-fr5sdv-grv32c-c3rca",
						"value": "Книга о SQL",
						"link": "https://habr.com/asdffd"
					}
				],
				"technicalResources": [
					{
						"id": "asd23f-fr5sdv-grv32c-c3rca",
						"value": "Open Source инструменты",
						"link": ""
					},
					...
				],
			},

			"disciplines": [
				{
					"id": "asd23f-fr5sdv-grv32c-c3rca",
					"name": "Проводить мониторинг сетевой...",
					"code": "РО6.1",
					"totalHours": 72,

					"semesters": [
						{
							"id": "asd23f-fr5sdv-grv32c-c3rca",
							"semester": 1,
							"totalHours": 0
						},
						...
						{
							"id": "asd23f-fr5sdv-grv32c-c3rca",
							"semester": 8,
							"totalHours": 72,
						}
					],
					"topics": [
						{
							"id": "asd23f-fr5sdv-grv32c-c3rca",
							"name": "Использует понятия...",
							"type": "COMBINED",

							"totalHours": 2,
							"theoryHours": 2,
							"practiceHours": 0,
							"individualHours": 0,
							"srspHours": 0,
							"srsHours": 0
						},
						...
					]
					...
				},

				"created_at": "1766097497072",
				"updated_at": "1766097501201"
			]
		},
		...
	],
	"meta": {
		"total": 7,
		"page": 1,
		"limit": 10,
		"pages": 1
	}
}
```

### GET `/rups/:id`

get rup by id

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**response status 200**

```json
{
	"id": "asd23f-fr5sdv-grv32c-c3rca",
	"status": "DRAFT",
	"reason": "",
	"name": "Ознакомление с SQL",
	"code": "ПМ6",
	"type": "PRACTICE",
	"studyYear": "2025",
	"course": 2,
	"studyForm": "CORRESPONDENCE",
	"totalHours": 72,

	"contacts": [
		{
			"keycloak_id": "ads3a-23fda-aeffa-123sa",
			"email": "money_optical@gmail.com",
			"username": "money_optical",
			"first_name": "Bonnie",
			"last_name": "Price",
			"phone": "+77001234567",
			"roles": ["Teachers"]
		},
		...
	],
	"groups": [
		{
			"keycloak_id": "da244-c0014-5f629-46f15",
			"name": "WEB25",
			"specialty": "06130100 \"Программное обеспечение\"",
			"qualification": "3W06130102 \"Web-дизайнер\""
		},
		...
	],
	"methodist": {
		"keycloak_id": "ads3a-23fda-aeffa-123sa",
		"email": "Kaitlin.Weimann25@yahoo.com",
		"username": "Hobart.Koch",
		"first_name": "Laverne",
		"last_name": "Hayes",
		"phone": "+77001234567",
		"roles": ["Methodists"]
	},
	"teacher": {
		"keycloak_id": "ads3a-23fda-aeffa-123sa",
		"email": "Kaitlin.Weimann25@yahoo.com",
		"username": "Hobart.Koch",
		"first_name": "Laverne",
		"last_name": "Hayes",
		"phone": "+77001234567",
		"roles": ["Teacher"]
	},

	"explorationNote": {
		"id": "asd23f-fr5sdv-grv32c-c3rca",
		"basis": "Краткое описание дисциплины,...",
		"goals": "Формирование у студентов знаний о...",
		"competencies": "Владеть методами и средствами...",

		"prerequisites": "ПМ5 ...",
		"postrequisites": "ПМ7 ...",

		"internetResources": [
			{
				"id": "asd23f-fr5sdv-grv32c-c3rca",
				"value": "Книга о SQL",
				"link": "https://habr.com/asdffd"
			}
		],
		"technicalResources": [
			{
				"id": "asd23f-fr5sdv-grv32c-c3rca",
				"value": "Open Source инструменты",
				"link": ""
			},
			...
		],
	},

	"disciplines": [
		{
			"id": "asd23f-fr5sdv-grv32c-c3rca",
			"name": "Проводить мониторинг сетевой...",
			"code": "РО6.1",
			"totalHours": 72,

			"semesters": [
				{
					"id": "asd23f-fr5sdv-grv32c-c3rca",
					"semester": 1,
					"totalHours": 0
				},
				...
				{
					"id": "asd23f-fr5sdv-grv32c-c3rca",
					"semester": 8,
					"totalHours": 72,
				}
			],
			"topics": [
				{
					"id": "asd23f-fr5sdv-grv32c-c3rca",
					"name": "Использует понятия...",
					"type": "COMBINED",

					"totalHours": 2,
					"theoryHours": 2,
					"practiceHours": 0,
					"individualHours": 0,
					"srspHours": 0,
					"srsHours": 0
				},
				...
			]
			...
		},

		"created_at": "1766097497072",
		"updated_at": "1766097501201"
	]
}
```

**response status 300**

```json
{
	"error": "invalid uuid"
}
```

### POST `/rups`

create rup, for creation needed a lot of data

**permissions**

| field      | TEACHER | METHODIST | ADMIN |
| ---------- | ------- | --------- | ----- |
| permission | yes     | no        | yes   |

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"name": "Ознакомление с SQL",
	"code": "ПМ6",
	"type": "PRACTICE",
	"studyYear": "2025",
	"course": 2,
	"studyForm": "CORRESPONDENCE",

	"contacts": [
		{
			"keycloak_id": "ads3a-23fda-aeffa-123sa",
		},
		...
	],
	"groups": [
		{
			"keycloak_id": "da244-c0014-5f629-46f15",
		},
		...
	],
	"methodist": {
		"keycloak_id": "ads3a-23fda-aeffa-123sa",
	},
	"teacher": {
		"keycloak_id": "ads3a-23fda-aeffa-123sa",
	},

	"explorationNote": {
		"basis": "Краткое описание дисциплины,...",
		"goals": "Формирование у студентов знаний о...",
		"competencies": "Владеть методами и средствами...",

		"prerequisites": "ПМ5...",
		"postrequisites": "ПМ7...",

		"internetResources": [
			{
				"value": "Книга о SQL",
				"link": "https://habr.com/asdffd"
			}
		],
		"technicalResources": [
			{
				"value": "Open Source инструменты",
				"link": ""
			},
			...
		],
	},

	"disciplines": [
		{
			"name": "Проводить мониторинг сетевой...",
			"code": "РО6.1",

			"semesters": [
				{
					"semester": 1,
					"totalHours": 0
				},
				...
				{
					"semester": 8,
					"totalHours": 72
				}
			],
			"topics": [
				{
					"name": "Использует понятия...",
					"type": "COMBINED",

					"theoryHours": 2,
					"practiceHours": 0,
					"individualHours": 0,
					"srspHours": 0,
					"srsHours": 0
				},
				...
			]
		},
		{
			"name": "Администрировать процесс управления...",
			"code": "РО6.2",
			"totalCredits": 1,
			"semesters": [
				{
					"semester": 1,
					"totalHours": 0
				},
				...
				{
					"semester": 8,
					"totalHours": 48
				}
			],
			"topics": [
				{
					"name": "Использует понятия...",
					"type": "COMBINED",

					"theoryHours": 2,
					"practiceHours": 0,
					"individualHours": 0,
					"srspHours": 0,
					"srsHours": 0
				},
				...
			]
		}
	]
}
```

**response status 200**

```json
{
	"id": "asd23f-fr5sdv-grv32c-c3rca",
	"status": "DRAFT",
	"reason": "",
	"name": "Ознакомление с SQL",
	"code": "ПМ6",
	"type": "PRACTICE",
	"studyYear": "2025",
	"course": 2,
	"studyForm": "CORRESPONDENCE",
	"totalHours": 72,

	"contacts": [
		{
			"keycloak_id": "ads3a-23fda-aeffa-123sa",
			"email": "money_optical@gmail.com",
			"username": "money_optical",
			"first_name": "Bonnie",
			"last_name": "Price",
			"phone": "+77001234567",
			"roles": ["Teachers"]
		},
		...
	],
	"groups": [
		{
			"keycloak_id": "da244-c0014-5f629-46f15",
			"name": "WEB25",
			"specialty": "06130100 \"Программное обеспечение\"",
			"qualification": "3W06130102 \"Web-дизайнер\""
		},
		...
	],
	"methodist": {
		"keycloak_id": "ads3a-23fda-aeffa-123sa",
		"email": "Kaitlin.Weimann25@yahoo.com",
		"username": "Hobart.Koch",
		"first_name": "Laverne",
		"last_name": "Hayes",
		"phone": "+77001234567",
		"roles": ["Methodists"]
	},
	"teacher": {
		"keycloak_id": "ads3a-23fda-aeffa-123sa",
		"email": "Kaitlin.Weimann25@yahoo.com",
		"username": "Hobart.Koch",
		"first_name": "Laverne",
		"last_name": "Hayes",
		"phone": "+77001234567",
		"roles": ["Teacher"]
	},

	"explorationNote": {
		"id": "asd23f-fr5sdv-grv32c-c3rca",
		"basis": "Краткое описание дисциплины,...",
		"goals": "Формирование у студентов знаний о...",
		"competencies": "Владеть методами и средствами...",

		"prerequisites": "ПМ5 ...",
		"postrequisites": "ПМ7 ...",

		"internetResources": [
			{
				"id": "asd23f-fr5sdv-grv32c-c3rca",
				"value": "Книга о SQL",
				"link": "https://habr.com/asdffd"
			}
		],
		"technicalResources": [
			{
				"id": "asd23f-fr5sdv-grv32c-c3rca",
				"value": "Open Source инструменты",
				"link": ""
			},
			...
		],
	},

	"disciplines": [
		{
			"id": "asd23f-fr5sdv-grv32c-c3rca",
			"name": "Проводить мониторинг сетевой...",
			"code": "РО6.1",
			"totalHours": 72,

			"semesters": [
				{
					"id": "asd23f-fr5sdv-grv32c-c3rca",
					"semester": 1,
					"totalHours": 0
				},
				...
				{
					"id": "asd23f-fr5sdv-grv32c-c3rca",
					"semester": 8,
					"totalHours": 72,
				}
			],
			"topics": [
				{
					"id": "asd23f-fr5sdv-grv32c-c3rca",
					"name": "Использует понятия...",
					"type": "COMBINED",

					"totalHours": 2,
					"theoryHours": 2,
					"practiceHours": 0,
					"individualHours": 0,
					"srspHours": 0,
					"srsHours": 0
				},
				...
			]
			...
		},

		"created_at": "1766097497072",
		"updated_at": "1766097501201"
	]
}
```

### PUT `/rups/:id`

update rup by id, only admin can update

**permissions**

| field      | TEACHER                                      | METHODIST | ADMIN |
| ---------- | -------------------------------------------- | --------- | ----- |
| permission | only self and if status equal REJECTED/DRAFT | never     | any   |

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"data": {
		"title": "name",
		"status": "APPROVED",
		"reason": "тута записка от методиста, если статус REJECTED",
		"type": "PRACTICE",
		"course": "2",
		"studyForm": "CORRESPONDENCE",
		"studyYear": "2025-2026",
		"totalHours": "1488",

		"contacts": [
			{
			"email": "example@example.com",
			"username": "theUserName2",
			"first_name": "bogdan", // change name to bogdan
			"last_name": "lupink",
			"phone": "+77001234567", // string | null
			// roles Teachers, Methodists, Admins
			"roles": ["Teachers", "Methodists", "Admins"]
			},
			...
		],
		"groups": [
			{
			"keycloak_id": 2134,
			"name": "WEB25",
			"specialty": "06130100 \"Программное обеспечение\"",
			"qualification": "3W06130102 \"Web-дизайнер\""
			},
			...
		],
		"methodist":{
			"email": "example@example.com",
			"username": "theUserName2",
			"first_name": "bogdan", // change name to bogdan
			"last_name": "lupink",
			"phone": "+77001234567", // string | null
			// roles Teachers, Methodists, Admins
			"roles": ["Teachers", "Methodists", "Admins"]
		},

		"teacher": {
			"email": "example@example.com",
			"username": "theUserName2",
			"first_name": "bogdan", // change name to bogdan
			"last_name": "lupink",
			"phone": "+77001234567", // string | null
			// roles Teachers, Methodists, Admins
			"roles": ["Teachers", "Methodists", "Admins"]
		},

		"explorationNote": {
			"id": "20251212",
			"basis": "lorem",
			"goals": "lorem",
			"summary": "",
			"competencies": "",

			"prerequisites": "",
			"prerequisites": "",

			"internetResources": [
				{
					"id": "098c9b08-8bbb-404d-bbf0-4b8fc5d57801",
					"name": "kak svarit mef",
					"link": "loxotron.com"
				},
				...
			],
			"technicalResources": [
				{
					"id": "098c9b08-8bbb-404d-bbf0-4b8fc5d57801",
					"name": "kak svarit mef",
					"link": "loxotron.com"
				},
				...
			],
		},
		"disciplines": [
			{
				"code": "РО5.6",
				"name": "обучение по Postgresql",
				"totalCredits": 1,
				"semesters": [
					{
						"semester": 1,
						"credits": 0
					},
					...
					{
						"semester": 8,
						"credits": 0
					}
				],
				"topics": [
					{
						"name": "начало по работе sql",
						"type": "COMBINED", // SNZ, PRACTICAL, COMBINED
						"totalHours": 16,
						"theoryHours": 8,
						"practiceHours": 8,
						"individualHours": 0,
						"SRSPHours": 0,
						"SRSHours": 0
					},
					...
				]
			},
			{
				"code": "РО5.7",
				"name": "Практика Postgresql",
				"totalCredits": 1,
				"semesters": [
					{
						"semester": 1,
						"credits": 0
					},
					...
					{
						"semester": 8,
						"credits": 0
					}
				],
				"topics": [
					{
						"name": "Что такое Left и Right join",
						"type": "SNZ", // SNZ, PRACTICAL, COMBINED
						"totalHours": 24,
						"theoryHours": 12,
						"practiceHours": 12,
						"individualHours": 0,
						"SRSPHours": 0,
						"SRSHours": 0
					},
					...
				]
			}
		],

		"createdAt": "20251212",
		"updatedAt": "20251218"
	}
}
```

**response status 200**

```json
{
	"data": {
		"title": "name",
		"status": "APPROVED",
		"reason": "тута записка от методиста, если статус REJECTED",
		"type": "PRACTICE",
		"course": "2",
		"studyForm": "CORRESPONDENCE",
		"studyYear": "2025-2026",
		"totalHours": "1488",

		"contacts": [
			{
			"email": "example@example.com",
			"username": "theUserName2",
			"first_name": "bogdan", // change name to bogdan
			"last_name": "lupink",
			"phone": "+77001234567", // string | null
			// roles Teachers, Methodists, Admins
			"roles": ["Teachers", "Methodists", "Admins"]
			},
			...
		],
		"groups": [
			{
			"keycloak_id": 2134,
			"name": "WEB25",
			"specialty": "06130100 \"Программное обеспечение\"",
			"qualification": "3W06130102 \"Web-дизайнер\""
			},
			...
		],
		"methodist":{
			"email": "example@example.com",
			"username": "theUserName2",
			"first_name": "bogdan", // change name to bogdan
			"last_name": "lupink",
			"phone": "+77001234567", // string | null
			// roles Teachers, Methodists, Admins
			"roles": ["Teachers", "Methodists", "Admins"]
		},

		"teacher": {
			"email": "example@example.com",
			"username": "theUserName2",
			"first_name": "bogdan", // change name to bogdan
			"last_name": "lupink",
			"phone": "+77001234567", // string | null
			// roles Teachers, Methodists, Admins
			"roles": ["Teachers", "Methodists", "Admins"]
		},

		"explorationNote": {
			"id": "20251212",
			"basis": "lorem",
			"goals": "lorem",
			"summary": "",
			"competencies": "",

			"prerequisites": "",
			"prerequisites": "",

			"internetResources": [
				{
					"id": "098c9b08-8bbb-404d-bbf0-4b8fc5d57801",
					"name": "kak svarit mef",
					"link": "loxotron.com"
				},
				...
			],
			"technicalResources": [
				{
					"id": "098c9b08-8bbb-404d-bbf0-4b8fc5d57801",
					"name": "kak svarit mef",
					"link": "loxotron.com"
				},
				...
			],
		},
		"disciplines": [
			{
				"code": "РО5.6",
				"name": "обучение по Postgresql",
				"totalCredits": 1,
				"semesters": [
					{
						"semester": 1,
						"credits": 0
					},
					...
					{
						"semester": 8,
						"credits": 0
					}
				],
				"topics": [
					{
						"name": "начало по работе sql",
						"type": "COMBINED", // SNZ, PRACTICAL, COMBINED
						"totalHours": 16,
						"theoryHours": 8,
						"practiceHours": 8,
						"individualHours": 0,
						"SRSPHours": 0,
						"SRSHours": 0
					},
					...
				]
			},
			{
				"code": "РО5.7",
				"name": "Практика Postgresql",
				"totalCredits": 1,
				"semesters": [
					{
						"semester": 1,
						"credits": 0
					},
					...
					{
						"semester": 8,
						"credits": 0
					}
				],
				"topics": [
					{
						"name": "Что такое Left и Right join",
						"type": "SNZ", // SNZ, PRACTICAL, COMBINED
						"totalHours": 24,
						"theoryHours": 12,
						"practiceHours": 12,
						"individualHours": 0,
						"SRSPHours": 0,
						"SRSHours": 0
					},
					...
				]
			}
		],

		"createdAt": "20251212",
		"updatedAt": "20251218"
	}
}
```

**response status 300**

```json
{
	"error": "invalid uuid"
}
```

### PUT `/rups/:id/update-status`

update rup status

**permissions**
| role | conditions |
| --------- | --------------------------------- |
| TEACHER | from REJECTED, DRAFT to IN_REVIEW |
| ADMIN | always |
| METHODIST | all except DRAFT |

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"status": "APPROVED" // enum: [DRAFT, IN_REVIEW, APPROVED, REJECTED]
}
```

**response status 300**

```json
{
	"error": "invalid uuid"
}
```

**response status 200**

```json
{
	"error": "rup status updated succesfully"
}
```

### DELETE `/rups/:id`

delete rup by id

**permissions**
| role | conditions |
| --------- | --------------------------- |
| TEACHER | if his rup and status draft |
| ADMIN | always |
| METHODIST | never |

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**response status 200**

```
{
	"error": "rup deleted succesfully"
}
```

**response status 300**

```
{
	"error": "invalid uuid"
}
```

## Exploration Notes

post, get, update, delete endpoints

### POST `/note`

create rup exploration note

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"data": {
		"basis": "lorem",
		"goals": "lorem",
		"summary": "",
		"competencies": "",

		"prerequisites": "",
		"postrequisites": "",

		"internetResources": [
			{
				"name": "kak svarit mef",
				"link": "loxotron.com"
			},
			...],
		"technicalResources": [
			{
				"name": "kak svarit mef",
				"link": "loxotron.com"
			},
			...
		]
	}
}
```

**response status 200**

````json
{
	"data": {
		"basis": "lorem",
		"goals": "lorem",
		"summary": "",
		"competencies": "",

		"prerequisites": "",
		"postrequisites": "",

		"internetResources": [
			{
				"id": "098c9b08-8bbb-404d-bbf0-4b8fc5d57801",
				"name": "kak svarit mef",
				"link": "loxotron.com"
			},
			...
			],
		"technicalResources": [
			{
				"id": "098c9b08-8bbb-404d-bbf0-4b8fc5d57801",
				"name": "kak svarit mef",
				"link": "loxotron.com"
			},
			...
			]
	}
}

**response status 300**
```json
{
	"error": "invalid data"
}
````

### GET `/note/:id`

get rup exploration note

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**response status 200**

```json
{
	"basis": "lorem",
	"goals": "lorem",
	"summary": "",
	"competencies": "",

	"prerequisites": "",
	"postrequisites": "",

	"internetResources": [
		{
			"id": "098c9b08-8bbb-404d-bbf0-4b8fc5d57801",
			"name": "kak svarit mef",
			"link": "loxotron.com"
		},
		...
		],
	"technicalResources": [
		{
			"id": "098c9b08-8bbb-404d-bbf0-4b8fc5d57801",
			"name": "kak svarit mef",
			"link": "loxotron.com"
		},
		...
		]
}
```

**response status 300**

```json
{
	"error": "invalid uuid"
}
```

### PUT `/note/:id`

update rup exploration note

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"data": {
		"basis": "lorem",
		"goals": "lorem",
		"summary": "",
		"competencies": "",

		"prerequisites": "",
		"postrequisites": "",

		"internetResources": [
		{
			"id": "098c9b08-8bbb-404d-bbf0-4b8fc5d57801",
			"name": "kak svarit mef",
			"link": "loxotron.com"
		},
		...
		],
	"technicalResources": [
		{
			"id": "098c9b08-8bbb-404d-bbf0-4b8fc5d57801",
			"name": "kak svarit mef",
			"link": "loxotron.com"
		},
		...
		]
	}
}
```

**response status 200**

```json
{
	"basis": "lorem",
	"goals": "lorem",
	"summary": "",
	"competencies": "",

	"prerequisites": "",
	"postrequisites": "",

	"internetResources": [
		{
			"id": "098c9b08-8bbb-404d-bbf0-4b8fc5d57801",
			"name": "kak svarit mef",
			"link": "loxotron.com"
		},
		...
		],
	"technicalResources": [
		{
			"id": "098c9b08-8bbb-404d-bbf0-4b8fc5d57801",
			"name": "kak svarit mef",
			"link": "loxotron.com"
		},
		...
		]
}
```

**response status 300**

```json
{
	"error": "invalid uuid"
}
```

### DELETE `/note/:id`

delete rup exploration note

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**response status 200**

```json
{
	"error": "note deleted succesfully"
}
```

**response status 300**

```json
{
	"error": "invalid uuid"
}
```

## Resourses

post, get, update, delete endpoints

### POST `/resources/create`

create resource

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"data": {
		"type": "INTERNET", // enum: [INTERNET, TECHNICAL]
		"name": "kak svarit mef",
		"link": "loxotron.com"
	}
}
```

**response status 200**

```json
{
	"id": "098c9b08-8bbb-404d-bbf0-4b8fc5d57801",
	"type": "INTERNET",
	"name": "kak svarit mef",
	"link": "loxotron.com"
}
```

**response status 300**

```json
{
	"error": "invalid data"
}
```

### GET `/resources/:id`

get resources

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**response status 200**

```json
{
	"id": "098c9b08-8bbb-404d-bbf0-4b8fc5d57801",
	"type": "INTERNET",
	"name": "kak svarit mef",
	"link": "loxotron.com"
}
```

**response status 300**

```json
{
	"error": "invalid uuid"
}
```

### PUT `/resources/:id`

update resource

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"data": {
		"type": "INTERNET",
		"name": "kak svarit mef",
		"link": "loxotron.com"
	}
}
```

**responce status 200**

```json
{
	"data": {
		"type": "INTERNET",
		"name": "kak svarit mef",
		"link": "loxotron.com"
	}
}
```

**response status 300**

```json
{
	"error": "invalid uuid"
}
```

### DELETE `/resources/:id`

delete resource

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**responce status 200**

```json
{
	"error": "resource deleted succesfully"
}
```

**response status 300**

```json
{
	"error": "invalid uuid"
}
```

## Disciplines

### POST `/disciplines`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"name": "PostgreSQL Basics",
	"code": "DB-101",
	"total_hours": 72
}
```

**response 200**

```json
{
	"id": "uuid",
	"name": "PostgreSQL Basics",
	"code": "DB-101",
	"total_hours": 72
}
```

**response 300**

```json
{ "error": "invalid data" }
```

### GET `/disciplines`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**response 200**

```json
[
	{
		"id": "uuid",
		"name": "PostgreSQL Basics",
		"code": "DB-101",
		"total_hours": 72
	}
]
```

**response 300**

```json
{ "error": "invalid token" }
```

### GET `/disciplines/:id`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**response 200**

```json
{
	"id": "uuid",
	"name": "PostgreSQL Basics",
	"code": "DB-101",
	"total_hours": 72
}
```

**response 300**

```json
{ "error": "invalid uuid" }
```

### PUT `/disciplines/:id`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"name": "PostgreSQL Advanced",
	"code": "DB-201",
	"total_hours": 90
}
```

**response 200**

```json
{
	"id": "uuid",
	"name": "PostgreSQL Advanced",
	"code": "DB-201",
	"total_hours": 90
}
```

**response 300**

```json
{ "error": "invalid uuid" }
```

### DELETE `/disciplines/:id`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**response 200**

```json
{ "result": "discipline deleted" }
```

**response 300**

```json
{ "error": "invalid uuid" }
```

## Discipline Semesters

### POST `/discipline-semesters`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"discipline_id": "uuid",
	"semester": 1,
	"total_hours": 36
}
```

**response 200**

```json
{
	"id": "uuid",
	"discipline_id": "uuid",
	"semester": 1,
	"total_hours": 36
}
```

**response 300**

```json
{ "error": "invalid data" }
```

### GET `/discipline-semesters/:id`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**response 200**

```json
{
	"id": "uuid",
	"discipline_id": "uuid",
	"semester": 1,
	"total_hours": 36
}
```

**response 300**

```json
{ "error": "invalid uuid" }
```

### PUT `/discipline-semesters/:id`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"semester": 2,
	"total_hours": 40
}
```

**response 200**

```json
{
	"id": "uuid",
	"semester": 2,
	"total_hours": 40
}
```

**response 300**

```json
{ "error": "invalid uuid" }
```

### DELETE `/discipline-semesters/:id`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**response 200**

```json
{ "result": "semester deleted" }
```

**response 300**

```json
{ "error": "invalid uuid" }
```

## Discipline Topics

### POST `/discipline-topics`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"semester_id": "uuid",
	"name": "SQL joins",
	"type": "combined",
	"total_hours": 16,
	"theory_hours": 8,
	"practice_hours": 8,
	"individual_hours": 0,
	"srsp_hours": 0,
	"srs_hours": 0
}
```

**response 200**

```json
{
	"id": "uuid",
	"semester_id": "uuid",
	"name": "SQL joins",
	"type": "combined",
	"total_hours": 16
}
```

**response 300**

```json
{ "error": "invalid data" }
```

### PUT `/discipline-topics/:id`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"name": "Advanced SQL joins",
	"practice_hours": 10
}
```

**response 200**

```json
{
	"id": "uuid",
	"name": "Advanced SQL joins",
	"practice_hours": 10
}
```

**response 300**

```json
{ "error": "invalid uuid" }
```

### DELETE `/discipline-topics/:id`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**response 200**

```json
{ "result": "topic deleted" }
```

**response 300**

```json
{ "error": "invalid uuid" }
```

## Award Types

### POST `/award-types`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"name": "Exam",
	"description": "Final exam award"
}
```

**response 200**

```json
{
	"id": "uuid",
	"name": "Exam",
	"description": "Final exam award"
}
```

**response 300**

```json
{ "error": "invalid data" }
```

### GET `/award-types/:id`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**response 200**

```json
{
	"id": "uuid",
	"name": "Exam",
	"description": "Final exam award"
}
```

**response 300**

```json
{ "error": "invalid uuid" }
```

### PUT `/award-types/:id`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"name": "Final Exam"
}
```

**response 200**

```json
{
	"id": "uuid",
	"name": "Final Exam"
}
```

**response 300**

```json
{ "error": "invalid uuid" }
```

### DELETE `/award-types/:id`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**response 200**

```json
{ "result": "award type deleted" }
```

**response 300**

```json
{ "error": "invalid uuid" }
```

## Award Type Variants

### POST `/award-type-variants`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"award_type_id": "uuid",
	"name": "Excellent",
	"min_score": 90,
	"max_score": 100
}
```

**response 200**

```json
{
	"id": "uuid",
	"award_type_id": "uuid",
	"name": "Excellent",
	"min_score": 90,
	"max_score": 100
}
```

**response 300**

```json
{ "error": "invalid data" }
```

### PUT `/award-type-variants/:id`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"min_score": 85
}
```

**response 200**

```json
{
	"id": "uuid",
	"min_score": 85
}
```

**response 300**

```json
{ "error": "invalid uuid" }
```

### DELETE `/award-type-variants/:id`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**response 200**

```json
{ "result": "variant deleted" }
```

**response 300**

```json
{ "error": "invalid uuid" }
```

## Award Type Criteria

### POST `/award-type-criteria`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"variant_id": "uuid",
	"name": "Attendance",
	"weight": 0.3
}
```

**response 200**

```json
{
	"id": "uuid",
	"variant_id": "uuid",
	"name": "Attendance",
	"weight": 0.3
}
```

**response 300**

```json
{ "error": "invalid data" }
```

### PUT `/award-type-criteria/:id`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"weight": 0.4
}
```

**response 200**

```json
{
	"id": "uuid",
	"weight": 0.4
}
```

**response 300**

```json
{ "error": "invalid uuid" }
```

### DELETE `/award-type-criteria/:id`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**response 200**

```json
{ "result": "criteria deleted" }
```

**response 300**

```json
{ "error": "invalid uuid" }
```

## Awards

### POST `/awards`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"user_id": "uuid",
	"discipline_id": "uuid",
	"award_type_variant_id": "uuid",
	"score": 95
}
```

**response 200**

```json
{
	"id": "uuid",
	"user_id": "uuid",
	"discipline_id": "uuid",
	"award_type_variant_id": "uuid",
	"score": 95
}
```

**response 300**

```json
{ "error": "invalid data" }
```

### GET `/awards/:id`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**response 200**

```json
{
	"id": "uuid",
	"user_id": "uuid",
	"discipline_id": "uuid",
	"award_type_variant_id": "uuid",
	"score": 95
}
```

**response 300**

```json
{ "error": "invalid uuid" }
```

### DELETE `/awards/:id`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**response 200**

```json
{ "result": "award deleted" }
```

**response 300**

```json
{ "error": "invalid uuid" }
```

## Award types criteria

### POST `/award-types-criteria`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"data": {
		"name": "name",
		"points": 67,
		"method": "NORMAL", // enum:[NORMAL, MEASURING, PENALTY]
		"bonusName": "+ за каждый чих, от 1 до 100",
		"bonusPoints": 52,
		"bonusMethod": "MEASURING"
	}
}
```

**response 200**

```json
{
	"data": {
		"id": "892hfwbhw2-sdkjnksf4u",
		"name": "name",
		"points": 67,
		"method": "NORMAL", // enum:[NORMAL, MEASURING, PENALTY]
		"bonusName": "+ за каждый чих, от 1 до 100",
		"bonusPoints": 52,
		"bonusMethod": "MEASURING"
	}
}
```

**response 300**

```json
{ "error": "invalid data" }
```

### GET `/award-types-criteria/:id`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**response 200**

```json
{
	"data": {
		"name": "name",
		"points": 67,
		"method": "NORMAL", // enum:[NORMAL, MEASURING, PENALTY]
		"bonusName": "+ за каждый чих, от 1 до 100",
		"bonusPoints": 52,
		"bonusMethod": "MEASURING"
	}
}
```

**response 300**

```json
{ "error": "invalid uuid" }
```

### PUT `/award-types-criteria/:id`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"data": {
		"name": "name",
		"points": 67,
		"method": "NORMAL", // enum:[NORMAL, MEASURING, PENALTY]
		"bonusName": "+ за каждый чих, от 1 до 100",
		"bonusPoints": 52,
		"bonusMethod": "MEASURING"
	}
}
```

**response 200**

```json
{
	"data": {
		"name": "name",
		"points": 67,
		"method": "NORMAL", // enum:[NORMAL, MEASURING, PENALTY]
		"bonusName": "+ за каждый чих, от 1 до 100",
		"bonusPoints": 52,
		"bonusMethod": "MEASURING"
	}
}
```

**response 300**

```json
{ "error": "invalid uuid" }
```

### DELETE `/award-types-criteria/:id`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**response 200**

```json
{ "result": "award types criteria deleted succesfully" }
```

**response 300**

```json
{ "error": "invalid uuid" }
```

## Award type variants

### POST `/award-types-variants`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"data": {
		"name": "name",
		"description": "описание ",
		"criteria": [
			{
				"name": "name",
				"points": 67,
				"method": "NORMAL", // enum:[NORMAL, MEASURING, PENALTY]
				"bonusName": "+ за каждый чих, от 1 до 100",
				"bonusPoints": 52,
				"bonusMethod": "MEASURING"
			},
			...
		]
	}
}
```

**response 200**

```json
{
	"id": "45bhjf-f76dc-d6d7w8sd",
	"data": {
		"name": "name",
		"description": "описание ",
		"criteria": [
			{
				"name": "name",
				"points": 67,
				"method": "NORMAL", // enum:[NORMAL, MEASURING, PENALTY]
				"bonusName": "+ за каждый чих, от 1 до 100",
				"bonusPoints": 52,
				"bonusMethod": "MEASURING"
			},
			...
		]
	}
}
```

**response 300**

```json
{ "error": "invalid data" }
```

### GET `/award-types-criteria/:id`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**response 200**

```json
{
	"data": {
		"name": "name",
		"description": "описание ",
		"criteria": [
			{
				"name": "name",
				"points": 67,
				"method": "NORMAL", // enum:[NORMAL, MEASURING, PENALTY]
				"bonusName": "+ за каждый чих, от 1 до 100",
				"bonusPoints": 52,
				"bonusMethod": "MEASURING"
			},
			...
		]
	}
}
```

**response 300**

```json
{ "error": "invalid uuid" }
```

### PUT `/award-types-variants/:id`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"data": {
		"name": "name",
		"description": "описание ",
		"criteria": [
			{
				"name": "name",
				"points": 67,
				"method": "NORMAL", // enum:[NORMAL, MEASURING, PENALTY]
				"bonusName": "+ за каждый чих, от 1 до 100",
				"bonusPoints": 52,
				"bonusMethod": "MEASURING"
			},
			...
		]
	}
}
```

**response 200**

```json
{
	"data": {
		"name": "name",
		"description": "описание ",
		"criteria": [
			{
				"name": "name",
				"points": 67,
				"method": "NORMAL", // enum:[NORMAL, MEASURING, PENALTY]
				"bonusName": "+ за каждый чих, от 1 до 100",
				"bonusPoints": 52,
				"bonusMethod": "MEASURING"
			},
			...
		]
	}
}
```

**response 300**

```json
{ "error": "invalid uuid" }
```

### DELETE `/award-types-variants/:id`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**response 200**

```json
{ "result": "award type variant deleted successfully" }
```

**response 300**

```json
{ "error": "invalid uuid" }
```

## Award types

### POST `/award-types`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"data": {
		"name": "name",
		"variants": [
			{
				"name": "name",
				"points": 67,
				"method": "NORMAL", // enum:[NORMAL, MEASURING, PENALTY]
				"bonusName": "+ за каждый чих, от 1 до 100",
				"bonusPoints": 52,
				"bonusMethod": "MEASURING"
			},
			...
		]
	}
}
```

**response 200**

```json
{
	"id": "45b2jf-f76dc-d6d7w8sd",
	"data": {
		"name": "name",
		"variants": [
			{
				"name": "name",
				"points": 67,
				"method": "NORMAL", // enum:[NORMAL, MEASURING, PENALTY]
				"bonusName": "+ за каждый чих, от 1 до 100",
				"bonusPoints": 52,
				"bonusMethod": "MEASURING"
			},
			...
		]
	}
}
```

**response 300**

```json
{ "error": "invalid data" }
```

### GET `/award-types/:id`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**response 200**

```json
{
	"data": {
		"name": "name",
		"variants": [
			{
				"name": "name",
				"points": 67,
				"method": "NORMAL", // enum:[NORMAL, MEASURING, PENALTY]
				"bonusName": "+ за каждый чих, от 1 до 100",
				"bonusPoints": 52,
				"bonusMethod": "MEASURING"
			},
			...
		]
	}
}
```

**response 300**

```json
{ "error": "invalid uuid" }
```

### PUT `/award-types/:id`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"data": {
		"name": "name",
		"variants": [
			{
				"name": "name",
				"points": 67,
				"method": "NORMAL", // enum:[NORMAL, MEASURING, PENALTY]
				"bonusName": "+ за каждый чих, от 1 до 100",
				"bonusPoints": 52,
				"bonusMethod": "MEASURING"
			},
			...
		]
	}
}
```

**response 200**

```json
{
	"data": {
		"name": "name",
		"variants": [
			{
				"name": "name",
				"points": 67,
				"method": "NORMAL", // enum:[NORMAL, MEASURING, PENALTY]
				"bonusName": "+ за каждый чих, от 1 до 100",
				"bonusPoints": 52,
				"bonusMethod": "MEASURING"
			},
			...
		]
	}
}
```

**response 300**

```json
{ "error": "invalid uuid" }
```

### DELETE `/award-types/:id`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**response 200**

```json
{ "result": "award type deleted successfully" }
```

**response 300**

```json
{ "error": "invalid uuid" }
```