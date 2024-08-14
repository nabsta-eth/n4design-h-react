import React from "react";

const HOLD_TIME_MS = 500;
const HOLD_DISTANCE_PIXEL_SQ = 3 ** 2;

type Event =
  | React.PointerEvent<HTMLDivElement>
  | React.TouchEvent<HTMLDivElement>;
type Props = {
  id?: string;
  onClick: (e: Event) => void;
  onHold: (e: Event) => void;
  children: React.ReactNode;
};

const isMouseEvent = (e: Event): e is React.PointerEvent<HTMLDivElement> => {
  return e && "clientX" in e;
};

const Holdable = ({ id, onClick, onHold, children }: Props) => {
  const [timer, setTimer] = React.useState<number | null>(null);
  const [pos, setPos] = React.useState([0, 0]);

  const onPointerDown = (e: Event) => {
    e.persist();
    e.preventDefault();
    e.stopPropagation();
    // detects if a mouse or touch event.
    // touch events can have multiple digits so use the first one.
    const clientX = isMouseEvent(e) ? e.clientX : e.touches[0].clientX;
    const clientY = isMouseEvent(e) ? e.clientY : e.touches[0].clientY;
    setPos([clientX, clientY]); // save position for later
    const timeoutId = window.setTimeout(timesUp.bind(null, e), HOLD_TIME_MS);
    setTimer(timeoutId);
  };

  const onPointerUp = (e: Event) => {
    e.preventDefault();
    if (timer) {
      window.clearTimeout(timer);
      setTimer(null);
      onClick(e);
      setPos([0, 0]);
    }
  };

  const onPointerMove = (e: Event) => {
    e.preventDefault();
    // if no timer then not a hold event
    if (!timer) return;
    // detects if a mouse or touch event.
    // touch events can have multiple digits so use the first one.
    // use the click/touch position and determine if it's been dragged too far
    // from the original position.
    const clientX = isMouseEvent(e) ? e.clientX : e.touches[0].clientX;
    const clientY = isMouseEvent(e) ? e.clientY : e.touches[0].clientY;
    // if total distance of touch area (vert + horiz) moved
    // is greater than threshold then cancel the hold event
    const relativeDistance = (clientX - pos[0]) ** 2 + (clientY - pos[1]) ** 2;
    if (relativeDistance > HOLD_DISTANCE_PIXEL_SQ) {
      setTimer(null);
      window.clearTimeout(timer);
    }
  };

  const timesUp = (e: Event) => {
    setTimer(null);
    onHold(e);
    setPos([0, 0]);
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerMove={onPointerMove}
      id={id}
    >
      {children}
    </div>
  );
};

export default Holdable;
