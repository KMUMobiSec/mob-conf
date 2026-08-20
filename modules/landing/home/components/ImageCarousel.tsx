"use client";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import { useRef } from "react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

const images = [
  { src: "/assets/images/1.jpg", alt: "EBISION Conference 1" },
  { src: "/assets/images/2.jpg", alt: "EBISION Conference 2" },
  { src: "/assets/images/3.jpg", alt: "EBISION Conference 3" },
  { src: "/assets/images/4.jpg", alt: "EBISION Conference 4" },
  { src: "/assets/images/5.jpg", alt: "EBISION Conference 5" },
  { src: "/assets/images/6.jpg", alt: "EBISION Conference 6" },
  { src: "/assets/images/7.jpg", alt: "EBISION Conference 7" },
  { src: "/assets/images/8.jpg", alt: "EBISION Conference 8" },
];

const ImageCarousel = () => {
  const autoplayPlugin = useRef(Autoplay({ delay: 4000 }));

  return (
    <Carousel
      className="w-full h-full rounded-lg overflow-hidden"
      plugins={[autoplayPlugin.current]}
      opts={{
        align: "center",
        loop: true,
      }}
    >
      <CarouselContent>
        {images.map((image, index) => (
          <CarouselItem key={index}>
            <Image
              src={image.src}
              alt={image.alt}
              width={1000}
              height={1000}
              className="w-full h-[280px] sm:h-[400px] lg:h-[560px] object-cover rounded-lg"
            />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
};

export default ImageCarousel;
