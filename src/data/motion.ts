/**
 * Hero video, welcome audio and motion settings – one place to tweak them.
 * Media files live in public/video and public/audio (regenerate with scripts/encode-media.mjs).
 */

export const hero = {
  /** Desktop and mobile renditions; WebM is tried first, MP4 is the fallback. */
  sources: {
    desktop: { webm: '/video/hero.webm', mp4: '/video/hero.mp4' },
    mobile: { webm: '/video/hero-mobile.webm', mp4: '/video/hero-mobile.mp4' },
  },
  /** First frame (empty starfield), shown until the video plays. */
  poster: '/video/hero-poster.webp',
  /** Payoff frame shown instead of the video for prefers-reduced-motion. */
  staticImage: '/video/hero-static.webp',
  width: 1280,
  height: 720,
  /** Viewports narrower than this load the mobile rendition. */
  mobileBreakpoint: 768,
  /** Second of the source video used for the static payoff frame (bar at the top, chart + pin done). */
  payoffTime: 7.6,
  /** Visually hidden description (the video itself is aria-hidden). */
  description: 'Animacja: strona firmy awansuje na pierwsze miejsce w wynikach wyszukiwania',
};

export type AudioMode = 'overlay' | 'sequential';

export const welcomeAudio = {
  /** Opus first, MP3 fallback (chosen with canPlayType, and on decode failure). */
  jingle: { opus: '/audio/jingle.opus', mp3: '/audio/jingle.mp3' },
  voice: { opus: '/audio/powitanie.opus', mp3: '/audio/powitanie.mp3' },
  /**
   * overlay: jingle starts, plays at full level for `introSeconds`, ducks under the voice,
   *          then fades out after the voice ends.
   * sequential: full jingle first, then the voice.
   */
  mode: 'overlay' as AudioMode,
  /** Jingle at 100% before the voice comes in (seconds). The voice starts at this moment. */
  introSeconds: 1.0,
  /** Jingle level while the voice speaks (0–1). */
  duckLevel: 0.25,
  /** Ramp time into the duck (seconds) – short, but long enough to avoid a click. */
  duckRampSeconds: 0.35,
  /** Jingle fade-out after the voice ends (seconds). */
  fadeOutSeconds: 2.0,
  /** Restart the hero video from 0 when the greeting starts, so the bar rises while the voice speaks. */
  restartVideoOnPlay: true,
  /** GA4 event name (sent only after analytics consent). */
  analyticsEvent: 'welcome_audio_play',
  transcript:
    'Dzień dobry, jestem Paweł Bożek. Krasnal SEO – małe zmiany, duże wyniki w Google. Zapraszam do zapoznania się z moją ofertą.',
};

/** Shared motion timing scale (mirrored as CSS custom properties in global.css). */
export const motion = {
  durations: { fast: 200, base: 400, slow: 600, slower: 900 },
  easeOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
  revealStaggerMs: 80,
};
