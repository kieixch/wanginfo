"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/app/lib/supabase";
import Card from "./Card";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { parseLocalDate } from "@/app/lib/date";

type Event = {
  id: string;
  title: string;
  short_description: string;
  category: string;
  event_type: string | null;
  event_date: string;
  event_end_date: string | null;
  images: string[];
};

const PER_PAGE = 6;

export default function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });
      if (data) setEvents(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(events.map((e) => e.category));
    return ["All", ...Array.from(cats)];
  }, [events]);

  const filtered = useMemo(() => {
    let result = events;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.short_description.toLowerCase().includes(q)
      );
    }
    if (category !== "All") {
      result = result.filter((e) => e.category === category);
    }
    return result;
  }, [events, search, category]);

  const sorted = useMemo(() => {
    const now = new Date();
    const upcoming = filtered
      .filter((e) => {
        const end = e.event_end_date
          ? new Date(e.event_end_date)
          : new Date(e.event_date);
        return end >= now;
      })
      .sort(
        (a, b) =>
          parseLocalDate(a.event_date).getTime() - parseLocalDate(b.event_date).getTime()
      );
    const past = filtered
      .filter((e) => {
        const end = e.event_end_date
          ? parseLocalDate(e.event_end_date)
          : parseLocalDate(e.event_date);
        return end < now;
      })
      .sort(
        (a, b) =>
          parseLocalDate(b.event_date).getTime() - parseLocalDate(a.event_date).getTime()
      );
    return [...upcoming, ...past];
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search events..."
            className="input-modern pl-10 text-gray-800 dark:text-gray-200"
          />
        </div>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="input-modern flex-1 text-gray-800 dark:text-gray-200"
        >
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {paginated.length === 0 ? (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
          <p className="text-lg">No events match your search</p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginated.map((event) => (
              <Card
                key={event.id}
                id={event.id}
                title={event.title}
                short_description={event.short_description}
                category={event.category}
                event_type={event.event_type}
                event_date={event.event_date}
                event_end_date={event.event_end_date || undefined}
                image={event.images?.[0] || ""}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl border border-gray-300 dark:border-gray-600 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl border border-gray-300 dark:border-gray-600 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
