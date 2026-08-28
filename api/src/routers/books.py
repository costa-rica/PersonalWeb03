"""Books router for managing GoodReads library."""

import csv
import io
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Callable, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from loguru import logger

from src.database import get_db
from src.models import Book, User
from src.schemas import BookOut
from src.auth import get_current_user

router = APIRouter(tags=["Books"])


def clean_isbn(value: str) -> str:
    """Clean GoodReads ISBN format (e.g., '=\"192076920X\"' -> '192076920X')."""
    if not value:
        return ""
    return value.strip().replace('="', '').replace('"', '')


def safe_int(value: str, default: int = 0) -> int:
    """Safely parse an integer, including integral decimal strings."""
    if not value or not value.strip():
        return default
    try:
        parsed = Decimal(value.strip())
        if parsed != parsed.to_integral_value():
            return default
        return int(parsed)
    except (InvalidOperation, ValueError, OverflowError):
        return default


def normalize_date(value: str) -> str | None:
    """Normalize date strings from various GoodReads formats to YYYY-MM-DD."""
    if not value or not value.strip():
        return None
    value = value.strip()
    formats = [
        '%Y/%m/%d',  # GoodReads CSV: 2025/12/01
        '%m/%d/%y',  # Excel-mangled: 12/1/25
        '%m/%d/%Y',  # Excel-mangled: 12/1/2025
        '%Y-%m-%d',  # Already normalized
    ]
    for fmt in formats:
        try:
            return datetime.strptime(value, fmt).strftime('%Y-%m-%d')
        except ValueError:
            continue
    logger.warning(f"Could not parse date: '{value}', storing as-is")
    return value


def safe_float(value: str, default: float = 0.0) -> float:
    """Safely parse a float from a string."""
    if not value or not value.strip():
        return default
    try:
        return float(value.strip())
    except ValueError:
        return default


def normalize_identity(value: str) -> str:
    """Normalize title and author values for duplicate matching."""
    return " ".join(value.casefold().split())


def import_books_csv(content: str, db: Session) -> dict[str, int]:
    """Import a GoodReads CSV and reconcile duplicate book editions."""
    reader = csv.DictReader(io.StringIO(content))
    fieldnames = set(reader.fieldnames or [])
    required_fields = {"Book Id", "Title", "Author"}
    missing_fields = sorted(required_fields - fieldnames)
    if missing_fields:
        raise ValueError(
            f"Missing required CSV columns: {', '.join(missing_fields)}"
        )

    column_parsers: dict[str, tuple[str, Callable[[str], object]]] = {
        "Title": ("title", lambda value: value.strip()),
        "Author": ("author", lambda value: value.strip()),
        "My Rating": ("my_rating", safe_int),
        "Average Rating": ("average_rating", safe_float),
        "Exclusive Shelf": (
            "exclusive_shelf",
            lambda value: value.strip() or None,
        ),
        "ISBN": ("isbn", lambda value: clean_isbn(value) or None),
        "ISBN13": ("isbn13", lambda value: clean_isbn(value) or None),
        "Number of Pages": (
            "number_of_pages",
            lambda value: safe_int(value) or None,
        ),
        "Year Published": (
            "year_published",
            lambda value: safe_int(value) or None,
        ),
        "Date Read": ("date_read", normalize_date),
        "Date Added": ("date_added", normalize_date),
    }

    existing_books = db.query(Book).all()
    books_by_id = {book.book_id: book for book in existing_books}
    books_by_identity: dict[tuple[str, str], list[Book]] = {}
    for book in existing_books:
        identity = (
            normalize_identity(book.title),
            normalize_identity(book.author),
        )
        books_by_identity.setdefault(identity, []).append(book)

    inserted = 0
    updated = 0
    merged = 0
    skipped = 0

    for row in reader:
        book_id = safe_int(row.get("Book Id", ""))
        title = row.get("Title", "").strip()
        author = row.get("Author", "").strip()
        if not book_id or not title or not author:
            skipped += 1
            logger.warning(
                f"Skipping invalid book row: {title or 'unknown'}"
            )
            continue

        identity = (normalize_identity(title), normalize_identity(author))
        identity_matches = books_by_identity.get(identity, [])
        existing = books_by_id.get(book_id)

        if existing is None and identity_matches:
            existing = identity_matches[0]
            books_by_id.pop(existing.book_id, None)
            existing.book_id = book_id
            books_by_id[book_id] = existing

        book_data = {
            model_field: parser(row.get(csv_field) or "")
            for csv_field, (model_field, parser) in column_parsers.items()
            if csv_field in fieldnames
        }

        if existing:
            for key, value in book_data.items():
                setattr(existing, key, value)
            updated += 1

            duplicates = [
                book for book in identity_matches if book is not existing
            ]
            for duplicate in duplicates:
                db.delete(duplicate)
                books_by_id.pop(duplicate.book_id, None)
                merged += 1
            books_by_identity[identity] = [existing]
            logger.debug(f"Updated book: {title}")
        else:
            new_book = Book(book_id=book_id, **book_data)
            db.add(new_book)
            books_by_id[book_id] = new_book
            books_by_identity[identity] = [new_book]
            inserted += 1
            logger.debug(f"Inserted book: {title}")

    return {
        "inserted": inserted,
        "updated": updated,
        "merged": merged,
        "skipped": skipped,
        "total": inserted + updated,
    }


@router.get("/books", response_model=List[BookOut])
def get_books(db: Session = Depends(get_db)):
    """Get all books ordered by date added (most recent first)."""
    books = db.query(Book).filter(
        Book.exclusive_shelf.in_(["read", "currently-reading"])
    ).order_by(Book.date_added.desc()).all()
    return books


@router.post("/books/upload-csv")
def upload_books_csv(
    csv_file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a GoodReads CSV export to import/update books.

    Matches by GoodReads ID, then normalized title and author. Duplicate
    editions are consolidated into one reading-log record.
    """
    logger.info(f"Books CSV upload initiated by user: {current_user.email}")

    if not csv_file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a CSV file"
        )

    try:
        content = csv_file.file.read().decode('utf-8-sig')
        result = import_books_csv(content, db)
        db.commit()
        logger.info(
            "Books CSV upload complete: "
            f"{result['inserted']} inserted, {result['updated']} updated, "
            f"{result['merged']} merged, {result['skipped']} skipped"
        )

        return result

    except (UnicodeDecodeError, ValueError) as e:
        logger.warning(f"Books CSV upload rejected: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid CSV: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Books CSV upload failed: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"CSV upload failed: {str(e)}"
        )
