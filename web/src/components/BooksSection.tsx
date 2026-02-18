"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface BookEntry {
  id: number;
  book_id: number;
  title: string;
  author: string;
  my_rating: number;
  average_rating: number;
  exclusive_shelf: string | null;
}

export default function BooksSection() {
  const [books, setBooks] = useState<BookEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
          console.log("[v0] NEXT_PUBLIC_API_BASE_URL not set");
          setError(true);
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/books`
        );
        if (response.ok) {
          const data = await response.json();
          setBooks(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.log("[v0] API not available yet:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return books;

    const query = searchQuery.toLowerCase();
    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
    );
  }, [books, searchQuery]);

  const formatRating = (rating: number) => {
    if (!rating || rating === 0) return "\u2014";
    return rating % 1 === 0 ? rating.toString() : rating.toFixed(2);
  };

  return (
    <section id="books" className="h-screen py-12 px-6">
      <div className="h-full border-2 border-black rounded-3xl bg-white flex flex-col overflow-hidden">
        {/* Header with search */}
        <div className="p-8 border-b-2 border-black">
          <h2 className="text-3xl font-bold font-mono mb-6 text-black">
            books
          </h2>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <Input
              type="text"
              placeholder="search by title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-2 border-black rounded-xl font-mono bg-gray-50 focus:bg-white"
            />
          </div>
        </div>

        {/* Scrollable book table */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-gray-600 font-mono">
              loading...
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center text-gray-600 font-mono">
              <div className="text-center space-y-2">
                <p>API not connected</p>
                <p className="text-sm">
                  Set NEXT_PUBLIC_API_BASE_URL in your environment variables
                </p>
              </div>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-600 font-mono">
              {searchQuery ? "no books found" : "no books yet"}
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="border-b-2 border-black bg-gray-50">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left px-6 py-3 font-mono font-bold text-sm text-black">
                        Title
                      </th>
                      <th className="text-left px-6 py-3 font-mono font-bold text-sm text-black hidden sm:table-cell">
                        Author
                      </th>
                      <th className="text-center px-4 py-3 font-mono font-bold text-sm text-black w-24">
                        My Rating
                      </th>
                      <th className="text-center px-4 py-3 font-mono font-bold text-sm text-black w-24">
                        Avg Rating
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto">
                <table className="w-full">
                  <tbody>
                    {filteredBooks.map((book) => (
                      <tr
                        key={book.id}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-3 font-mono text-sm">
                          <span>{book.title}</span>
                          {book.exclusive_shelf === "currently-reading" && (
                            <span className="ml-2 inline-block bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full -translate-y-1 rotate-[-2deg]">
                              currently reading
                            </span>
                          )}
                          {/* Show author on mobile below title */}
                          <span className="block text-xs text-gray-500 sm:hidden mt-1">
                            {book.author}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-mono text-sm text-gray-700 hidden sm:table-cell">
                          {book.author}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-center">
                          {formatRating(book.my_rating)}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-center">
                          {formatRating(book.average_rating)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
