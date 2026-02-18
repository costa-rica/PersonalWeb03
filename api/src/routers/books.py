"""Books router for managing GoodReads library."""

import csv
import io
from typing import List
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
    """Safely parse an integer from a string."""
    if not value or not value.strip():
        return default
    try:
        return int(value.strip())
    except ValueError:
        return default


def safe_float(value: str, default: float = 0.0) -> float:
    """Safely parse a float from a string."""
    if not value or not value.strip():
        return default
    try:
        return float(value.strip())
    except ValueError:
        return default


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

    Upserts on book_id: updates existing books, inserts new ones.
    """
    logger.info(f"Books CSV upload initiated by user: {current_user.email}")

    if not csv_file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a CSV file"
        )

    try:
        content = csv_file.file.read().decode('utf-8')
        reader = csv.DictReader(io.StringIO(content))

        inserted = 0
        updated = 0

        for row in reader:
            book_id = safe_int(row.get('Book Id', ''))
            if not book_id:
                logger.warning(f"Skipping row with no Book Id: {row.get('Title', 'unknown')}")
                continue

            existing = db.query(Book).filter(Book.book_id == book_id).first()

            book_data = {
                'title': row.get('Title', '').strip(),
                'author': row.get('Author', '').strip(),
                'my_rating': safe_int(row.get('My Rating', '')),
                'average_rating': safe_float(row.get('Average Rating', '')),
                'exclusive_shelf': row.get('Exclusive Shelf', '').strip() or None,
                'isbn': clean_isbn(row.get('ISBN', '')) or None,
                'isbn13': clean_isbn(row.get('ISBN13', '')) or None,
                'number_of_pages': safe_int(row.get('Number of Pages', '')) or None,
                'year_published': safe_int(row.get('Year Published', '')) or None,
                'date_read': row.get('Date Read', '').strip() or None,
                'date_added': row.get('Date Added', '').strip() or None,
            }

            if existing:
                for key, value in book_data.items():
                    setattr(existing, key, value)
                updated += 1
                logger.debug(f"Updated book: {book_data['title']}")
            else:
                new_book = Book(book_id=book_id, **book_data)
                db.add(new_book)
                inserted += 1
                logger.debug(f"Inserted book: {book_data['title']}")

        db.commit()
        total = inserted + updated
        logger.info(f"Books CSV upload complete: {inserted} inserted, {updated} updated, {total} total")

        return {
            "inserted": inserted,
            "updated": updated,
            "total": total,
        }

    except Exception as e:
        logger.error(f"Books CSV upload failed: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"CSV upload failed: {str(e)}"
        )
