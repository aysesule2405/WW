import Phaser from "phaser";

const gameplayFontFamily = 'Waterlily, Georgia, serif';

type GameAPI = {
  start: () => void;
  stop: () => void;
  destroy: () => void;
};

type GameOptions = {
  onGameEnd?: (score: number) => void;
};

class CatchWindSpritesScene extends Phaser.Scene {
  private readonly onGameEnd?: (score: number) => void;
  private score = 0;
  private timeLeftMs = 60_000;
  private running = false;

  private scoreText?: Phaser.GameObjects.Text;
  private timerText?: Phaser.GameObjects.Text;
  private hintText?: Phaser.GameObjects.Text;

  private spawnEvent?: Phaser.Time.TimerEvent;
  private tickEvent?: Phaser.Time.TimerEvent;
  // Difficulty tuning - easy places to tweak game balance
  private spawnConfig = {
    // how often (ms) a spirit appears at the very start
    initialInterval: 2000,
    // lower bound for spawn interval (ms)
    minInterval: 700,
    // how much to reduce the spawn interval each ramp tick (ms)
    rampStep: 80,
    // small jitter applied to each spawn so rhythm feels organic
    jitter: 150,
    // how often to apply the ramp (ms)
    rampTick: 3000,
  };
  private moveConfig = {
    // base horizontal travel duration at start (ms) - larger = slower movement
    baseDuration: 7800,
    // minimum travel duration (ms) to keep things beatable
    minDuration: 3600,
    // how much to reduce travel duration each ramp tick (ms)
    durationStep: 220,
    // additional random variability per sprite (ms)
    randomRange: 1800,
  };
  private currentSpawnInterval = 1400;
  private currentMoveBase = 6000;
  // debug UI element (DOM) for live tuning
  private debugPanel?: HTMLDivElement;
  // visual indicator for difficulty (subtle glow overlay)
  private glowRect?: Phaser.GameObjects.Rectangle;
  private startContainer?: Phaser.GameObjects.Container;
  private gameOverContainer?: Phaser.GameObjects.Container;
  // WebAudio context for simple sound effects (pop chime)
  private audioCtx?: AudioContext;
  private masterGain?: GainNode;

  private playPop() {
    if (!this.audioCtx || !this.masterGain) return;

    // create a short two-oscillator chime with an envelope
    const now = this.audioCtx.currentTime;
    const osc1 = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.value = 880; // A5
    osc2.frequency.value = 1320; // E6 for a harmonic

    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(1.0, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now + 0.005);
    osc1.stop(now + 0.18);
    osc2.stop(now + 0.18);
  }

  constructor(options?: GameOptions) {
    super("catch-wind-sprites");
    this.onGameEnd = options?.onGameEnd;
  }

  preload() {
    this.load.image("spirit-1", "/assets/sprites/wind-spirit-1.png");
    this.load.image("spirit-2", "/assets/sprites/wind-spirit-2.png");
    this.load.image("spirit-3", "/assets/sprites/wind-spirit-3.png");
    this.load.image("spirit-gold", "/assets/sprites/wind-spirit-gold.png");
    this.load.image("bg", "/assets/backgrounds/spirit-drift/game-bg.png");
  }

  create() {
    const { width, height } = this.scale;

    const bg = this.add.image(width / 2, height / 2, "bg");
    bg.setDepth(-1000);
    bg.setScrollFactor(0);

    const scaleX = width / bg.width;
    const scaleY = height / bg.height;
    const scale = Math.max(scaleX, scaleY); // cover entire canvas
    bg.setScale(scale);

  // create UI elements and helpers
  this.createUI(width, height);

    // Miss penalty (clicking empty space)
    this.input.on(
      "pointerdown",
      (_p: Phaser.Input.Pointer, objs: Phaser.GameObjects.GameObject[]) => {
        if (!this.running) return;
        if (objs.length === 0) {
          this.score = Math.max(0, this.score - 1);
          this.scoreText?.setText(`Score: ${this.score}`);
        }
      }
    );
  }

