import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Box, RotateCcw, Truck, Pause, Play } from 'lucide-react';

const COLS = 24;
const ROWS = 15;
const STARTING_TRAIN: Point[] = [{ x: 6, y: 7 }, { x: 5, y: 7 }, { x: 4, y: 7 }];

type Point = { x: number; y: number };
type Direction = 'up' | 'down' | 'left' | 'right';
type GameStatus = 'ready' | 'playing' | 'paused' | 'over';
type GameState = {
  train: Point[];
  cargo: Point;
  direction: Direction;
  status: GameStatus;
  score: number;
};

const movement: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function randomCargo(train: Point[]): Point {
  const open: Point[] = [];
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (!train.some((part) => part.x === x && part.y === y)) open.push({ x, y });
    }
  }
  return open[Math.floor(Math.random() * open.length)] ?? { x: 0, y: 0 };
}

function newGame(status: GameStatus = 'ready'): GameState {
  return {
    train: STARTING_TRAIN.map((part) => ({ ...part })),
    cargo: { x: 15, y: 7 },
    direction: 'right',
    status,
    score: 0,
  };
}

const directionKeys: Record<string, Direction> = {
  ArrowUp: 'up', w: 'up', W: 'up',
  ArrowDown: 'down', s: 'down', S: 'down',
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right',
};

const reverse: Record<Direction, Direction> = {
  up: 'down', down: 'up', left: 'right', right: 'left',
};

