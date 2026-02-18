"use client";

import Link from "next/link";
import { useAppSelector } from "@/lib/hooks";
import Image from "next/image";

export default function Navigation() {
  const token = useAppSelector((state) => state.user.token);

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b-2 border-black">
      <Link href="/" className="text-xl font-mono font-bold">
        <Image src="/logo06.png" alt="Nick logo" width={60} height={60} />
      </Link>
      <div className="flex gap-6 font-mono text-sm">
        <Link
          href="#projects"
          className="hover:text-gray-600 transition-colors"
        >
          projects
        </Link>
        <Link href="#blog" className="hover:text-gray-600 transition-colors">
          blog
        </Link>
        <Link href="#resume" className="hover:text-gray-600 transition-colors">
          resume
        </Link>
        {token && (
          <Link
            href="/admin"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            admin
          </Link>
        )}
      </div>
    </nav>
  );
}
