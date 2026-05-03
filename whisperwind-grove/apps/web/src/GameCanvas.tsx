import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { createGame } from "./game/createGame";

export type GameCanvasHandle = {
  start: () => void;
  stop: () => void;
};

const GameCanvas = forwardRef<GameCanvasHandle>(function GameCanvas(_props, ref) {
  const hostRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<ReturnType<typeof createGame> | null>(null);

  useImperativeHandle(ref, () => ({
    start: () => apiRef.current?.start(),
    stop: () => apiRef.current?.stop(),
  }));

  useEffect(() => {
    if (!hostRef.current) return;
    apiRef.current = createGame(hostRef.current);
    return () => {
      apiRef.current?.destroy();
      apiRef.current = null;
    };
  }, []);

  return (
    <div
      ref={hostRef}
      style={{
        width: 900,
        height: 520,
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
      }}
    />
  );
});

export default GameCanvas;
