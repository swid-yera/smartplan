from helpers import short_name, zero_to_empty


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
