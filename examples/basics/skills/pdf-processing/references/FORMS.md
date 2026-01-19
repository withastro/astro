# PDF Form Filling Reference

This document covers how to fill PDF forms programmatically using Python.

## Prerequisites

For form filling, you'll need PyPDF2 or pdfrw:

```bash
pip install PyPDF2
# or
pip install pdfrw
```

## Using PyPDF2

### Reading Form Fields

```python
from PyPDF2 import PdfReader

def get_form_fields(pdf_path):
    """Get all form fields from a PDF."""
    reader = PdfReader(pdf_path)
    fields = reader.get_fields()
    return fields
```

### Filling Form Fields

```python
from PyPDF2 import PdfReader, PdfWriter

def fill_form(input_path, output_path, data):
    """Fill a PDF form with the given data."""
    reader = PdfReader(input_path)
    writer = PdfWriter()

    # Clone the PDF
    writer.append(reader)

    # Fill in the form fields
    writer.update_page_form_field_values(
        writer.pages[0],
        data
    )

    # Write the output
    with open(output_path, "wb") as output_file:
        writer.write(output_file)
```

### Example Usage

```python
# Define the data to fill
form_data = {
    "name": "John Doe",
    "email": "john@example.com",
    "date": "2024-01-15",
    "signature": "John Doe"
}

# Fill the form
fill_form("input_form.pdf", "filled_form.pdf", form_data)
```

## Common Field Types

| Field Type | Description            | Example Values   |
| ---------- | ---------------------- | ---------------- |
| Text       | Single-line text input | "John Doe"       |
| TextArea   | Multi-line text input  | "Line 1\nLine 2" |
| Checkbox   | Boolean checkbox       | "/Yes" or "/Off" |
| Radio      | Radio button group     | "/Option1"       |
| Dropdown   | Selection dropdown     | "Option A"       |

## Troubleshooting

### Field Not Found

If a field isn't being filled:

1. Check the exact field name using `get_form_fields()`
2. Field names are case-sensitive
3. Some PDFs use internal field names different from labels

### Read-Only Fields

Some PDF forms mark fields as read-only. You may need to:

1. Use a lower-level library like pdfrw
2. Modify the PDF structure directly