  // Create UI, debug panel, audio, and start/game-over containers
  private createUI(width: number, height: number) {
    // Heading and hint
    this.add
      .text(width / 2, 120, "Catch the Wind Sprites", {
        fontFamily: gameplayFontFamily,
        fontSize: "56px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.hintText = this.add
      .text(width / 2, 160, "Click Start below to begin", {
        fontFamily: gameplayFontFamily,
        fontSize: "30px",
        color: "#c7d2fe",
      })
      .setOrigin(0.5);

    this.scoreText = this.add.text(26, 22, "Score: 0", {
      fontFamily: gameplayFontFamily,
      fontSize: "34px",
      color: "#ffffff",
    });
    this.scoreText.setStroke('#000000', 6);

    this.timerText = this.add
      .text(width - 26, 22, "01:00", {
        fontFamily: gameplayFontFamily,
        fontSize: "34px",
        color: "#ffffff",
      })
      .setOrigin(1, 0);
    this.timerText.setStroke('#000000', 6);

    this.glowRect = this.add
      .rectangle(width / 2, height / 2, width + 200, height + 200, 0x7c3aed, 0.0)
      .setDepth(-500);

    // Debug panel
    this.debugPanel = document.createElement('div');
    this.debugPanel.style.position = 'fixed';
    this.debugPanel.style.right = '14px';
    this.debugPanel.style.top = '14px';
    this.debugPanel.style.background = 'rgba(0,0,0,0.6)';
    this.debugPanel.style.color = '#fff';
    this.debugPanel.style.padding = '8px';
    this.debugPanel.style.fontSize = '12px';
    this.debugPanel.style.fontFamily = 'monospace';
    this.debugPanel.style.borderRadius = '6px';
    this.debugPanel.style.zIndex = '9999';
    this.debugPanel.style.display = 'none';

    const makeRange = (label: string, min: number, max: number, step: number, value: number, onChange: (v: number) => void) => {
      const wrapper = document.createElement('div');
      wrapper.style.marginBottom = '6px';
      const lab = document.createElement('div');
      lab.textContent = label;
      lab.style.marginBottom = '4px';
      const input = document.createElement('input');
      input.type = 'range';
      input.min = String(min);
      input.max = String(max);
      input.step = String(step);
      input.value = String(value);
      input.oninput = () => onChange(Number(input.value));
      wrapper.appendChild(lab);
      wrapper.appendChild(input);
      return wrapper;
    };

    this.debugPanel.appendChild(
      makeRange('Spawn Interval', 500, 3000, 50, this.spawnConfig.initialInterval, (v) => (this.spawnConfig.initialInterval = v))
    );
    this.debugPanel.appendChild(
      makeRange('Min Interval', 300, 1500, 50, this.spawnConfig.minInterval, (v) => (this.spawnConfig.minInterval = v))
    );
    this.debugPanel.appendChild(
      makeRange('Spawn Ramp', 10, 300, 5, this.spawnConfig.rampStep, (v) => (this.spawnConfig.rampStep = v))
    );
    this.debugPanel.appendChild(
      makeRange('Move Base', 3000, 12000, 200, this.moveConfig.baseDuration, (v) => (this.moveConfig.baseDuration = v))
    );
    this.debugPanel.appendChild(
      makeRange('Move Step', 20, 800, 20, this.moveConfig.durationStep, (v) => (this.moveConfig.durationStep = v))
    );

    document.body.appendChild(this.debugPanel);
    this.input.keyboard?.on('keydown-D', () => {
      if (!this.debugPanel) return;
      this.debugPanel.style.display = this.debugPanel.style.display === 'none' ? 'block' : 'none';
    });

    // audio context (guarded, typed) - some browsers provide webkitAudioContext
  const win = window as unknown as { AudioContext?: unknown; webkitAudioContext?: unknown };
  const AudioCtor = win.AudioContext ?? win.webkitAudioContext;
    if (typeof AudioCtor === 'function') {
      try {
        this.audioCtx = new (AudioCtor as unknown as { new (): AudioContext })();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.value = 0.18;
        this.masterGain.connect(this.audioCtx.destination);
      } catch {
        this.audioCtx = undefined;
        this.masterGain = undefined;
      }
    } else {
      this.audioCtx = undefined;
      this.masterGain = undefined;
    }

    // Start screen
    const title = this.add
      .text(width / 2, height / 2 - 60, 'Catch the Wind Sprites', {
        fontFamily: gameplayFontFamily,
        fontSize: '72px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const startBtn = this.add
      .text(width / 2, height / 2 + 10, 'Start', {
        fontFamily: gameplayFontFamily,
        fontSize: '42px',
        color: '#111827',
        backgroundColor: '#a78bfa',
        padding: { x: 20, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    startBtn.on('pointerdown', () => {
      this.startContainer?.setVisible(false);
      this.startGame();
    });

    this.startContainer = this.add.container(0, 0, [title, startBtn]);

    // Game over UI
    const overTitle = this.add
      .text(width / 2, height / 2 - 60, 'Game Over', {
        fontFamily: gameplayFontFamily,
        fontSize: '68px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const finalScoreText = this.add
      .text(width / 2, height / 2 - 10, 'Final Score: 0', {
        fontFamily: gameplayFontFamily,
        fontSize: '40px',
        color: '#c7d2fe',
      })
      .setOrigin(0.5);

    const restartBtn = this.add
      .text(width / 2, height / 2 + 40, 'Restart', {
        fontFamily: gameplayFontFamily,
        fontSize: '38px',
        color: '#111827',
        backgroundColor: '#93c5fd',
        padding: { x: 18, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    restartBtn.on('pointerdown', () => {
      this.gameOverContainer?.setVisible(false);
      this.startGame();
    });

    this.gameOverContainer = this.add.container(0, 0, [overTitle, finalScoreText, restartBtn]);
    this.gameOverContainer.setVisible(false);

  }

  // Public compatibility method (keeps existing API)
  startRun() {
    this.startGame();
  }

  // (stopRun is mapped later) 

  // Start the game: initialize state, spawn scheduler, and timer
  private startGame() {
    if (this.running) return;

    this.running = true;
    this.score = 0;
    this.timeLeftMs = 60_000;
    this.scoreText?.setText("Score: 0");
    this.timerText?.setText("01:00");
    this.hintText?.setText("Catch as many as you can!");

    // hide start UI
    this.startContainer?.setVisible(false);

    this.spawnEvent?.remove(false);
    this.tickEvent?.remove(false);

    // initialize runtime difficulty values
    this.currentSpawnInterval = this.spawnConfig.initialInterval;
    this.currentMoveBase = this.moveConfig.baseDuration;

    const scheduleSpawner = () => {
      this.spawnEvent?.remove(false);
      const jitter = Math.random() * this.spawnConfig.jitter * 2 - this.spawnConfig.jitter;
      const delay = Math.max(500, this.currentSpawnInterval + jitter);
      this.spawnEvent = this.time.addEvent({
        delay,
        loop: true,
        callback: () => this.spawnSpirit(),
      });
    };

    scheduleSpawner();

    const rampEvent = this.time.addEvent({
      delay: this.spawnConfig.rampTick,
      loop: true,
      callback: () => {
        if (!this.running) return;
        this.currentSpawnInterval = Math.max(
          this.spawnConfig.minInterval,
          this.currentSpawnInterval - this.spawnConfig.rampStep - Math.random() * 20
        );
        this.currentMoveBase = Math.max(
          this.moveConfig.minDuration,
          this.currentMoveBase - this.moveConfig.durationStep
        );
        scheduleSpawner();
      },
    });

    this.tickEvent = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => this.updateTimer(rampEvent),
    });
  }

  // Public stop mapped to endGame for compatibility
  stopRun() {
    this.endGame(true);
  }

  private endGame(manual = false) {
    this.running = false;
    this.spawnEvent?.remove(false);
    this.tickEvent?.remove(false);

    // Clear remaining sprites (optional)
    this.children.list
      .filter(
        (c): c is Phaser.GameObjects.GameObject =>
          c instanceof Phaser.GameObjects.GameObject &&
          typeof c.getData === "function" &&
          c.getData("isSprite")
      )
      .forEach((c) => c.destroy());

    this.hintText?.setText(manual ? `Stopped. Final score: ${this.score}` : `Time! Final score: ${this.score} — Click Start to play again`);

    if (!manual && this.onGameEnd) {
      this.time.delayedCall(150, () => this.onGameEnd?.(this.score));
      return;
    }

    // show game over UI
    if (this.gameOverContainer) {
      const finalScore = this.gameOverContainer.list[1] as Phaser.GameObjects.Text;
      finalScore.setText(`Final Score: ${this.score}`);
      this.gameOverContainer.setVisible(true);
    }

    // show start prompt again
    this.startContainer?.setVisible(true);
  }

  private pickSpirit(): {
    key: string;
    points: number;
    scale: number;
    isGold: boolean;
  } {
    // 3% chance gold (adjust as you like)
    const roll = Math.random();

    if (roll < 0.03) {
      // gold is still special by points, but use the same visual scale as commons
      return { key: "spirit-gold", points: 5, scale: 0.84, isGold: true };
    }

    // common pool (only use loaded textures)
    // Slightly larger base scale so sprites are easier to see
    const commons = [
      { key: "spirit-1", points: 1, scale: 0.84, isGold: false },
      { key: "spirit-2", points: 1, scale: 0.84, isGold: false },
      { key: "spirit-3", points: 1, scale: 0.84, isGold: false },
    ].filter((s) => this.textures.exists(s.key));

    return commons[Math.floor(Math.random() * commons.length)];
  }

  private spawnSpirit() {
    const { width, height } = this.scale;

    const fromLeft = Math.random() < 0.5;
    const x = fromLeft ? -40 : width + 40;
    const y = 120 + Math.random() * (height - 180);

    const chosen = this.pickSpirit();

  // Start with the same initial alpha for all spirits so visuals match
  const initialAlpha = 0.45;
  const spirit = this.add.image(x, y, chosen.key).setScale(chosen.scale).setAlpha(initialAlpha);

    // Flip horizontally depending on which side it spawns from
    spirit.setFlipX(!fromLeft);

    spirit.setData("isSprite", true);
    spirit.setData("points", chosen.points);
    spirit.setData("isGold", chosen.isGold);
  // gold sprites will use the same fade-in tween above so they appear smoothly
    spirit.setInteractive({ useHandCursor: true });

    // faster fade-in to full (or near-full) visibility
    this.tweens.add({
      targets: spirit,
      alpha: 1,
      duration: 160,
      ease: "Sine.out",
    });

    // gentle pulse (same for all spirits)
    this.tweens.add({
      targets: spirit,
      // slightly larger pulses to aid visibility but still subtle
      scale: chosen.scale * 1.09,
      yoyo: true,
      repeat: -1,
      duration: 2200,
      ease: "Sine.inOut",
    });

    // subtle floating motion (vertical) to give a soft magical drift
    this.tweens.add({
      targets: spirit,
      y: spirit.y + (Math.random() > 0.5 ? 8 : -8),
      yoyo: true,
      repeat: -1,
      duration: 3000 + Math.random() * 2000,
      ease: 'Sine.inOut',
    });

  spirit.on("pointerdown", () => this.handleSpiritClick(spirit));

    const targetX = fromLeft ? width + 80 : -80;

    // gold floats a bit slower (feels special)
  // Movement duration depends on current difficulty; smaller = faster movement
  const baseDuration = this.currentMoveBase + Math.random() * this.moveConfig.randomRange;
  const duration = Math.max(this.moveConfig.minDuration, baseDuration);

    this.tweens.add({
      targets: spirit,
      x: targetX,
  // limit vertical jitter so sprites move smoothly
  y: y + (Math.random() * 60 - 30),
  // keep a reasonably high minimum alpha during flight so sprites stay visible
  alpha: 0.85,
      duration,
      ease: "Sine.inOut",
      onComplete: () => spirit.destroy(),
    });
  }

  // Handle clicks on a spirit: play sound, award points, animate feedback
  private handleSpiritClick(spirit: Phaser.GameObjects.Image) {
    if (!this.running) return;
    this.playPop();
    const pts = Number(spirit.getData("points") ?? 1);
    this.score += pts;

    this.scoreText?.setText(`Score: ${this.score}`);
    this.tweens.add({
      targets: this.scoreText,
      scale: 1.12,
      yoyo: true,
      duration: 220,
      ease: 'Cubic.out',
    });

    this.tweens.add({
      targets: spirit,
      scale: spirit.scale * 1.5,
      alpha: 0,
      duration: 220,
      ease: "Back.easeOut",
      onComplete: () => spirit.destroy(),
    });
  }

  private updateTimer(rampEvent: Phaser.Time.TimerEvent) {
    this.timeLeftMs -= 100;
    if (this.timeLeftMs <= 0) {
      rampEvent.remove(false);
      this.endGame();
      return;
    }
    this.timerText?.setText(this.formatTime(this.timeLeftMs));
    if (this.glowRect) {
      const elapsed = 60000 - this.timeLeftMs;
      const progress = Phaser.Math.Clamp(elapsed / 60000, 0, 1);
      const alpha = 0.02 + progress * 0.14;
      this.glowRect.setFillStyle(0x7c3aed, alpha);
    }
  }

  private formatTime(ms: number) {
    const totalSec = Math.ceil(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
}

export function createGame(parent: HTMLDivElement, options?: GameOptions): GameAPI {
  const scene = new CatchWindSpritesScene(options);

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent,
    scale: {
      width: 1920,
      height: 1080,
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    backgroundColor: "#0b1020",
    scene: [scene],
  };

  const game = new Phaser.Game(config);

  // The Phaser scene lifecycle runs asynchronously after the Game is created.
  // If `start()` is called before the scene's `create()` has run then
  // `this.time` (and other scene systems) may be undefined and will throw.
  // Create a small readiness promise that resolves once the scene emits
  // its internal 'create' event. We poll until `scene.sys.events` exists
  // (this becomes available very shortly after Game construction).
  const ready = new Promise<void>((resolve) => {
    const attach = () => {
      try {
        if (scene.sys && scene.sys.events && typeof scene.sys.events.once === 'function') {
          // Listen once for the scene's create lifecycle to complete
          scene.sys.events.once('create', () => {
            // emit a small debug trace so runtime logs show mounting order
            console.log('createGame: scene create event fired');
            resolve();
          });
          return;
        }
      } catch {
        // fall through and retry briefly
      }
      // Retry on the next frame; this is cheap and robust in dev
      setTimeout(attach, 16);
    };
    attach();
  });

  return {
    start: () => {
      // Defer calling into the scene until it's fully initialized.
      ready.then(() => scene.startRun()).catch((err) => {
        console.error('createGame: start() failed after ready:', err);
      });
    },
    stop: () => scene.stopRun(),
    destroy: () => game.destroy(true),
  };
}
