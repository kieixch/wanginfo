"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import Image from "next/image";

const slides = [
  { src: "/hero/Seminar1.jpg", alt: "seminar" },
  { src: "/hero/Seminar2.jpg", alt: "seminar" },
  { src: "/hero/game.jpg", alt: "tournament" },
  { src: "/hero/soccer.jpg", alt: "tournament" },
  { src: "/hero/fighters.jpg", alt: "tournament" },
  { src: "/hero/tennis.jpg", alt: "tournament" },
];

export default function Hero() {
  return (
    <section className="min-h-[80vh] md:min-h-[90vh] flex flex-col-reverse md:grid md:grid-cols-2 gap-6 md:gap-10 items-center px-5 md:px-16 py-12 md:py-20">
      <div className="text-center md:text-left">
        <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold leading-tight text-gray-800 dark:text-white">
          Get Information About Seminars & Campus Events
        </h1>
        <p className="mt-3 md:mt-6 text-gray-500 dark:text-gray-400 text-sm md:text-lg leading-relaxed">
          Find the latest seminars, competitions, workshops, and student
          activities easily.
        </p>
        <a
          href="#informations"
          className="primary-btn mt-4 md:mt-10 inline-flex items-center justify-center gap-1.5 w-full sm:w-auto text-sm md:text-base"
        >
          Explore Now
        </a>
      </div>

      <div className="w-full">
        <Swiper
          modules={[Autoplay]}
          spaceBetween={20}
          slidesPerView={1}
          loop={true}
          autoplay={{ delay: 3000 }}
        >
          {slides.map((slide, i) => (
            <SwiperSlide key={i}>
              <Image
                src={slide.src}
                alt={slide.alt}
                width={700}
                height={500}
                className="rounded-3xl w-full h-[180px] sm:h-[280px] md:h-[500px] object-cover"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
