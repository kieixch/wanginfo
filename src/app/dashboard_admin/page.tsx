"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { useAuth } from "@/app/context/AuthContext";
import toast from "react-hot-toast";
import { parseLocalDate } from "@/app/lib/date";
import {
  Plus,
  LogOut,
  Trash2,
  Edit3,
  Clock,
  MapPin,
  Image as ImageIcon,
  Menu,
  X,
  Search,
  Users,
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

const defaultForm = {
  title: "",
  description: "",
  short_description: "",
  category: "Sport",
  event_type: "",
  event_date: "",
  event_end_date: "",
  images: [] as string[],
  embed_map: "",
};

type Registration = {
  id: string;
  event_id: string;
  user_id: string;
  team_name: string;
  leader_name: string;
  leader_phone: string;
  leader_email: string;
  member_count: number;
  members: string[];
  university: string;
  notes: string | null;
  created_at: string;
  events: { title: string } | null;
};

export default function DashboardAdmin() {
  const router = useRouter();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [form, setForm] = useState({ ...defaultForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRegistrations, setShowRegistrations] = useState(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [regSearch, setRegSearch] = useState("");
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);

  const refreshEvents = useCallback(() => {
    supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setEvents(data);
      });
  }, []);

  const refreshRegistrations = useCallback(() => {
    supabase
      .from("event_registrations")
      .select("*, events(title)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setRegistrations(data);
      });
  }, []);

  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== "admin")) {
      router.push("/login");
      return;
    }
    if (user && profile?.role === "admin") {
      refreshEvents();
    }
  }, [user, profile, authLoading, router, refreshEvents]);

  const uploadImage = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from("event-images")
      .upload(path, file);
    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploading(false);
      return null;
    }
    const { data: urlData } = supabase.storage
      .from("event-images")
      .getPublicUrl(path);
    setUploading(false);
    return urlData.publicUrl;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const url = await uploadImage(files[i]);
      if (url) urls.push(url);
    }
    setForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
  };

  const removeImage = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const payload: Record<string, unknown> = {
      title: form.title,
      description: form.description,
      short_description: form.short_description,
      category: form.category,
      event_type: form.event_type || null,
      event_date: form.event_date,
      images: form.images,
      embed_map: form.embed_map,
    };
    if (form.event_end_date) {
      payload.event_end_date = form.event_end_date;
    }

    if (editingId) {
      const { error } = await supabase
        .from("events")
        .update(payload)
        .eq("id", editingId);
      if (error) {
        toast.error("Update failed: " + error.message);
        setSaving(false);
        return;
      }
      toast.success("Event updated!");
    } else {
      const { error } = await supabase.from("events").insert({
        ...payload,
        created_by: user.id,
      });
      if (error) {
        toast.error("Create failed: " + error.message);
        setSaving(false);
        return;
      }
      toast.success("Event created!");
    }

    setForm({ ...defaultForm });
    setEditingId(null);
    setShowForm(false);
    setSaving(false);
    refreshEvents();
  };

  const handleEdit = (event: Event) => {
    setForm({
      title: event.title,
      description: event.description,
      short_description: event.short_description,
      category: event.category,
      event_type: event.event_type || "",
      event_date: event.event_date.slice(0, 16),
      event_end_date: event.event_end_date?.slice(0, 16) || "",
      images: event.images || [],
      embed_map: event.embed_map || "",
    });
    setEditingId(event.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
      toast.error("Delete failed: " + error.message);
      return;
    }
    toast.success("Event deleted!");
    refreshEvents();
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-slate-900">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-slate-900">
      <aside
        className={`sidebar fixed top-0 z-40 w-72 min-h-screen p-6 text-white transition-transform duration-300 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Wanginfo</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 hover:bg-white/10 rounded"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-white/60 text-sm mb-1">Admin Dashboard</p>
        <p className="text-white/80 text-sm mb-6 truncate">{user?.email}</p>

        <nav className="space-y-2">
          <button
            onClick={() => {
              setShowForm(true);
              setShowRegistrations(false);
              setEditingId(null);
              setForm({ ...defaultForm });
              setSidebarOpen(false);
            }}
            className="w-full inline-flex items-center gap-1.5 px-4 py-3 rounded-xl hover:bg-white/10 transition"
          >
            <Plus size={18} /> Add Event
          </button>
          <button
            onClick={() => {
              setShowForm(false);
              setShowRegistrations(false);
            }}
            className="w-full inline-flex items-center gap-1.5 px-4 py-3 rounded-xl hover:bg-white/10 transition"
          >
            <Clock size={18} /> All Events
          </button>
          <button
            onClick={() => {
              setShowForm(false);
              setShowRegistrations(true);
              refreshRegistrations();
            }}
            className="w-full inline-flex items-center gap-1.5 px-4 py-3 rounded-xl hover:bg-white/10 transition"
          >
            <Users size={18} /> Event Registrations
          </button>
        </nav>

        <div className="mt-auto pt-6 space-y-2">
          <Link
            href="/"
            className="block w-full text-center px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition"
          >
            View Site
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 transition"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen md:ml-72">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <Menu size={20} />
          </button>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {showForm
              ? editingId
                ? "Edit Event"
                : "New Event"
              : showRegistrations
              ? "Event Registrations"
              : "Manage Events"}
          </h2>
          {!showForm && !showRegistrations && (
            <button
              onClick={() => {
                setEditingId(null);
                setForm({ ...defaultForm });
                setShowRegistrations(false);
                setShowForm(true);
              }}
              className="primary-btn flex items-center gap-2 text-sm py-2 px-4"
            >
              <Plus size={16} /> Add Event
            </button>
          )}
        </header>

        <main className="flex-1 p-6">
          {showForm ? (
            <form
              onSubmit={handleSave}
              className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl space-y-6 max-w-4xl"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, title: e.target.value }))
                    }
                    required
                    className="input-modern"
                    placeholder="Event title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Event Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, category: e.target.value }))
                    }
                    className="input-modern"
                  >
                    {[
                      "Sport",
                      "Seminar",
                      "Workshop",
                      "Competition",
                      "Music",
                      "Art",
                      "Technology",
                      "Other",
                    ].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type of Event
                  </label>
                  <select
                    value={form.event_type}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, event_type: e.target.value }))
                    }
                    className="input-modern"
                  >
                    <option value="">None</option>
                    <option value="Campus Tournament">Campus Tournament</option>
                    <option value="Academic">Academic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Event Start
                  </label>
                  <input
                    type="datetime-local"
                    value={form.event_date}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, event_date: e.target.value }))
                    }
                    required
                    className="input-modern [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Event End (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={form.event_end_date}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        event_end_date: e.target.value,
                      }))
                    }
                    className="input-modern [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Short Description (shown on card)
                  </label>
                  <textarea
                    value={form.short_description}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        short_description: e.target.value,
                      }))
                    }
                    required
                    className="textarea-modern"
                    style={{ minHeight: "80px" }}
                    placeholder="Brief description for the homepage card"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, description: e.target.value }))
                    }
                    required
                    className="textarea-modern"
                    placeholder="Complete event description"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Images
                  </label>
                  <div className="flex flex-wrap gap-3 mb-3">
                    {form.images.map((url, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={url}
                          alt={`Image ${i + 1}`}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-indigo-400 transition">
                    <ImageIcon size={20} className="text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {uploading ? "Uploading..." : "Upload Images"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Embed Map (iframe src URL)
                  </label>
                  <div className="relative">
                    <MapPin
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      value={form.embed_map}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, embed_map: e.target.value }))
                      }
                      className="input-modern pl-10"
                      placeholder="https://maps.google.com/..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="primary-btn flex items-center gap-2"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : editingId ? (
                    "Update Event"
                  ) : (
                    "Create Event"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setShowRegistrations(false);
                    setEditingId(null);
                    setForm({ ...defaultForm });
                  }}
                  className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : showRegistrations ? (
            <div className="space-y-6">
              <div className="relative max-w-sm">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={regSearch}
                  onChange={(e) => setRegSearch(e.target.value)}
                  placeholder="Search registrations..."
                  className="input-modern pl-10"
                />
              </div>

              {registrations.length === 0 ? (
                <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                  <Users size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No registrations yet</p>
                </div>
              ) : selectedReg ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                      Registration Detail
                    </h3>
                    <button
                      onClick={() => setSelectedReg(null)}
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Back to list
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6 text-sm">
                    <div>
                      <span className="text-gray-400 block">Event</span>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">
                        {selectedReg.events?.title || "Unknown"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Team Name</span>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">
                        {selectedReg.team_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Leader Name</span>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">
                        {selectedReg.leader_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Leader Phone</span>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">
                        {selectedReg.leader_phone}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Leader Email</span>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">
                        {selectedReg.leader_email}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">University</span>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">
                        {selectedReg.university}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Member Count</span>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">
                        {selectedReg.member_count}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Registered At</span>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">
                        {new Date(selectedReg.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {Array.isArray(selectedReg.members) && selectedReg.members.length > 0 && (
                      <div className="md:col-span-2">
                        <span className="text-gray-400 block mb-2">Team Members</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedReg.members.map((m, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-medium"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedReg.notes && (
                      <div className="md:col-span-2">
                        <span className="text-gray-400 block">Notes</span>
                        <p className="text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-line">
                          {selectedReg.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left bg-white dark:bg-slate-800 rounded-2xl shadow-xl">
                    <thead className="border-b border-gray-200 dark:border-gray-700">
                      <tr className="text-gray-600 dark:text-gray-400">
                        <th className="px-4 py-3 font-medium">Event</th>
                        <th className="px-4 py-3 font-medium">Team</th>
                        <th className="px-4 py-3 font-medium">Leader</th>
                        <th className="px-4 py-3 font-medium">Phone</th>
                        <th className="px-4 py-3 font-medium">Members</th>
                        <th className="px-4 py-3 font-medium">University</th>
                        <th className="px-4 py-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations
                        .filter(
                          (r) =>
                            !regSearch ||
                            r.team_name
                              .toLowerCase()
                              .includes(regSearch.toLowerCase()) ||
                            r.leader_name
                              .toLowerCase()
                              .includes(regSearch.toLowerCase()) ||
                            r.university
                              .toLowerCase()
                              .includes(regSearch.toLowerCase())
                        )
                        .map((reg) => (
                          <tr
                            key={reg.id}
                            onClick={() => setSelectedReg(reg)}
                            className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition cursor-pointer"
                          >
                            <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                              {reg.events?.title || "Unknown"}
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                              {reg.team_name}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                              {reg.leader_name}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                              {reg.leader_phone}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                              {reg.member_count}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                              {reg.university}
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs">
                              {new Date(
                                reg.created_at
                              ).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-6">
              <div className="relative max-w-sm">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events..."
                  className="input-modern pl-10"
                />
              </div>

              {filteredEvents.length === 0 ? (
                <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                  <Clock size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">
                    {searchQuery
                      ? "No events match your search"
                      : "No events yet"}
                  </p>
                  <button
                    onClick={() => {
                      setForm({ ...defaultForm });
                      setEditingId(null);
                      setShowForm(true);
                      setShowRegistrations(false);
                    }}
                    className="primary-btn mt-4"
                  >
                    Create your first event
                  </button>
                </div>
              ) : (
                filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 flex flex-col md:flex-row gap-6"
                  >
                    {event.images?.[0] && (
                      <img
                        src={event.images[0]}
                        alt={event.title}
                        className="w-full md:w-48 h-32 object-cover rounded-xl"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                            {event.title}
                          </h3>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className="text-xs font-medium px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                              {event.category}
                            </span>
                            {event.event_type && (
                              <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400">
                                {event.event_type}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleEdit(event)}
                            className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 hover:bg-blue-200 transition"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-600 hover:bg-red-200 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm line-clamp-2">
                        {event.short_description}
                      </p>
                      <div className="mt-3 flex items-center gap-4 text-sm text-gray-400">
                        <span>
                          {parseLocalDate(event.event_date).toLocaleDateString()}
                        </span>
                        <span>{event.images?.length || 0} images</span>
                        {event.event_end_date && (
                          <span>
                            Ends{" "}
                            {parseLocalDate(
                              event.event_end_date
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
