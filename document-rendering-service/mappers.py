from helpers import decode_lesson_type, short_name, zero_to_empty


def build_disciplines_table(disciplines_data: dict) -> tuple[list, list]:
    """
    returns:
    - disciplines: string list for table
    - semesters_total: result of semesters hours (1-8)
    """

    disciplines = []
    semesters_total: list[int] = [0] * 8

    for discipline in disciplines_data:

        row = {
            "name": f"{discipline.get('code')} {discipline.get('name')}",
            "total": zero_to_empty(discipline.get("totalHours", 0)),
        }

        # sem1 ... sem8 = ""
        for sem in range(1, 9):
            row[f"sem{sem}"] = ""

        for semester in discipline.get("semesters", []):
            sem_num = semester.get("semester")
            hours = semester.get("totalHours", 0)

            if 1 <= sem_num <= 8:
                row[f"sem{sem_num}"] = zero_to_empty(hours)
                semesters_total[sem_num - 1] += hours

        disciplines.append(row)

    # 0 → ""
    semesters_total = [zero_to_empty(v) for v in semesters_total]

    return disciplines, semesters_total


# get developers from contacts[] return shorted developers name[]
def build_developers(contacts: list, max_count: int = 3) -> list:
    developers = []

    for i in range(max_count):
        if i < len(contacts):
            dev = short_name(
                contacts[i].get("firstName"),
                contacts[i].get("lastName"),
            )
            developers.append(dev)
        else:
            developers.append("")

    return developers


# build resources list
def build_resources(resources: dict) -> list:
    result = []

    for item in resources:
        result.append(item.get("name"))

    return result


# build content table
def build_content_table(data: dict) -> list:
    """
    returns a flat list of rows for a table:
    - topics lines
    - total hours line after each discipline
    """
    rows = []
    counter = 1

    for discipline in data.get("disciplines", []):
        discipline_total = {
            "total": 0,
            "theory": 0,
            "practice": 0,
            "individual": 0,
            "srsp": 0,
            "srs": 0,
        }

        for topic in discipline.get("topics", []):
            discipline_total["total"] += topic.get("totalHours", 0)
            discipline_total["theory"] += topic.get("theoryHours", 0)
            discipline_total["practice"] += topic.get("practiceHours", 0)
            discipline_total["individual"] += topic.get("individualHours", 0)
            discipline_total["srsp"] += topic.get("srspHours", 0)
            discipline_total["srs"] += topic.get("srsHours", 0)

            rows.append(
                {
                    "num": counter,
                    "discipline": f"{discipline['code']} {discipline['name']}",
                    "topic": topic.get("name"),
                    "total": zero_to_empty(topic.get("totalHours", 0)),
                    "theory": zero_to_empty(topic.get("theoryHours", 0)),
                    "practice": zero_to_empty(topic.get("practiceHours", 0)),
                    "individual": zero_to_empty(topic.get("individualHours", 0)),
                    "srsp": zero_to_empty(topic.get("srspHours", 0)),
                    "srs": zero_to_empty(topic.get("srsHours", 0)),
                    "type": decode_lesson_type(topic.get("type")),
                    "is_total": False,
                }
            )

            counter += 1

        # line discipline total hours
        rows.append(
            {
                "num": "",
                "discipline": "Всего часов:",
                "topic": "",
                "total": zero_to_empty(discipline_total["total"]),
                "theory": zero_to_empty(discipline_total["theory"]),
                "practice": zero_to_empty(discipline_total["practice"]),
                "individual": zero_to_empty(discipline_total["individual"]),
                "srsp": zero_to_empty(discipline_total["srsp"]),
                "srs": zero_to_empty(discipline_total["srs"]),
                "type": "",
                "is_total": True,
            }
        )

    return rows
