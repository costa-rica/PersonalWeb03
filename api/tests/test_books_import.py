"""Tests for the GoodReads CSV importer."""

import unittest

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.models import Base, Book
from src.routers.books import import_books_csv, safe_int


class BooksImportTests(unittest.TestCase):
    """Verify parsing, updates, and duplicate reconciliation."""

    def setUp(self):
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(engine)
        self.db = sessionmaker(bind=engine)()

    def tearDown(self):
        self.db.close()

    def test_safe_int_accepts_integral_decimal_strings(self):
        self.assertEqual(safe_int("4.0"), 4)
        self.assertEqual(safe_int("4.5"), 0)

    def test_import_preserves_columns_missing_from_export(self):
        book = Book(
            book_id=60211192,
            title="Shantaram",
            author="Gregory David Roberts",
            my_rating=0,
            average_rating=4.28,
            exclusive_shelf="currently-reading",
        )
        self.db.add(book)
        self.db.commit()

        content = (
            "Book Id,Title,Author,My Rating,Date Read,Exclusive Shelf\n"
            "60211192,Shantaram,Gregory David Roberts,4.0,2026/08/22,read\n"
        )
        result = import_books_csv(content, self.db)
        self.db.commit()

        updated = self.db.query(Book).one()
        self.assertEqual(updated.my_rating, 4)
        self.assertEqual(updated.average_rating, 4.28)
        self.assertEqual(updated.date_read, "2026-08-22")
        self.assertEqual(updated.exclusive_shelf, "read")
        self.assertEqual(result["updated"], 1)

    def test_import_reconciles_duplicate_goodreads_editions(self):
        self.db.add_all(
            [
                Book(
                    book_id=33600,
                    title="Shantaram",
                    author="Gregory David Roberts",
                    my_rating=4,
                    exclusive_shelf="read",
                ),
                Book(
                    book_id=60211192,
                    title=" Shantaram ",
                    author="GREGORY  DAVID ROBERTS",
                    my_rating=0,
                    exclusive_shelf="currently-reading",
                ),
            ]
        )
        self.db.commit()

        content = (
            "Book Id,Title,Author,My Rating,Date Read,Exclusive Shelf\n"
            "60211192,Shantaram,Gregory David Roberts,4.0,2026/08/22,read\n"
        )
        result = import_books_csv(content, self.db)
        self.db.commit()

        books = self.db.query(Book).all()
        self.assertEqual(len(books), 1)
        self.assertEqual(books[0].book_id, 60211192)
        self.assertEqual(books[0].my_rating, 4)
        self.assertEqual(books[0].exclusive_shelf, "read")
        self.assertEqual(result["merged"], 1)

    def test_import_matches_a_changed_edition_by_title_and_author(self):
        self.db.add(
            Book(
                book_id=33600,
                title="Shantaram",
                author="Gregory David Roberts",
                my_rating=0,
                exclusive_shelf="currently-reading",
            )
        )
        self.db.commit()

        content = (
            "Book Id,Title,Author,My Rating,Exclusive Shelf\n"
            "60211192,Shantaram,Gregory David Roberts,4.0,read\n"
        )
        result = import_books_csv(content, self.db)
        self.db.commit()

        book = self.db.query(Book).one()
        self.assertEqual(book.book_id, 60211192)
        self.assertEqual(book.my_rating, 4)
        self.assertEqual(result["inserted"], 0)
        self.assertEqual(result["updated"], 1)


if __name__ == "__main__":
    unittest.main()
