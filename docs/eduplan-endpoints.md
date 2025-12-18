# endpoint

endpoint for backend

## auth

authentication and authorization endpoints

### GET `/login`

redirect to keycloak to login the account, then redirect to `/callback?`, keycloak will send tokens data to the query parameters

### GET `/callback?`

endpoint for keycloak to get tokens data from query parameters. then will set to frontend cookie session id which names `sid`. at the end redirect to the frontend

### GET `/logout`

delete the cookie, then send request to logout from keycloak to delete existing active tokens

### GET `/me`

get data about me

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
	"first_name": "Dimon",
	"last_name": "Lupink",
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

## users

get, update, delete endpoints

### GET `/users`

get all users

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**query parameters**

| key   | value | default value |
| ----- | ----- | ------------- |
| page  | int   | 1             |
| limit | int   | 10            |

**response status 200**

```json
[
	{
		"keycloak_id": "ads3-23fd-aeff-123s",
		"email": "example@example.com",
		"username": "theUserName2",
		"first_name": "Kirill",
		"last_name": "Lupink",
		"phone": "+77001234567", // string | null
		// roles Teachers, Methodists, Admins
		"roles": ["Methodists"]
	},
	{
		"keycloak_id": "ads3-23fd-aeff-123s",
		"email": "example@example.com",
		"username": "theUserName2",
		"first_name": "Kirill",
		"last_name": "Lupink",
		"phone": "+77001234567", // string | null
		// roles Teachers, Methodists, Admins
		"roles": ["Teachers"]
	},
	...
]
```

**response status 300**

```json
{
	"error": "invalid token"
}
```

### GET `/users/:id`

get user by id

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
	"first_name": "Kirill",
	"last_name": "Lupink",
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

