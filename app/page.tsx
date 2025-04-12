"use client";

import { useState, useEffect } from "react";
import { SplineScene } from "@/components/spline-scene";
import { SplashCursor } from "@/components/splash-cursor";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-r from-violet-1000 via-violet-800 to-violet-1000 monospace">
      <SplashCursor />
      <main className="flex-1 flex flex-col">
        <div className="relative w-full h-screen">
          <div className="absolute inset-0">
            {mounted && (
              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full"
              />
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-10 text-center">
            <h1 className="pp-editorial text-4xl md:text-6xl lg:text-8xl mb-4">
              Be The Builder
            </h1>
          </div>
        </div>
      </main>
    </div>
  );
}
