---
name: pdf-processing
description: Extract text and tables from PDF files. Use when working with PDFs or document extraction.
---

# PDF Processing

This skill provides tools and guidance for extracting content from PDF documents.

## Quick Start

Use pdfplumber to extract text:

```python
import pdfplumber

with pdfplumber.open("document.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```

## Installation

Install the required dependencies:

```bash
pip install pdfplumber
```

## Basic Text Extraction

For simple text extraction from a PDF:

```python
import pdfplumber

def extract_text(pdf_path):
    """Extract all text from a PDF file."""
    text = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text.append(page_text)
    return "\n\n".join(text)
```

## Table Extraction

For extracting tables from PDFs:

```python
import pdfplumber

def extract_tables(pdf_path):
    """Extract all tables from a PDF file."""
    tables = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_tables = page.extract_tables()
            tables.extend(page_tables)
    return tables
```

## Form Filling

For filling PDF forms, see [references/FORMS.md](references/FORMS.md).

## Advanced Table Extraction

For complex tables with merged cells, see [references/TABLES.md](references/TABLES.md) and run `scripts/extract.py`.
