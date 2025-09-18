"use client";

import { useState, useEffect, useRef, TouchEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const BANNERS = ["/banner1.svg", "/banner2.svg", "/banner3.svg"];

export default function BannerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? BANNERS.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === BANNERS.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = startX - currentX;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    if (dragOffset > 50) {
      goToNext();
    } else if (dragOffset < -50) {
      goToPrevious();
    }

    setIsDragging(false);
    setDragOffset(0);
  };

  // Auto slide every 5 seconds
  useEffect(() => {
    if (isDragging) return;
    const timer = setInterval(goToNext, 5000);
    return () => clearInterval(timer);
  }, [isDragging]);

  return (
    <div
      className="relative w-full h-[40vh] overflow-hidden rounded-lg select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      ref={containerRef}
    >
      {/* Banner Images */}
      <div
        className="flex transition-transform duration-300 ease-out h-full touch-pan-x"
        style={{
          transform: `translateX(calc(-${
            currentIndex * 100
          }% + ${-dragOffset}px))`,
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        {BANNERS.map((banner, index) => (
          <div key={index} className="flex-shrink-0 w-full h-full">
            <div className="relative w-full h-full">
              <Image
                src={banner}
                alt={`Banner ${index + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                priority={index === 0}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition-colors"
        aria-label="Previous banner"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition-colors"
        aria-label="Next banner"
      >
        <ChevronRight size={24} />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {BANNERS.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? "bg-white" : "bg-white/50"
            }`}
            aria-label={`Go to banner ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
