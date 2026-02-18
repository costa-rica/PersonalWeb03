"""Database models for PersonalWeb03API."""

from datetime import datetime, date
from sqlalchemy import Column, Integer, Float, String, DateTime, Date
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class User(Base):
    """User model for authentication."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class BlogPost(Base):
    """Blog post model."""

    __tablename__ = "blog_posts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    post_item_image = Column(String, nullable=True)
    directory_name = Column(String, nullable=True)
    date_shown_on_blog = Column(Date, default=date.today, nullable=False)
    link_to_external_post = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Book(Base):
    """Book model for GoodReads library."""

    __tablename__ = "books"

    id = Column(Integer, primary_key=True, autoincrement=True)
    book_id = Column(Integer, unique=True, nullable=False, index=True)
    title = Column(String, nullable=False)
    author = Column(String, nullable=False)
    my_rating = Column(Integer, default=0)
    average_rating = Column(Float, default=0)
    exclusive_shelf = Column(String, nullable=True)
    isbn = Column(String, nullable=True)
    isbn13 = Column(String, nullable=True)
    number_of_pages = Column(Integer, nullable=True)
    year_published = Column(Integer, nullable=True)
    date_read = Column(String, nullable=True)
    date_added = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
