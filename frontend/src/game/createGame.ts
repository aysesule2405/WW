import Phaser from "phaser";
import { bodyFontFamily, headingFontFamily } from '../theme/typography';

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
  private surgeEvent?: Phaser.Time.TimerEvent;

  // Phases replace the old linear ramp — 3 distinct feels within 60s
  private phases = [
    // Phase 1 — Calm (first 20s): learn the layout, build confidence
    { until: 40_000, spawnInterval: 1800, moveBase: 6800, jitter: 200 },
    // Phase 2 — Flowing (20–45s): build momentum, sustained combo viable
    { until: 15_000, spawnInterval: 1100, moveBase: 5000, jitter: 150 },
    // Phase 3 — Rush (last 15s): controlled chaos, every click counts
    { until: 0,      spawnInterval: 700,  moveBase: 3600, jitter: 80  },
  ];
  private currentPhase = this.phases[0];
  private currentSpawnInterval = 1800;
  private currentMoveBase = 6800;

  private moveConfig = {
    minDuration: 3600,
    randomRange: 1800,
  };

  // Combo state
  private comboCount = 0;
  private multiplier = 1;
  private comboDecayTimer?: Phaser.Time.TimerEvent;

  // Smooth score display
  private displayedScore = 0;
  private targetScore = 0;

  // Phase / event flags
  private finalRushStarted = false;
  private inSurge = false;

  // Debug panel
  private debugPanel?: HTMLDivElement;
  // Subtle glow overlay tied to elapsed time
  private glowRect?: Phaser.GameObjects.Rectangle;
  private startContainer?: Phaser.GameObjects.Container;
  private gameOverContainer?: Phaser.GameObjects.Container;
  // WebAudio context for click sound
  private audioCtx?: AudioContext;
  private masterGain?: GainNode;

  // ---------- audio ----------

  private playPop(multiplier = 1) {
    if (!this.audioCtx || !this.masterGain) return;
    const now = this.audioCtx.currentTime;
    const pitch = 880 * (1 + (multiplier - 1) * 0.15); // rises with combo

    const osc1 = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.value = pitch;
    osc2.frequency.value = pitch * 1.5;

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

  // ---------- helpers ----------

  private showFloatingText(text: string, x: number, y: number, color = '#ffffff') {
    const t = this.add
      .text(x, y, text, {
        fontFamily: bodyFontFamily,
        fontSize: '38px',
        color,
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(200);

    this.tweens.add({
      targets: t,
      y: y - 90,
      alpha: 0,
      duration: 750,
      ease: 'Cubic.out',
      onComplete: () => t.destroy(),
    });
  }

  private breakCombo() {
    this.comboCount = 0;
    this.multiplier = 1;
    this.comboDecayTimer?.remove(false);
    this.comboDecayTimer = undefined;
  }

  private resetComboDecay() {
    this.comboDecayTimer?.remove(false);
    this.comboDecayTimer = this.time.delayedCall(2500, () => this.breakCombo());
  }

  // ---------- lifecycle ----------

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
    bg.setScale(Math.max(scaleX, scaleY));

    this.createUI(width, height);

    // Miss penalty — also breaks combo
    this.input.on(
      'pointerdown',
      (_p: Phaser.Input.Pointer, objs: Phaser.GameObjects.GameObject[]) => {
        if (!this.running) return;
        if (objs.length === 0) {
          this.targetScore = Math.max(0, this.targetScore - 1);
          this.breakCombo();
          this.showFloatingText('−1', _p.worldX, _p.worldY, '#f87171');
        }
      }
    );
  }

  // Smooth score lerp — runs every frame
  update() {
    if (!this.running) return;
    if (this.displayedScore === this.targetScore) return;

    const diff = this.targetScore - this.displayedScore;
    this.displayedScore += Math.sign(diff) * Math.max(1, Math.ceil(Math.abs(diff) * 0.18));
    // Clamp overshoot
    if (Math.sign(this.targetScore - this.displayedScore) !== Math.sign(diff)) {
      this.displayedScore = this.targetScore;
    }
    this.score = this.displayedScore;
    this.scoreText?.setText(`Score: ${this.displayedScore}`);
  }

  // ---------- UI setup ----------

  private createUI(width: number, height: number) {
    this.add
      .text(width / 2, 120, "Catch the Wind Sprites", {
        fontFamily: headingFontFamily,
        fontSize: "56px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.hintText = this.add
      .text(width / 2, 160, "Click Start below to begin", {
        fontFamily: bodyFontFamily,
        fontSize: "30px",
        color: "#c7d2fe",
      })
      .setOrigin(0.5);

    this.scoreText = this.add
      .text(26, 22, "Score: 0", {
        fontFamily: bodyFontFamily,
        fontSize: "34px",
        color: "#ffffff",
      })
      .setStroke('#000000', 6);

    this.timerText = this.add
      .text(width - 26, 22, "01:00", {
        fontFamily: bodyFontFamily,
        fontSize: "34px",
        color: "#ffffff",
      })
      .setOrigin(1, 0)
      .setStroke('#000000', 6);

    this.glowRect = this.add
      .rectangle(width / 2, height / 2, width + 200, height + 200, 0x7c3aed, 0.0)
      .setDepth(-500);

    // Debug panel (toggle with D key)
    this.debugPanel = document.createElement('div');
    Object.assign(this.debugPanel.style, {
      position: 'fixed', right: '14px', top: '14px',
      background: 'rgba(0,0,0,0.6)', color: '#fff',
      padding: '8px', fontSize: '12px', fontFamily: 'monospace',
      borderRadius: '6px', zIndex: '9999', display: 'none',
    });

    const makeRange = (
      label: string, min: number, max: number, step: number,
      value: number, onChange: (v: number) => void
    ) => {
      const wrapper = document.createElement('div');
      wrapper.style.marginBottom = '6px';
      const lab = document.createElement('div');
      lab.textContent = label;
      lab.style.marginBottom = '4px';
      const input = document.createElement('input');
      input.type = 'range';
      input.min = String(min); input.max = String(max);
      input.step = String(step); input.value = String(value);
      input.oninput = () => onChange(Number(input.value));
      wrapper.appendChild(lab);
      wrapper.appendChild(input);
      return wrapper;
    };

    this.debugPanel.appendChild(
      makeRange('Spawn Interval', 500, 3000, 50, this.currentSpawnInterval,
        (v) => (this.currentSpawnInterval = v))
    );
    this.debugPanel.appendChild(
      makeRange('Move Base', 3000, 12000, 200, this.currentMoveBase,
        (v) => (this.currentMoveBase = v))
    );

    document.body.appendChild(this.debugPanel);
    this.input.keyboard?.on('keydown-D', () => {
      if (!this.debugPanel) return;
      this.debugPanel.style.display =
        this.debugPanel.style.display === 'none' ? 'block' : 'none';
    });

    // Audio context
    const win = window as unknown as { AudioContext?: unknown; webkitAudioContext?: unknown };
    const AudioCtor = win.AudioContext ?? win.webkitAudioContext;
    if (typeof AudioCtor === 'function') {
      try {
        this.audioCtx = new (AudioCtor as unknown as { new(): AudioContext })();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.value = 0.18;
        this.masterGain.connect(this.audioCtx.destination);
      } catch {
        this.audioCtx = undefined;
        this.masterGain = undefined;
      }
    }

    // Start screen
    const title = this.add
      .text(width / 2, height / 2 - 60, 'Catch the Wind Sprites', {
        fontFamily: headingFontFamily,
        fontSize: '72px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const startBtn = this.add
      .text(width / 2, height / 2 + 10, 'Start', {
        fontFamily: bodyFontFamily,
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

    // Game over screen
    const overTitle = this.add
      .text(width / 2, height / 2 - 60, 'Game Over', {
        fontFamily: headingFontFamily,
        fontSize: '68px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const finalScoreText = this.add
      .text(width / 2, height / 2 - 10, 'Final Score: 0', {
        fontFamily: bodyFontFamily,
        fontSize: '40px',
        color: '#c7d2fe',
      })
      .setOrigin(0.5);

    const restartBtn = this.add
      .text(width / 2, height / 2 + 40, 'Restart', {
        fontFamily: bodyFontFamily,
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

  // ---------- public API ----------

  startRun() { this.startGame(); }
  stopRun()  { this.endGame(true); }

  // ---------- game loop ----------

  private startGame() {
    if (this.running) return;

    this.running = true;
    this.score = 0;
    this.targetScore = 0;
    this.displayedScore = 0;
    this.timeLeftMs = 60_000;
    this.comboCount = 0;
    this.multiplier = 1;
    this.finalRushStarted = false;
    this.inSurge = false;
    this.currentPhase = this.phases[0];
    this.currentSpawnInterval = this.phases[0].spawnInterval;
    this.currentMoveBase = this.phases[0].moveBase;

    this.scoreText?.setText('Score: 0');
    this.timerText?.setText('01:00');
    this.timerText?.setScale(1);
    this.tweens.killTweensOf(this.timerText);
    this.hintText?.setText('Catch as many as you can!');
    this.startContainer?.setVisible(false);

    this.spawnEvent?.remove(false);
    this.tickEvent?.remove(false);
    this.surgeEvent?.remove(false);

    const scheduleSpawner = () => {
      this.spawnEvent?.remove(false);
      const jitter = (Math.random() * 2 - 1) * this.currentPhase.jitter;
      const delay = Math.max(500, this.currentSpawnInterval + jitter);
      this.spawnEvent = this.time.addEvent({
        delay,
        callback: () => {
          this.spawnSpirit();
          scheduleSpawner(); // re-schedule with fresh jitter each time
        },
      });
    };

    scheduleSpawner();

    // Wind Surge first fires at 18s so player experiences it before the rush
    this.surgeEvent = this.time.addEvent({
      delay: 18_000,
      loop: true,
      callback: () => this.triggerWindSurge(),
    });

    this.tickEvent = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => this.updateTimer(scheduleSpawner),
    });
  }

  private triggerWindSurge() {
    if (!this.running) return;
    this.inSurge = true;

    this.cameras.main.flash(350, 180, 230, 255, false);
    this.showFloatingText('✦ WIND SURGE ✦', this.scale.width / 2, this.scale.height / 2, '#7dd3fc');

    // Tint all live spirits gold
    this.children.list.forEach((child) => {
      if (
        child instanceof Phaser.GameObjects.Image &&
        child.getData('isSprite') &&
        !child.getData('isCursed')
      ) {
        child.setTint(0xffd700);
      }
    });

    this.time.delayedCall(4000, () => {
      this.inSurge = false;
      this.children.list.forEach((child) => {
        if (
          child instanceof Phaser.GameObjects.Image &&
          child.getData('isSprite') &&
          !child.getData('isCursed')
        ) {
          child.clearTint();
        }
      });
    });
  }

  private endGame(manual = false) {
    this.running = false;
    this.spawnEvent?.remove(false);
    this.tickEvent?.remove(false);
    this.surgeEvent?.remove(false);

    this.children.list
      .filter(
        (c): c is Phaser.GameObjects.GameObject =>
          c instanceof Phaser.GameObjects.GameObject &&
          typeof c.getData === 'function' &&
          c.getData('isSprite')
      )
      .forEach((c) => c.destroy());

    this.hintText?.setText(
      manual
        ? `Stopped. Final score: ${this.score}`
        : `Time! Final score: ${this.score} — Click Start to play again`
    );

    if (!manual && this.onGameEnd) {
      // Wait for score counter to finish rolling before reporting
      this.time.delayedCall(800, () => this.onGameEnd?.(this.targetScore));
      return;
    }

    if (this.gameOverContainer) {
      const finalScore = this.gameOverContainer.list[1] as Phaser.GameObjects.Text;
      finalScore.setText(`Final Score: ${this.score}`);
      this.gameOverContainer.setVisible(true);
    }

    this.startContainer?.setVisible(true);
  }

  // ---------- spirits ----------

  private pickSpirit(): {
    key: string; points: number; scale: number; isGold: boolean; isCursed: boolean;
  } {
    const roll = Math.random();

    if (roll < 0.03) {
      return { key: 'spirit-gold', points: 5, scale: 0.84, isGold: true, isCursed: false };
    }
    // Cursed spirit — dark tinted, penalises click and breaks combo
    if (roll < 0.10) {
      return { key: 'spirit-1', points: -3, scale: 0.78, isGold: false, isCursed: true };
    }

    const commons = [
      { key: 'spirit-1', points: 1, scale: 0.84, isGold: false, isCursed: false },
      { key: 'spirit-2', points: 1, scale: 0.84, isGold: false, isCursed: false },
      { key: 'spirit-3', points: 1, scale: 0.84, isGold: false, isCursed: false },
    ].filter((s) => this.textures.exists(s.key));

    return commons[Math.floor(Math.random() * commons.length)];
  }

  private spawnSpirit() {
    const { width, height } = this.scale;

    const fromLeft = Math.random() < 0.5;
    const x = fromLeft ? -40 : width + 40;
    const y = 120 + Math.random() * (height - 180);

    const chosen = this.pickSpirit();

    const spirit = this.add
      .image(x, y, chosen.key)
      .setScale(chosen.scale)
      .setAlpha(0.45)
      .setFlipX(!fromLeft);

    spirit.setData('isSprite', true);
    spirit.setData('points', chosen.points);
    spirit.setData('isGold', chosen.isGold);
    spirit.setData('isCursed', chosen.isCursed);
    spirit.setInteractive({ useHandCursor: true });

    if (chosen.isCursed) {
      spirit.setTint(0x4a0080); // deep purple — visual warning before clicking
      this.tweens.add({
        targets: spirit,
        alpha: { from: 0.3, to: 0.9 },
        duration: 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    } else {
      this.tweens.add({ targets: spirit, alpha: 1, duration: 160, ease: 'Sine.out' });
    }

    // Gentle pulse (all spirits)
    this.tweens.add({
      targets: spirit,
      scale: chosen.scale * 1.09,
      yoyo: true, repeat: -1,
      duration: 2200,
      ease: 'Sine.inOut',
    });

    // Vertical drift — gives a soft magical floating feel
    this.tweens.add({
      targets: spirit,
      y: spirit.y + (Math.random() > 0.5 ? 8 : -8),
      yoyo: true, repeat: -1,
      duration: 3000 + Math.random() * 2000,
      ease: 'Sine.inOut',
    });

    spirit.on('pointerdown', () => this.handleSpiritClick(spirit));

    const targetX = fromLeft ? width + 80 : -80;
    const duration = Math.max(
      this.moveConfig.minDuration,
      this.currentMoveBase + Math.random() * this.moveConfig.randomRange
    );

    this.tweens.add({
      targets: spirit,
      x: targetX,
      y: y + (Math.random() * 60 - 30),
      alpha: 0.85,
      duration,
      ease: 'Sine.inOut',
      onComplete: () => spirit.destroy(),
    });
  }

  private handleSpiritClick(spirit: Phaser.GameObjects.Image) {
    if (!this.running) return;

    const isCursed = spirit.getData('isCursed') as boolean;
    const pts = Number(spirit.getData('points') ?? 1);

    if (isCursed) {
      this.breakCombo();
      this.targetScore = Math.max(0, this.targetScore - 3);
      this.showFloatingText('CURSED! −3', spirit.x, spirit.y, '#ff6b6b');
      this.cameras.main.shake(200, 0.006);
      this.tweens.add({
        targets: spirit,
        scale: 0, alpha: 0,
        duration: 250,
        ease: 'Back.easeIn',
        onComplete: () => spirit.destroy(),
      });
      return;
    }

    this.comboCount++;
    this.multiplier = Math.min(4, 1 + Math.floor(this.comboCount / 3));
    const surgeBonus = this.inSurge ? 2 : 1;
    const earned = pts * this.multiplier * surgeBonus;
    this.targetScore += earned;

    this.playPop(this.multiplier);
    this.resetComboDecay();

    // Floating label — shows multiplier and surge info when active
    const parts: string[] = [`+${earned}`];
    if (this.multiplier > 1) parts.push(`${this.multiplier}x`);
    if (this.inSurge) parts.push('SURGE');
    const labelColor = this.inSurge ? '#ffd700' : this.multiplier >= 3 ? '#c4b5fd' : '#ffffff';
    this.showFloatingText(parts.join(' '), spirit.x, spirit.y, labelColor);

    // Combo milestone — shake + banner every 5 hits
    if (this.comboCount % 5 === 0) {
      this.cameras.main.shake(120, 0.003);
      this.showFloatingText(`${this.comboCount} COMBO!`, this.scale.width / 2, 180, '#a78bfa');
    }

    this.tweens.add({
      targets: this.scoreText,
      scale: 1.15, yoyo: true,
      duration: 200,
      ease: 'Cubic.out',
    });

    this.tweens.add({
      targets: spirit,
      scale: spirit.scale * 1.5, alpha: 0,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => spirit.destroy(),
    });
  }

  // ---------- timer + phases ----------

  private updateTimer(reschedule: () => void) {
    this.timeLeftMs -= 100;

    if (this.timeLeftMs <= 0) {
      this.endGame();
      return;
    }

    this.timerText?.setText(this.formatTime(this.timeLeftMs));

    // Phase transition — smooth tween to new speed over 2s
    const nextPhase = this.phases.find(p => this.timeLeftMs > p.until);
    if (nextPhase && nextPhase !== this.currentPhase) {
      this.currentPhase = nextPhase;
      const fromSpawn = this.currentSpawnInterval;
      const fromMove = this.currentMoveBase;
      this.tweens.addCounter({
        from: 0, to: 1,
        duration: 2000,
        onUpdate: (t) => {
          const p = t.getValue();
          this.currentSpawnInterval = Phaser.Math.Linear(fromSpawn, nextPhase.spawnInterval, p);
          this.currentMoveBase = Phaser.Math.Linear(fromMove, nextPhase.moveBase, p);
        },
        onComplete: () => reschedule(),
      });
    }

    // Final rush — visual urgency in the last 10 seconds
    if (this.timeLeftMs <= 10_000 && !this.finalRushStarted) {
      this.finalRushStarted = true;
      this.cameras.main.flash(600, 255, 120, 80, false);
      this.showFloatingText('FINAL RUSH!', this.scale.width / 2, this.scale.height / 2, '#ff9966');
      this.tweens.add({
        targets: this.timerText,
        scale: { from: 1.0, to: 1.2 },
        yoyo: true, repeat: -1, duration: 500,
      });
    }

    // Glow intensity tracks elapsed time
    if (this.glowRect) {
      const elapsed = 60_000 - this.timeLeftMs;
      const alpha = 0.02 + Phaser.Math.Clamp(elapsed / 60_000, 0, 1) * 0.14;
      this.glowRect.setFillStyle(0x7c3aed, alpha);
    }
  }

  private formatTime(ms: number) {
    const totalSec = Math.ceil(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
}

// ---------- factory ----------

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
    backgroundColor: '#0b1020',
    scene: [scene],
  };

  const game = new Phaser.Game(config);

  // Defer start() until the scene's create() has finished to avoid
  // calling into uninitialized scene systems (time, tweens, etc.)
  const ready = new Promise<void>((resolve) => {
    const attach = () => {
      try {
        if (scene.sys?.events && typeof scene.sys.events.once === 'function') {
          scene.sys.events.once('create', () => {
            console.log('createGame: scene ready');
            resolve();
          });
          return;
        }
      } catch { /* retry */ }
      setTimeout(attach, 16);
    };
    attach();
  });

  return {
    start:   () => ready.then(() => scene.startRun()).catch(console.error),
    stop:    () => scene.stopRun(),
    destroy: () => game.destroy(true),
  };
}
