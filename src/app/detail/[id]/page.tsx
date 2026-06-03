"use client";

import { useEffect, useState, use, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { useAuth } from "@/app/context/AuthContext";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { parseLocalDate } from "@/app/lib/date";
import toast from "react-hot-toast";
import {
  Clock,
  MapPin,
  Calendar,
  Bell,
  BellOff,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  CheckCircle,
  XCircle,
  Trophy,
} from "lucide-react";
import Link from "next/link";

type Event = {
  id: string;
  title: string;
  description: string;
  short_description: string;
  category: string;
  event_type: string | null;
  event_date: string;
  event_end_date: string | null;
  images: string[];
  embed_map: string;
  created_at: string;
};

function EventStatus({
  event_date,
  event_end_date,
}: {
  event_date: string;
  event_end_date?: string | null;
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
        const d = Math.floor((start - now) / 86400000);
        const h = Math.floor(((start - now) % 86400000) / 3600000);
        const m = Math.floor(((start - now) % 3600000) / 60000);
        const s = Math.floor(((start - now) % 60000) / 1000);
        setLabel(`${d}d ${h}h ${m}m ${s}s`);
      } else if (now >= start && now <= end) {
        setLabel("In Progress");
      } else {
        setLabel("Ended");
      }
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [event_date, event_end_date]);

  if (label === "Ended") {
    return (
      <span className="flex items-center gap-2 text-lg font-semibold text-red-500">
        <XCircle size={22} /> Event Ended
      </span>
    );
  }

  if (label === "In Progress") {
    return (
      <span className="flex items-center gap-2 text-lg font-semibold text-green-500">
        <CheckCircle size={22} /> In Progress
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
      <Clock size={24} /> {label}
    </div>
  );
}

export default function DetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [reminded, setReminded] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [reminding, setReminding] = useState(false);
  const [imgError, setImgError] = useState(false);

  const now = useSyncExternalStore(
    (cb) => {
      const id = setInterval(cb, 1000);
      return () => clearInterval(id);
    },
    () => Date.now(),
    () => 0
  );

  const isEnded = event
    ? now >=
      (event.event_end_date
        ? parseLocalDate(event.event_end_date).getTime()
        : parseLocalDate(event.event_date).getTime() + 86400000)
    : false;

  useEffect(() => {
    const fetchEvent = async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();
      if (data) setEvent(data);
      setLoading(false);
    };
    fetchEvent();
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    supabase
      .from("reminders")
      .select("id")
      .eq("user_id", user.id)
      .eq("event_id", id)
      .maybeSingle()
      .then(({ data }) => setReminded(!!data));
  }, [user, id]);

  const toggleReminder = async () => {
    if (isEnded) {
      toast.error("Cannot set reminder for an ended event");
      return;
    }
    if (!user) {
      toast.error("Please login to set a reminder");
      router.push("/login");
      return;
    }

    setReminding(true);

    if (reminded) {
      const { error } = await supabase
        .from("reminders")
        .delete()
        .eq("user_id", user.id)
        .eq("event_id", id);
      if (error) {
        toast.error("Failed to remove reminder");
      } else {
        await supabase
          .from("notifications")
          .delete()
          .eq("user_id", user.id)
          .eq("event_id", id);
        setReminded(false);
        toast.success("Reminder removed");
      }
    } else {
      const { error } = await supabase
        .from("reminders")
        .insert({ user_id: user.id, event_id: id });
      if (error) {
        toast.error("Failed to set reminder");
      } else {
        await supabase.from("notifications").insert({
          user_id: user.id,
          event_id: id,
          title: "Reminder Set",
          message: `You set a reminder for "${event?.title}" on ${parseLocalDate(
            event!.event_date
          ).toLocaleDateString("en-GB", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}`,
        });
        setReminded(true);
        toast.success("Reminder set! We'll notify you.");
      }
    }

    setReminding(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-slate-900">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-slate-900">
        <p className="text-gray-500">Event not found</p>
      </div>
    );
  }

  return (
    <div className="dark:bg-slate-900 min-h-screen">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 mb-8 transition"
        >
          <ArrowLeft size={18} /> Back to Home
        </Link>

        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <div className="relative rounded-2xl overflow-hidden">
              {event.images?.[currentImage] && !imgError ? (
                <img
                  src={event.images[currentImage]}
                  alt={event.title}
                  onError={() => setImgError(true)}
                  className="w-full h-[350px] md:h-[400px] object-cover rounded-2xl"
                />
              ) : (
                <div className="w-full h-[350px] md:h-[400px] flex items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-600 rounded-2xl">
                  <ImageOff size={48} className="text-white/60" />
                </div>
              )}

              {event.images?.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setCurrentImage((p) =>
                        p === 0 ? event.images.length - 1 : p - 1
                      )
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-slate-900/80 rounded-full hover:bg-white transition"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentImage((p) =>
                        p === event.images.length - 1 ? 0 : p + 1
                      )
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-slate-900/80 rounded-full hover:bg-white transition"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {event.images?.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {event.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentImage(i);
                      setImgError(false);
                    }}
                    className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                      i === currentImage
                        ? "border-indigo-600"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                {event.category}
              </span>
              {event.event_type && (
                <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400">
                  {event.event_type}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-gray-800 dark:text-white">
              {event.title}
            </h1>

            <div className="mt-6 space-y-2 text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <Calendar size={18} />
                <span>
                  Start:{" "}
                  {parseLocalDate(event.event_date).toLocaleDateString("en-GB", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {event.event_end_date && (
                <div className="flex items-center gap-4">
                  <Calendar size={18} />
                  <span>
                    End:{" "}
                    {parseLocalDate(event.event_end_date).toLocaleDateString("en-GB", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4">
              <EventStatus
                event_date={event.event_date}
                event_end_date={event.event_end_date}
              />
            </div>

            <p className="mt-8 text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={toggleReminder}
                disabled={reminding || isEnded}
                className={`inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl font-medium transition leading-none ${
                  isEnded
                    ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                    : reminded
                    ? "bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200"
                    : "primary-btn"
                }`}
              >
                {reminding ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : reminded ? (
                  <>
                    <BellOff size={18} /> Remove Reminder
                  </>
                ) : isEnded ? (
                  <>
                    <BellOff size={18} /> Event Ended
                  </>
                ) : (
                  <>
                    <Bell size={18} /> Set Reminder
                  </>
                )}
              </button>
              {event.event_type === "Campus Tournament" && !isEnded && (
                <Link
                  href={`/register-tournament/${event.id}`}
                  className="inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl font-medium transition leading-none bg-green-600 hover:bg-green-700 text-white"
                >
                  <Trophy size={18} /> Register Tournament
                </Link>
              )}
              {event.event_type === "Campus Tournament" && isEnded && (
                <span className="inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl font-medium bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed">
                  <Trophy size={18} /> Registration Closed
                </span>
              )}
            </div>

            {event.embed_map && (
              <div className="mt-8">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 font-medium mb-3">
                  <MapPin size={18} /> Location
                </div>
                <iframe
                  src={event.embed_map}
                  className="w-full h-[250px] rounded-2xl"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
