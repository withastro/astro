#!/usr/bin/env python3
"""
PDF Text and Table Extraction Script

This script extracts text and tables from PDF files using pdfplumber.

Usage:
    python extract.py <pdf_path> [--tables] [--output <output_path>]

Examples:
    # Extract text from a PDF
    python extract.py document.pdf

    # Extract tables from a PDF
    python extract.py document.pdf --tables

    # Save output to a file
    python extract.py document.pdf --output output.txt
"""

import argparse
import json
import sys

try:
    import pdfplumber
except ImportError:
    print("Error: pdfplumber is not installed. Install it with: pip install pdfplumber")
    sys.exit(1)


def extract_text(pdf_path: str) -> str:
    """Extract all text from a PDF file."""
    text_parts = []
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages, 1):
            page_text = page.extract_text()
            if page_text:
                text_parts.append(f"--- Page {i} ---\n{page_text}")
    return "\n\n".join(text_parts)


def extract_tables(pdf_path: str) -> list:
    """Extract all tables from a PDF file."""
    all_tables = []
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages, 1):
            page_tables = page.extract_tables()
            for j, table in enumerate(page_tables, 1):
                all_tables.append({
                    "page": i,
                    "table_index": j,
                    "data": table
                })
    return all_tables


def main():
    parser = argparse.ArgumentParser(
        description="Extract text and tables from PDF files"
    )
    parser.add_argument("pdf_path", help="Path to the PDF file")
    parser.add_argument(
        "--tables",
        action="store_true",
        help="Extract tables instead of text"
    )
    parser.add_argument(
        "--output",
        "-o",
        help="Output file path (default: stdout)"
    )
    
    args = parser.parse_args()
    
    try:
        if args.tables:
            result = extract_tables(args.pdf_path)
            output = json.dumps(result, indent=2)
        else:
            output = extract_text(args.pdf_path)
        
        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(output)
            print(f"Output saved to {args.output}")
        else:
            print(output)
            
    except FileNotFoundError:
        print(f"Error: File not found: {args.pdf_path}")
        sys.exit(1)
    except Exception as e:
        print(f"Error processing PDF: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
