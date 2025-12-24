from docxtpl import RichText

from app.helpers.rup_helpers import decode_lesson_type, short_name, zero_to_empty


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

        # sem1 ... sem8 zero to empty
        for sem in range(1, 9):
            row[f"sem{sem}"] = ""

        for semester in discipline.get("semesters", []):
            sem_num = semester.get("semester")
            hours = semester.get("totalHours", 0)

            if 1 <= sem_num <= 8:
                row[f"sem{sem_num}"] = zero_to_empty(hours)
                semesters_total[sem_num - 1] += hours

        disciplines.append(row)

    # zero to empty string
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


# build contacts
def build_contacts(contacts: list) -> list:
    result = []

    for c in contacts:
        full_name = short_name(
            c.get("firstName"),
            c.get("lastName"),
        )

        result.append(
            {
                "full_name": full_name,
                "first_name": c.get("firstName"),
                "last_name": c.get("lastName"),
                "email": c.get("email"),
                "phone": c.get("phone"),
            }
        )

    return result


# build resources list
def build_resources(resources: dict) -> list:
    result = []

    for item in resources:
        result.append(item.get("name"))

    return result


# build content table
def build_content_table(disciplineData: dict) -> list:
    """
    creates a flat list of rows for the table.
    logic:
    - expand the nesting structure discipline -> topics into a single line.
    - write the discipline name only in the first line of the topic.
    - add a row with the summary at the end of each discipline.
    """
    rows = []
    global_counter = 1
    globalTotal = {
        "total": 0,
        "theory": 0,
        "practice": 0,
        "individual": 0,
        "srsp": 0,
        "srs": 0,
    }

    for discipline in disciplineData:
        # initialized counters for the section summary line
        d_stats = {
            "total": 0,
            "theory": 0,
            "practice": 0,
            "individual": 0,
            "srsp": 0,
            "srs": 0,
        }

        topics = discipline.get("topics", [])

        for i, topic in enumerate(topics):
            # hours summary
            t_total = topic.get("totalHours", 0)
            t_theory = topic.get("theoryHours", 0)
            t_practice = topic.get("practiceHours", 0)
            t_ind = topic.get("individualHours", 0)
            t_srsp = topic.get("srspHours", 0)
            t_srs = topic.get("srsHours", 0)

            d_stats["total"] += t_total
            d_stats["theory"] += t_theory
            d_stats["practice"] += t_practice
            d_stats["individual"] += t_ind
            d_stats["srsp"] += t_srsp
            d_stats["srs"] += t_srs

            # display logic:
            # if this is the first topic (i == 0), show the course code and name
            # otherwise show an empty string
            if i == 0:
                disc_name = f"{discipline.get('code')} {discipline.get('name')}"
            else:
                disc_name = ""

            rows.append(
                {
                    "num": str(global_counter) + ".",
                    "discipline": disc_name,
                    "topic": topic.get("name"),
                    "total": zero_to_empty(t_total),
                    "theory": zero_to_empty(t_theory),
                    "practice": zero_to_empty(t_practice),
                    "individual": zero_to_empty(t_ind),
                    "srsp": zero_to_empty(t_srsp),
                    "srs": zero_to_empty(t_srs),
                    "type": decode_lesson_type(topic.get("type")),
                }
            )

            global_counter += 1

        # discipline hours summary
        rows.append(
            {
                "num": "",
                "discipline": RichText("Всего часов:", bold=True),
                "topic": "",
                "total": RichText(str(zero_to_empty(d_stats["total"])), bold=True),
                "theory": RichText(str(zero_to_empty(d_stats["theory"])), bold=True),
                "practice": RichText(zero_to_empty(d_stats["practice"]), bold=True),
                "individual": RichText(zero_to_empty(d_stats["individual"]), bold=True),
                "srsp": RichText(zero_to_empty(d_stats["srsp"]), bold=True),
                "srs": RichText(zero_to_empty(d_stats["srs"]), bold=True),
                "type": "",
            }
        )

        # summary global total hours
        globalTotal["total"] += d_stats["total"]
        globalTotal["theory"] += d_stats["theory"]
        globalTotal["practice"] += d_stats["practice"]
        globalTotal["individual"] += d_stats["individual"]
        globalTotal["srsp"] += d_stats["srsp"]
        globalTotal["srs"] += d_stats["srs"]

    # global hours result summary
    rows.append(
        {
            "num": "",
            "discipline": RichText("Итого часов:", bold=True),
            "topic": "",
            "total": RichText(str(zero_to_empty(globalTotal["total"])), bold=True),
            "theory": RichText(str(zero_to_empty(globalTotal["theory"])), bold=True),
            "practice": RichText(zero_to_empty(globalTotal["practice"]), bold=True),
            "individual": RichText(zero_to_empty(globalTotal["individual"]), bold=True),
            "srsp": RichText(zero_to_empty(globalTotal["srsp"]), bold=True),
            "srs": RichText(zero_to_empty(globalTotal["srs"]), bold=True),
            "type": "",
        }
    )

    return rows
