import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              Wanginfo
            </h3>
            <p className="mt-3 text-gray-500 dark:text-gray-400 text-sm">
              Your campus information hub for seminars, events, and student
              activities.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li>
                <Link href="/" className="hover:text-blue-600 transition">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/#informations"
                  className="hover:text-blue-600 transition"
                >
                  Seminars & Events
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
              Contact
            </h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li>University Campus</li>
              <li>Events & Seminar Department</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Wanginfo. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
