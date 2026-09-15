"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  targetX: number;
  targetY: number;
}

const COLORS = [
  "#a855f7",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#8b5cf6",
];

export function Confetti({ trigger, duration = 3000 }: { trigger: boolean; duration?: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      const newParticles: Particle[] = Array.from({ length: 45 }, (_, i) => {
        const startX = window.innerWidth / 2 + (Math.random() - 0.5) * 100;
        const startY = window.innerHeight * 0.35;
        const angle = Math.random() * Math.PI * 2;
        const velocity = 150 + Math.random() * 300;
        return {
          id: i,
          x: startX,
          y: startY,
          size: 6 + Math.random() * 6,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rotation: Math.random() * 360,
          targetX: startX + Math.cos(angle) * velocity,
          targetY: startY + Math.sin(angle) * velocity + 200,
        };
      });

      setParticles(newParticles);
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [trigger, duration]);

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                x: p.x,
                y: p.y,
                scale: 0.8,
                rotate: 0,
                opacity: 1,
              }}
              animate={{
                x: p.targetX,
                y: p.targetY,
                rotate: p.rotation * 3,
                scale: [1, 1.2, 0.4],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: duration / 1000,
                ease: "easeOut",
              }}
              style={{
                position: "absolute",
                width: p.size,
                height: p.size * (p.id % 2 === 0 ? 1 : 1.6),
                backgroundColor: p.color,
                borderRadius: p.id % 3 === 0 ? "50%" : "2px",
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
