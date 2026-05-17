# Requirements: Books Section

## Overview

Add a "Books" section to the website displaying the user's GoodReads library. Data is sourced from a GoodReads CSV export, uploaded via the admin panel, and stored in the API database. The section appears on the homepage between Blog and Resume.

## Reference

- CSV sample: `docs/references/goodreads_library_export.csv`
- CSV columns used: `Book Id`, `Title`, `Author`, `My Rating`, `Average Rating`, `Exclusive Shelf`
- "Currently reading" is determined by `Exclusive Shelf == "currently-reading"`
- CSV has 24 columns total; we store a useful subset

---

## Phase 1: API - Database Model

- [ ] Add `Book` model to `api/src/models.py` with columns:
  - `id` (Integer, primary key, autoincrement)
  - `book_id` (Integer, unique — the GoodReads Book Id)
  - `title` (String, not null)
  - `author` (String, not null)
  - `my_rating` (Integer, default 0)
  - `average_rating` (Float, default 0)
  - `exclusive_shelf` (String — values: "read", "currently-reading", "to-read")
  - `isbn` (String, nullable)
  - `isbn13` (String, nullable)
  - `number_of_pages` (Integer, nullable)
  - `year_published` (Integer, nullable)
  - `date_read` (String, nullable)
  - `date_added` (String, nullable)
  - `created_at` (DateTime, auto)
  - `updated_at` (DateTime, auto)
- [ ] Import `Book` in `api/src/database.py` so the table is created on startup
- [ ] Verify table is created by starting the API

---

## Phase 2: API - Pydantic Schemas

- [ ] Add `BookOut` schema to `api/src/schemas.py` with fields: `id`, `book_id`, `title`, `author`, `my_rating`, `average_rating`, `exclusive_shelf`
- [ ] Add `BookList` schema (list response) if needed by existing patterns

---

## Phase 3: API - Books Router & Endpoints

- [ ] Create `api/src/routers/books.py` with an `APIRouter(tags=["Books"])`
- [ ] `GET /books` — public, returns all books ordered by `date_added` descending (or `title`), returns `BookOut` fields
- [ ] `POST /books/upload-csv` — protected (requires JWT), accepts a CSV file upload, parses GoodReads CSV, upserts rows into the `books` table:
  - Match on `book_id` (GoodReads Book Id) to avoid duplicates
  - If a book with the same `book_id` exists, update its fields (ratings, shelf, etc.)
  - If new, insert it
  - Return summary: `{ "inserted": N, "updated": N, "total": N }`
- [ ] Register the router in `api/src/main.py`
- [ ] Test by uploading `docs/references/goodreads_library_export.csv` via Swagger UI (`/docs`)

---

## Phase 4: API - Admin Backup/Restore Support

- [ ] Update `api/src/routers/admin.py` backup to include the `books` table in the CSV export ZIP
- [ ] Update `api/src/routers/admin.py` restore to handle the `books` table CSV import

---

## Phase 5: Frontend - Admin Upload Section

- [ ] Add `"books"` as a new collapsible section key used with `toggleAdminSection`
- [ ] Create `web/src/components/admin/BooksManagementSection.tsx`:
  - Collapsible section titled "Books Management"
  - File input accepting `.csv` files only
  - Submit button that POSTs the CSV to `POST /books/upload-csv` with the JWT token
  - Display success/error modal with the insert/update summary
- [ ] Add `uploadBooksCsv` function to a new `web/src/lib/api/books.ts` (or add to existing api utils)
- [ ] Import and render `BooksManagementSection` in `web/src/app/admin/page.tsx` (between CreateBlogPostLinkSection and DatabaseManagementSection)

---

## Phase 6: Frontend - Books Homepage Section

- [ ] Create `web/src/components/BooksSection.tsx`:
  - Fetches books from `GET /books` on mount
  - Search bar at the top filtering by title or author
  - Scrollable table container (same pattern as blog section), showing 10 rows at a time
  - Table columns: Title, Author, My Rating, Avg Rating
  - If `exclusive_shelf === "currently-reading"`, show a green "currently reading" tag as a playful superscript to the right of the title
  - My Rating and Avg Rating: display as number (e.g., "4" or "4.28"); show "—" if 0
  - Match existing site typography (font-mono) and border style
- [ ] Add `fetchBooks` function to `web/src/lib/api/books.ts`
- [ ] Add `<BooksSection />` to `web/src/app/page.tsx` between `<BlogSection />` and `<ResumeSection />`

---

## Phase 7: Verify & Polish

- [ ] Verify full flow: upload CSV in admin, see books on homepage
- [ ] Verify search filters correctly by title and author
- [ ] Verify "currently reading" tag displays on the correct books
- [ ] Verify scrollable table with 10 visible rows and pagination or scroll behavior
- [ ] Verify the section looks correct on mobile (responsive)
