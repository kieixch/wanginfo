import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Footer from "./components/Footer";
import EventList from "./components/EventList";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />

      <section id="informations" className="px-6 md:px-10 py-10 max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-10 text-gray-800 dark:text-white">
          Informations
        </h1>
        <EventList />
      </section>

      <Footer />
    </main>
  );
}
