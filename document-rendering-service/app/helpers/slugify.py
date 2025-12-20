import re

RU_TO_LAT = {
    "а": "a",
    "б": "b",
    "в": "v",
    "г": "g",
    "д": "d",
    "е": "e",
    "ё": "e",
    "ж": "zh",
    "з": "z",
    "и": "i",
    "й": "y",
    "к": "k",
    "л": "l",
    "м": "m",
    "н": "n",
    "о": "o",
    "п": "p",
    "р": "r",
    "с": "s",
    "т": "t",
    "у": "u",
    "ф": "f",
    "х": "h",
    "ц": "ts",
    "ч": "ch",
    "ш": "sh",
    "щ": "sch",
    "ы": "y",
    "э": "e",
    "ю": "yu",
    "я": "ya",
}


def transliterate(text: str) -> str:
    result = []
    for ch in text.lower():
        if ch in RU_TO_LAT:
            result.append(RU_TO_LAT[ch])
        elif re.match(r"[a-z0-9]", ch):
            result.append(ch)
        else:
            result.append(" ")
    return "".join(result)


def slugify_ru(text: str) -> str:
    text = transliterate(text)

    # заменяем всё, что не буква/цифра, на -
    text = re.sub(r"[^a-z0-9]+", "-", text)

    # убираем лишние -
    text = text.strip("-")

    return text
