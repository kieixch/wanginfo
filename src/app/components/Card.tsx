"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ImageOff, CheckCircle, XCircle } from "lucide-react";
import { parseLocalDate } from "@/app/lib/date";

type EventCardProps = {
  id: string;
  title: string;
  short_description: string;
  category: string;
  event_type?: string | null;
  event_date: string;
  event_end_date?: string;
  image: string;
};

function EventStatus({
  event_date,
  event_end_date,
}: {
  event_date: string;
  event_end_date?: string;
}) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const start = parseLocalDate(event_date).getTime();
      const end = event_end_date
        ? parseLocalDate(event_end_date).getTime()
        : start + 86400000;

      if (now < start) {
        const diff = start - now;
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        setLabel(`${d}d ${h}h ${m}m`);
      } else if (now >= start && now <= end) {
        setLabel("In Progress");
      } else {
        setLabel("Ended");
      }
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [event_date, event_end_date]);

  if (label === "Ended") {
    return (
      <span className="flex items-center gap-1 text-sm font-medium text-red-500">
        <XCircle size={14} /> Ended
      </span>
    );
  }

  if (label === "In Progress") {
    return (
      <span className="flex items-center gap-1 text-sm font-medium text-green-500">
        <CheckCircle size={14} /> In Progress
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">
      <Clock size={14} /> {label}
    </span>
  );
}

export default function Card({
  id,
  title,
  short_description,
  category,
  event_type,
  event_date,
  event_end_date,
  image,
}: EventCardProps) {
  const [imgError, setImgError] = useState(false);
  const [showCategoryBadge, setShowCategoryBadge] = useState(true);
  const handleImgError = useCallback(() => setImgError(true), []);

  useEffect(() => {
    if (!event_type) return;
    const timer = setInterval(() => {
      setShowCategoryBadge((prev) => !prev);
    }, 3000);
    return () => clearInterval(timer);
  }, [event_type]);

  return (
    <Link href={`/detail/${id}`}>
      <div className="group bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden hover-card cursor-pointer">
        <div className="relative overflow-hidden h-48">
          {image && !imgError ? (
            <img
              src={image}
              alt={title}
              onError={handleImgError}
              className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-600">
              <ImageOff size={32} className="text-white/60" />
            </div>
          )}
          <div className="absolute top-3 left-3 overflow-hidden" style={{ height: "26px" }}>
            <AnimatePresence mode="wait">
              {showCategoryBadge || !event_type ? (
                <motion.span
                  key="cat"
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -40, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="block text-xs font-medium px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 text-indigo-600 dark:text-indigo-400 backdrop-blur whitespace-nowrap"
                >
                  {category}
                </motion.span>
              ) : (
                <motion.span
                  key="type"
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -40, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="block text-xs font-medium px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/80 text-green-700 dark:text-green-300 backdrop-blur whitespace-nowrap"
                >
                  {event_type}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="p-5">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate">
            {title}
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {short_description}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <EventStatus
              event_date={event_date}
              event_end_date={event_end_date}
            />
            <span className="text-xs text-gray-400">
              {parseLocalDate(event_date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
