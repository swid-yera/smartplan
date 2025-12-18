import json
from docxtpl import DocxTemplate
from datetime import datetime
from helpers import zero_to_empty, decode_study_form
from mappers import build_developers, build_disciplines_table, build_resources


JSON_FILE = "json-example.json"
WORD_TEMPLATE = "template.docx"
OUT_FOLDER = "out"

print("importing json file...")

# import form json
with open(JSON_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)


print("collecting data from json...")

# collecting data
totalHours = int(data.get("totalHours"))
totalCredits = int(int(data.get("totalHours")) / 24)

group = data.get("group")

developers = build_developers(data.get("contacts", []))

explorationNote = data.get("explorationNote")
internet_resources = build_resources(explorationNote.get("internetResources"))
technical_resources = build_resources(explorationNote.get("technicalResources"))


disciplines, semesters_total = build_disciplines_table(data.get("disciplines", []))

# word docx template
print(f"importing {WORD_TEMPLATE}...")

doc = DocxTemplate(WORD_TEMPLATE)

context = {
    # base information
    "name": data.get("name"),
    "specialty": group.get("specialty"),
    "qualification": data["group"]["qualification"],
    "form": decode_study_form(data.get("studyForm")),
    "totalHours": totalHours,
    "credits": totalCredits,
    "course": data.get("course"),
    "group_name": group.get("name"),
    # developers
    "developer1": developers[0],
    "developer2": developers[1],
    "developer3": developers[2],
    # exploration note
    "basis": explorationNote.get("basis"),
    "goals": explorationNote.get("goals"),
    "competencies": explorationNote.get("competencies"),
    "prerequisites": explorationNote.get("prerequisites"),
    "postrequisites": explorationNote.get("postrequisites"),
    # resources
    "internet_resources": internet_resources,
    "technical_resources": technical_resources,
    # contacts
    "contacts": data.get("contacts"),
    # distribution
    "disciplines": disciplines,
    # semesters total
    "sem1total": zero_to_empty(semesters_total[0]),
    "sem2total": zero_to_empty(semesters_total[1]),
    "sem3total": zero_to_empty(semesters_total[2]),
    "sem4total": zero_to_empty(semesters_total[3]),
    "sem5total": zero_to_empty(semesters_total[4]),
    "sem6total": zero_to_empty(semesters_total[5]),
    "sem7total": zero_to_empty(semesters_total[6]),
    "sem8total": zero_to_empty(semesters_total[7]),
}

# rendering document to out folder
print(f'rendering document to "{OUT_FOLDER}" folder...')

doc.render(context)
timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
document_name = f"output_{timestamp}.docx"
doc.save(f"{OUT_FOLDER}/{document_name}")

print(f"successfully saved {document_name} to {OUT_FOLDER}!")
print(f"{OUT_FOLDER}/{document_name}")
