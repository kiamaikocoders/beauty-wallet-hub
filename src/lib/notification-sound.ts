let chime: HTMLAudioElement | null = null;

/** Short chime when a notice arrives while the app is open. */
export function playNotificationSound() {
  if (typeof window === "undefined") return;
  if (!chime) {
    chime = new Audio("/sounds/notification.wav");
    chime.preload = "auto";
    chime.volume = 0.65;
  }
  chime.currentTime = 0;
  void chime.play().catch(() => {
    /* Autoplay can block until the member has tapped the page. */
  });
}
