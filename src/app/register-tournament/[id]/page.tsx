"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { useAuth } from "@/app/context/AuthContext";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { parseLocalDate } from "@/app/lib/date";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Trophy,
  Users,
  User,
  Phone,
  Mail,
  School,
  FileText,
  Plus,
  Minus,
} from "lucide-react";
import Link from "next/link";

type Event = {
  id: string;
  title: string;
  category: string;
  event_type: string | null;
  event_date: string;
  event_end_date: string | null;
  images: string[];
};

export default function RegisterTournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  const [form, setForm] = useState({
    team_name: "",
    leader_name: "",
    leader_phone: "",
    leader_email: "",
    member_count: 1,
    members: [""] as string[],
    university: "",
    notes: "",
  });

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    const fetchData = async () => {
      const { data: eventData } = await supabase
        .from("events")
        .select("id, title, category, event_type, event_date, event_end_date, images")
        .eq("id", id)
        .single();
      if (eventData) {
        if (eventData.event_type !== "Campus Tournament") {
          router.push(`/detail/${id}`);
          return;
        }
        const now = Date.now();
        const end = eventData.event_end_date
          ? parseLocalDate(eventData.event_end_date).getTime()
          : parseLocalDate(eventData.event_date).getTime() + 86400000;
        if (now >= end) {
          toast.error("Registration is closed for this event");
          router.push(`/detail/${id}`);
          return;
        }
        setEvent(eventData);
      }
      const { data: regData } = await supabase
        .from("event_registrations")
        .select("id")
        .eq("event_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (regData) setAlreadyRegistered(true);
      setLoading(false);
    };
    fetchData();
  }, [user, id, router]);

  const updateMember = (index: number, value: string) => {
    const members = [...form.members];
    members[index] = value;
    setForm((prev) => ({ ...prev, members }));
  };

  const addMember = () => {
    if (form.members.length < 10) {
      setForm((prev) => ({
        ...prev,
        member_count: prev.member_count + 1,
        members: [...prev.members, ""],
      }));
    }
  };

  const removeMember = (index: number) => {
    if (form.members.length > 1) {
      const members = form.members.filter((_, i) => i !== index);
      setForm((prev) => ({
        ...prev,
        member_count: prev.member_count - 1,
        members,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !event) return;
    setSubmitting(true);

    const { error } = await supabase.from("event_registrations").insert({
      event_id: id,
      user_id: user.id,
      team_name: form.team_name,
      leader_name: form.leader_name,
      leader_phone: form.leader_phone,
      leader_email: form.leader_email,
      member_count: form.member_count,
      members: form.members.filter((m) => m.trim()),
      university: form.university,
      notes: form.notes,
    });

    if (error) {
      toast.error("Registration failed: " + error.message);
    } else {
      toast.success("Successfully registered for tournament!");
      setAlreadyRegistered(true);
    }
    setSubmitting(false);
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

  if (alreadyRegistered) {
    return (
      <div className="dark:bg-slate-900 min-h-screen">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <Trophy
            size={64}
            className="mx-auto text-indigo-600 dark:text-indigo-400 mb-6"
          />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
            Already Registered!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            You have already registered for {event.title}
          </p>
          <Link
            href={`/detail/${id}`}
            className="primary-btn inline-flex items-center gap-2"
          >
            Back to Event
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="dark:bg-slate-900 min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link
          href={`/detail/${id}`}
          className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 mb-8 transition"
        >
          <ArrowLeft size={18} /> Back to Event
        </Link>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <Trophy
              size={32}
              className="text-indigo-600 dark:text-indigo-400"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Tournament Registration
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {event.title} —{" "}
                {parseLocalDate(event.event_date).toLocaleDateString("en-GB", {
                  dateStyle: "long",
                })}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Users size={16} className="inline mr-1" /> Team Name
                </label>
                <input
                  value={form.team_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, team_name: e.target.value }))
                  }
                  required
                  className="input-modern"
                  placeholder="Your team name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User size={16} className="inline mr-1" /> Leader Name
                </label>
                <input
                  value={form.leader_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, leader_name: e.target.value }))
                  }
                  required
                  className="input-modern"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Phone size={16} className="inline mr-1" /> Leader Phone
                </label>
                <input
                  value={form.leader_phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, leader_phone: e.target.value }))
                  }
                  required
                  className="input-modern"
                  placeholder="Phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Mail size={16} className="inline mr-1" /> Leader Email
                </label>
                <input
                  type="email"
                  value={form.leader_email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, leader_email: e.target.value }))
                  }
                  required
                  className="input-modern"
                  placeholder="Email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <School size={16} className="inline mr-1" /> University/Institution
                </label>
                <input
                  value={form.university}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, university: e.target.value }))
                  }
                  required
                  className="input-modern"
                  placeholder="University name"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Users size={16} className="inline mr-1" /> Team Members
                </label>
                {form.members.length < 10 && (
                  <button
                    type="button"
                    onClick={addMember}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Member
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {form.members.map((member, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={member}
                      onChange={(e) => updateMember(i, e.target.value)}
                      className="input-modern flex-1"
                      placeholder={`Member ${i + 1} name${
                        i === 0 ? " (Leader)" : ""
                      }`}
                      required
                    />
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => removeMember(i)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                      >
                        <Minus size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FileText size={16} className="inline mr-1" /> Notes (optional)
              </label>
              <textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                className="textarea-modern"
                placeholder="Any additional information..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="primary-btn flex items-center gap-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trophy size={18} /> Register Tournament
                  </>
                )}
              </button>
              <Link
                href={`/detail/${id}`}
                className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
