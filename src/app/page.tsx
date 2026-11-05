"use client";

import { SleepProvider } from "@/components/sleep-provider";
import { NightSky } from "@/components/night-sky";
import { CursorGlow } from "@/components/cursor-glow";
import { ImmersiveShell } from "@/components/immersive-shell";
import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { SoundLibrary } from "@/components/sound-library";
import StoriesSection from "@/components/stories-section";
import { TimerSection } from "@/components/timer-section";
import AccountSection from "@/components/account-section";
import { SiteFooter } from "@/components/site-footer";
import { MiniPlayer } from "@/components/mini-player";

export default function Home() {
  return (
    <SleepProvider>
      <NightSky />
      <CursorGlow />
      <ImmersiveShell>
        <SiteHeader />
        <main className="flex-1">
          <Hero />
          <SoundLibrary />
          <StoriesSection />
          <TimerSection />
          <AccountSection />
        </main>
        <SiteFooter />
        <MiniPlayer />
      </ImmersiveShell>
    </SleepProvider>
  );
}
