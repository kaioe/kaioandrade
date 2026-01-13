'use client';

import CinematicThemeSwitcher from '@/components/ui/cinematic-theme-switcher';

export default function Demo() {
  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#1d1e1f] transition-colors duration-700 ease-in-out">
      <div className="flex min-h-screen items-center justify-center transition-colors duration-700 ease-in-out">
        <CinematicThemeSwitcher />
      </div>
    </div>
  );
}
