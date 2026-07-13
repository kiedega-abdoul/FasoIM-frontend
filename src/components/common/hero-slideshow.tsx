import { useEffect, useState } from "react"

import photo1 from "@/assets/foto1.jpeg"
import photo2 from "@/assets/foto2.jpeg"
import photo3 from "@/assets/foto3.jpg"
import photo4 from "@/assets/foto4.avif"
import photo5 from "@/assets/foto5.jpeg"
import { cn } from "@/lib/utils"

const slides = [
  { src: photo1, alt: "Participants à une activité d’immersion patriotique" },
  { src: photo2, alt: "Accueil et organisation d’une session d’immersion" },
  { src: photo3, alt: "Vie collective dans un centre d’immersion" },
  { src: photo4, alt: "Activité organisée pendant une session d’immersion" },
  { src: photo5, alt: "Participants réunis pendant l’immersion patriotique" },
]

const CHANGE_DELAY = 5000

export function HeroSlideshow() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length)
    }, CHANGE_DELAY)

    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-slate-950">
      {slides.map((slide, index) => (
        <img
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-in-out",
            index === activeIndex
              ? "scale-100 opacity-100"
              : "pointer-events-none scale-105 opacity-0",
          )}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/25" />

      <div
        className="absolute inset-x-0 bottom-6 z-10 flex justify-center gap-2"
        aria-label="Sélection de l’image"
      >
        {slides.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`Afficher l’image ${index + 1}`}
            aria-current={index === activeIndex}
            onClick={() => setActiveIndex(index)}
            className={cn(
              "h-2.5 rounded-full border border-white/80 bg-white/55 shadow-sm transition-all",
              index === activeIndex ? "w-8 bg-white" : "w-2.5 hover:bg-white/85",
            )}
          />
        ))}
      </div>
    </div>
  )
}
