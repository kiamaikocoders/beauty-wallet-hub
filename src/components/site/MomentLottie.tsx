import { useEffect, useRef, useState, type ComponentType, type Ref } from "react";
import calendar from "@/assets/lottie/calendar.json";
import check from "@/assets/lottie/check.json";
import gift from "@/assets/lottie/gift.json";
import star from "@/assets/lottie/star.json";

const CLIPS = { calendar, check, gift, star } as const;

export type MomentName = keyof typeof CLIPS;

type Handle = {
  play: () => void;
  seek: (target: { percent: number }) => void;
};

type PlayerProps = {
  src: object;
  loop: false;
  autoplay: true;
  className?: string;
  style: { width: number; height: number };
  "aria-hidden": true;
  lottieRef: Ref<Handle>;
  subscriptions: { ready: () => void };
};

/**
 * Plays one short brand animation, then holds the last frame.
 * Loaded in the browser because the Lottie engine needs a DOM.
 */
export function MomentLottie({
  name,
  size = 72,
  className,
}: {
  name: MomentName;
  size?: number;
  className?: string;
}) {
  const [Player, setPlayer] = useState<ComponentType<PlayerProps> | null>(null);
  const handle = useRef<Handle>(null);
  const reduceMotion = useRef(false);
  if (typeof window !== "undefined") {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  const subscriptions = useRef({
    ready: () => {
      const player = handle.current;
      if (reduceMotion.current) player?.seek({ percent: 100 });
      else player?.play();
    },
  }).current;

  useEffect(() => {
    let live = true;
    void import("lottie-react").then((mod) => {
      if (live) setPlayer(() => mod.Lottie as ComponentType<PlayerProps>);
    });
    return () => {
      live = false;
    };
  }, []);

  const style = { width: size, height: size };
  if (!Player) return <span className={className} style={style} aria-hidden />;

  return (
    <Player
      src={CLIPS[name]}
      loop={false}
      autoplay
      style={style}
      aria-hidden
      lottieRef={handle}
      subscriptions={subscriptions}
      {...(className ? { className } : {})}
    />
  );
}