export const TruckWagonGame: React.FC = () => {
  const [game, setGame] = useState<GameState>(() => newGame());
  const gameRef = useRef(game);
  const setCurrentGame = useCallback((next: GameState | ((current: GameState) => GameState)) => {
    const updated = typeof next === 'function' ? next(gameRef.current) : next;
    gameRef.current = updated;
    setGame(updated);
  }, []);

  const turn = useCallback((direction: Direction) => {
    const current = gameRef.current;
    if (reverse[current.direction] === direction || current.status === 'over') return;
    setCurrentGame({ ...current, direction });
  }, [setCurrentGame]);

  const startOrResume = () => setCurrentGame((current) => ({ ...current, status: 'playing' }));
  const restart = () => setCurrentGame(newGame('playing'));
  const togglePause = () => setCurrentGame((current) => ({
    ...current,
    status: current.status === 'playing' ? 'paused' : current.status === 'paused' ? 'playing' : current.status,
  }));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const direction = directionKeys[event.key];
      if (direction) {
        event.preventDefault();
        if (gameRef.current.status === 'ready') setCurrentGame((current) => ({ ...current, status: 'playing' }));
        turn(direction);
      } else if (event.code === 'Space') {
        event.preventDefault();
        const current = gameRef.current;
        if (current.status === 'ready') setCurrentGame({ ...current, status: 'playing' });
        else if (current.status === 'playing' || current.status === 'paused') togglePause();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setCurrentGame, togglePause, turn]);

  useEffect(() => {
    if (game.status !== 'playing') return undefined;
    const timer = window.setInterval(() => {
      const current = gameRef.current;
      const vector = movement[current.direction];
      const head = { x: current.train[0].x + vector.x, y: current.train[0].y + vector.y };
      const gotCargo = head.x === current.cargo.x && head.y === current.cargo.y;
      const bodyToCheck = gotCargo ? current.train : current.train.slice(0, -1);
      const crashed = head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS ||
        bodyToCheck.some((part) => part.x === head.x && part.y === head.y);

      if (crashed) {
        setCurrentGame({ ...current, status: 'over' });
        return;
      }

      const train = [head, ...current.train];
      if (!gotCargo) train.pop();
      setCurrentGame({
        ...current,
        train,
        cargo: gotCargo ? randomCargo(train) : current.cargo,
        score: current.score + (gotCargo ? 1 : 0),
        status: train.length === COLS * ROWS ? 'over' : current.status,
      });
    }, Math.max(85, 155 - (game.train.length - STARTING_TRAIN.length) * 3));
    return () => window.clearInterval(timer);
  }, [game.status, game.train.length, setCurrentGame]);

  const truckRotation: Record<Direction, string> = {
    right: 'rotate-0', down: 'rotate-90', left: 'rotate-180', up: '-rotate-90',
  };
  const cellStyle = (point: Point): React.CSSProperties => ({
    left: `${(point.x / COLS) * 100}%`,
    top: `${(point.y / ROWS) * 100}%`,
    width: `${100 / COLS}%`,
    height: `${100 / ROWS}%`,
  });

  return (
    <section className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm" aria-label="Truck and wagon game">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">Road train challenge</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Pick up cargo. Grow your convoy.</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 px-4 py-2 text-center">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-blue-700">Wagons</span>
            <span className="text-xl font-bold tabular-nums text-slate-900">{game.train.length - 1}</span>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-2 text-center">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Cargo</span>
            <span className="text-xl font-bold tabular-nums text-slate-900">{game.score}</span>
          </div>
          <button type="button" onClick={restart} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50" aria-label="Restart game">
            <RotateCcw className="h-4 w-4" /><span className="hidden sm:inline">Restart</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-7">
        <div className="relative mx-auto aspect-[24/15] w-full overflow-hidden rounded-2xl border border-emerald-200 bg-[#edf7ef] shadow-inner" role="img" aria-label={`Game board. ${game.train.length - 1} wagons. ${game.score} cargo collected.`}>
          <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'linear-gradient(to right, rgb(130 170 142 / 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgb(130 170 142 / 0.2) 1px, transparent 1px)', backgroundSize: `${100 / COLS}% ${100 / ROWS}%` }} />
          <div className="absolute inset-x-0 top-1/2 h-[16%] -translate-y-1/2 border-y border-amber-200/70 bg-amber-100/60" />
          <div className="absolute inset-0" aria-hidden="true">
            {game.train.slice(1).map((part, index) => (
              <div key={`${part.x}-${part.y}-${index}`} className="absolute flex items-center justify-center p-[2px]" style={cellStyle(part)}>
                <div className="flex h-full w-full items-center justify-center rounded-md border border-blue-300 bg-blue-100 text-blue-700 shadow-sm">
                  <Box className="h-[70%] w-[70%]" strokeWidth={2.5} />
                </div>
              </div>
            ))}
            {game.train[0] && (
              <div className={`absolute flex items-center justify-center text-blue-700 ${truckRotation[game.direction]}`} style={cellStyle(game.train[0])}>
                <Truck className="h-[90%] w-[90%] drop-shadow-sm" strokeWidth={2.6} />
              </div>
            )}
            <div className="absolute flex items-center justify-center p-[2px]" style={cellStyle(game.cargo)}>
              <div className="flex h-full w-full animate-pulse items-center justify-center rounded-md bg-amber-300 text-amber-900 shadow-sm">
                <Box className="h-[70%] w-[70%]" strokeWidth={2.7} />
              </div>
            </div>
          </div>

          {game.status !== 'playing' && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-[2px]">
              <div className="max-w-sm rounded-2xl border border-white/70 bg-white/95 p-6 text-center shadow-xl">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Truck className="h-6 w-6" /></div>
                <h3 className="text-lg font-semibold text-slate-900">{game.status === 'ready' ? 'Ready to roll?' : game.status === 'paused' ? 'Pit stop' : 'Run complete'}</h3>
                <p className="mt-1 text-sm text-slate-600">{game.status === 'ready' ? 'Collect the glowing cargo to add a wagon. Don’t run into the edge or your own train.' : game.status === 'paused' ? 'Your convoy is waiting.' : `You collected ${game.score} cargo ${game.score === 1 ? 'crate' : 'crates'} and pulled ${game.train.length - 1} wagons.`}</p>
                <button type="button" onClick={game.status === 'over' ? restart : startOrResume} className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
                  {game.status === 'paused' ? <Play className="h-4 w-4" /> : game.status === 'over' ? <RotateCcw className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                  {game.status === 'ready' ? 'Start driving' : game.status === 'paused' ? 'Resume run' : 'Play again'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-slate-500">Steer with <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans text-slate-700">↑ ↓ ← →</kbd> or <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans text-slate-700">W A S D</kbd><span className="hidden sm:inline"> · Space to pause</span></p>
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-3 gap-1" aria-label="Direction controls">
              <span />
              <button type="button" onClick={() => turn('up')} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Steer up"><ArrowUp className="h-4 w-4" /></button>
              <span />
              <button type="button" onClick={() => turn('left')} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Steer left"><ArrowLeft className="h-4 w-4" /></button>
              <button type="button" onClick={togglePause} disabled={game.status === 'ready' || game.status === 'over'} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40" aria-label={game.status === 'playing' ? 'Pause game' : 'Resume game'}><Pause className="h-4 w-4" /></button>
              <button type="button" onClick={() => turn('right')} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Steer right"><ArrowRight className="h-4 w-4" /></button>
              <span />
              <button type="button" onClick={() => turn('down')} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Steer down"><ArrowDown className="h-4 w-4" /></button>
              <span />
            </div>
            <button type="button" onClick={togglePause} disabled={game.status === 'ready' || game.status === 'over'} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 sm:hidden" aria-label={game.status === 'playing' ? 'Pause game' : 'Resume game'}>{game.status === 'playing' ? 'Pause' : 'Resume'}</button>
          </div>
        </div>
      </div>
    </section>
  );
};