update user by id, only admin can update

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"email": "example@example.com",
	"username": "theUserName2",
	"first_name": "bogdan", // change name to bogdan
	"last_name": "lupink",
	"phone": "+77001234567", // string | null
	// roles Teachers, Methodists, Admins
	"roles": ["Teachers", "Methodists", "Admins"]
}
```

**response status 200**

```json
{
	"keycloak_id": "ads3-23fd-aeff-123s",
	"email": "example@example.com",
	"username": "theUserName2",
	"first_name": "bogdan",
	"last_name": "Lupink",
	"phone": "+77001234567", // string | null
	// roles Teachers, Methodists, Admins
	"roles": ["Teachers", "Methodists", "Admins"]
}
```

**response status 300**

```json
{
	"error": "invalid keycloak_id"
}
```

## groups

get endpoint

### GET `/groups`

get all groups from keycloak

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**query parameters**

| key   | value | default value |
| ----- | ----- | ------------- |
| page  | int   | 1             |
| limit | int   | 10            |

### GET `/groups/:id`

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**response status 200**

```json
{
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

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

```json
{
	"name": "WEB25-1B",
	"qualification": "4S06130105 "Техник информационных систем"",
	"specialty": "06130100 "Программное обеспечение""
}
```

**response status 200**

```json
{
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

## RUPs

post, get, update, delete endpoints

### POST `/rups/create`

create rup

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**request body**

````json

**response status 200**

```json
{
	"id": "098c9b08-8bbb-404d-bbf0-4b8fc5d57801",
	"name": "name",
	"status": "DRAFT",
	"type": "PRACTICE",
	"study_year": "2025",
	"studyForm": "CORRESPONDENCE",
	"explorationNote": "Аннотация: Краткое описание дисциплины, её целей и задач, указывающее на значение предмета в подготовке специалиста. Дисциплина формирует базовые практические навыки и теоретические знания, необходимые для работы с информационными системами.",
	"goals": "Цели и задачи: Формирование у студентов знаний о структуре информационных систем, навыков проектирования и администрирования; развитие умений анализа требований, разработки простых приложений и их тестирования.",
	"prerequisites": "Основы программирования",
	"postrequisites": "Базы данных",
	"groupId": {
		"keycloak_id": 2134,
		"name": "WEB25",
		"specialty": "06130100 \"Программное обеспечение\"",
		"qualification": "3W06130102 \"Web-дизайнер\""
	},

	"contacts": [
		{
			"name": "",
			"phone": "+77023741234",
			"email": "example@asdf.com"
		}
	],
	"internetResources": [
		{
			"value": "Хабр статья",
			"link": "https://habr.com/asdffd" // maybe without
		}
	],
	"technicalResources": [
		{
			"value": "psql",
			"link": ""
		},
		...
	],

	"rupType": "THEORY", // PRACTICE, THEORY
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
	]
}
```

{
"data": {
"title": "name",
"status": "APPROVED",
"year": "2025-2026",
"type": "PRACTICE",
"course": "2",
"studyForm": "Correspondence",
"explorationNote": "Аннотация: Краткое описание дисциплины, её целей и задач, указывающее на значение предмета в подготовке специалиста. Дисциплина формирует базовые практические навыки и теоретические знания, необходимые для работы с информационными системами.",
"goals": "Цели и задачи: Формирование у студентов знаний о структуре информационных систем, навыков проектирования и администрирования; развитие умений анализа требований, разработки простых приложений и их тестирования.",
"prerequisites": "Основы программирования",
"postrequisites": "Базы данных",
"groupId": {
"keycloak_id": 2134,
"name": "WEB25",
"specialty": "06130100 \"Программное обеспечение\"",
"qualification": "3W06130102 \"Web-дизайнер\""
},

    	"contacts": [
    		{
    			"name": "",
    			"phone": "+77023741234",
    			"email": "example@asdf.com"
    		}
    	],
    	"internetResources": [
    		{
    			"value": "Хабр статья",
    			"link": "https://habr.com/asdffd" // maybe without
    		}
    	],
    	"technicalResources": [
    		{
    			"value": "psql",
    			"link": ""
    		},
    		...
    	],

    	"rupType": "THEORY", // PRACTICE, THEORY
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
    	]
    }

}
````

### GET `/rups`

get rups

**headers**

| key           | value          |
| ------------- | -------------- |
| Authorization | Bearer <token> |

**query parameters**

| key    | value                                  | default value                          |
| ------ | -------------------------------------- | -------------------------------------- |
| page   | int                                    | 1                                      |
| limit  | int                                    | 10                                     |
| status | [DRAFT, IN_REVIEW, APPROVED, REJECTED] | [DRAFT, IN_REVIEW, APPROVED, REJECTED] |

**//enum: [DRAFT, IN_REVIEW, APPROVED, REJECTED]**

**response status 200**

```json
{
	"data": {
		"name": "name",
		"status": "APPROVED",
		"reason": "тута записка от методиста, если статус REJECTED",
		"type": "PRACTICE",
		"course": "2",
		"studyForm": "CORRESPONDENCE",
		"studyYear": "2025-2026",
		"totalHours": "1488",

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

		

		"createdAt": "20251212",
		"updatedAt": "20251218"
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

### PUT `/rups/:id`

update rup by id, only admin can update

**permissions**

| role      | conditions                                    |
| --------- | --------------------------------------------- |
| TEACHER   | if his rup and status is equal REJECTED/DRAFT |
| METHODIST | never                                         |
| ADMIN     | always                                        |

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
| role      | conditions                        |
| --------- | --------------------------------- |
| TEACHER   | from REJECTED, DRAFT to IN_REVIEW |
| ADMIN     | always                            |
| METHODIST | all except DRAFT                  |

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
| role      | conditions                  |
| --------- | --------------------------- |
| TEACHER   | if his rup and status draft |
| ADMIN     | always                      |
| METHODIST | never                       |

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

**response status 300**
```json
{
	"error": "invalid data"
}
```

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

**responce status 300**

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

**responce status 300**

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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
