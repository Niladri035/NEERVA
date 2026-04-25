import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function GSAPProvider({ children }) {
  const containerRef = useRef();

  useGSAP(() => {
    // A. SCROLL = OCEAN DEPTH
    // As user scrolls, the background color deepens, and UI slightly compresses
    gsap.to('body', {
      background: 'linear-gradient(135deg, #b2ebf2 0%, #80deea 30%, #4dd0e1 70%, #26c6da 100%)',
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.5,
      }
    });

    // Sections reveal animation (C. SECTION REVEAL)
    const sections = gsap.utils.toArray('.section');
    sections.forEach((sec) => {
      gsap.fromTo(sec, 
        { opacity: 0, y: 80, filter: 'blur(10px)' },
        {
          opacity: 1, 
          y: 0, 
          filter: 'blur(0px)',
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sec,
            start: 'top 85%',
          }
        }
      );
    });

    // D. FLOATING SYSTEM
    gsap.to('.float-loop', {
      y: '-15px',
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });

  }, { scope: containerRef });

  return (
    <div ref={containerRef}>
      {children}
    </div>
  );
}
