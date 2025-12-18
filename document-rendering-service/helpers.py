# zero to empty from 0 to ""
def zero_to_empty(value):
    return "" if value == 0 else value


# study form enum
STUDY_FORM_MAP = {
    "FULL_TIME": "очная",
    "CORRESPONDENCE": "заочная",
}


# decode study form from enum key to text value
def decode_study_form(value: str) -> str:
    return STUDY_FORM_MAP.get(value, value)


# short name
def short_name(first_name: str | None, last_name: str | None) -> str:
    if not first_name or not last_name:
        return ""

    return f"{first_name[0].upper()}. {last_name}"
