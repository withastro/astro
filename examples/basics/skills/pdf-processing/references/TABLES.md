# Advanced Table Extraction Reference

This document covers advanced techniques for extracting complex tables from PDF documents.

## Challenges with Complex Tables

PDF tables can be challenging to extract due to:

- Merged cells (spanning multiple rows or columns)
- Inconsistent cell boundaries
- Tables without visible borders
- Nested tables
- Multi-page tables

## Configuration Options

pdfplumber provides several options for table extraction:

```python
import pdfplumber

table_settings = {
    "vertical_strategy": "lines",     # or "text", "explicit"
    "horizontal_strategy": "lines",   # or "text", "explicit"
    "snap_tolerance": 3,
    "snap_x_tolerance": 3,
    "snap_y_tolerance": 3,
    "join_tolerance": 3,
    "edge_min_length": 3,
    "min_words_vertical": 3,
    "min_words_horizontal": 1,
    "intersection_tolerance": 3,
    "text_tolerance": 3,
    "text_x_tolerance": 3,
    "text_y_tolerance": 3,
}

with pdfplumber.open("document.pdf") as pdf:
    page = pdf.pages[0]
    tables = page.extract_tables(table_settings)
```

## Handling Merged Cells

For tables with merged cells, you may need to post-process the data:

```python
def handle_merged_cells(table):
    """
    Fill in merged cells by propagating values.
    Assumes merged cells appear as empty strings.
    """
    result = []
    prev_row = None

    for row in table:
        new_row = []
        for i, cell in enumerate(row):
            if cell is None or cell.strip() == "":
                # Try to get value from previous row (vertical merge)
                if prev_row and i < len(prev_row):
                    new_row.append(prev_row[i])
                else:
                    new_row.append("")
            else:
                new_row.append(cell)
        result.append(new_row)
        prev_row = new_row

    return result
```

## Tables Without Borders

For tables without visible borders, use the "text" strategy:

```python
table_settings = {
    "vertical_strategy": "text",
    "horizontal_strategy": "text",
}
```

## Multi-Page Tables

For tables spanning multiple pages:

```python
def extract_multipage_table(pdf_path, start_page, end_page):
    """Extract a table that spans multiple pages."""
    all_rows = []

    with pdfplumber.open(pdf_path) as pdf:
        for page_num in range(start_page - 1, end_page):
            page = pdf.pages[page_num]
            tables = page.extract_tables()

            if tables:
                # Get the first table on each page
                table = tables[0]

                # Skip header row on subsequent pages
                if page_num > start_page - 1 and len(table) > 1:
                    table = table[1:]

                all_rows.extend(table)

    return all_rows
```

## Converting to Pandas DataFrame

For further analysis, convert tables to pandas DataFrames:

```python
import pandas as pd

def table_to_dataframe(table, header_row=0):
    """Convert a table to a pandas DataFrame."""
    if not table or len(table) <= header_row:
        return pd.DataFrame()

    headers = table[header_row]
    data = table[header_row + 1:]

    return pd.DataFrame(data, columns=headers)
```

## Debugging Table Extraction

To visualize what pdfplumber sees:

```python
import pdfplumber

with pdfplumber.open("document.pdf") as pdf:
    page = pdf.pages[0]

    # Show detected table boundaries
    im = page.to_image()
    im.debug_tablefinder()
    im.save("debug_table.png")
```
