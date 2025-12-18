import pandas as pd

from docx.shared import Mm
from docxtpl import DocxTemplate

todos_df = pd.DataFrame(
    {
        "name": ["ПМ1", "ПМ2"],
        "total": ["24", "64"],
        "sem1": ["24", "48"],
    }
)

doc = DocxTemplate("template.docx")

context = {
    "rup_name": "ПМ6",
    "rup_specialty": "42035845 Специальность",
    "rup_qualification": "квалификация",
    "rup_form": "очная",
    "todos": todos_df.to_dict(orient="records"),
}

doc.render(context)
doc.save("output.docx")
