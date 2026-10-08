type Listener = (t: number) => void;

const listeners = new Set<Listener>();
let running = false;
let time = 0;

function frame(now: number) {
  time = now / 1000;
  listeners.forEach((fn) => fn(time));
  if (listeners.size > 0) requestAnimationFrame(frame);
  else running = false;
}

export function subscribeClock(fn: Listener) {
  listeners.add(fn);
  if (!running) {
    running = true;
    requestAnimationFrame(frame);
  }
  return () => {
    listeners.delete(fn);
  };
}

export function clockNow() {
  return time;
}
