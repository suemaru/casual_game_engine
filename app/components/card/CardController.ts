'use client';

import { MathUtils, Vector2 } from 'three';

type AngleKick = {
  axis: 'x' | 'y';
  direction: 1 | -1;
};

type UpdateResult = {
  rotation: Vector2;
  introProgress: number;
};

const MAX_TILT_RAD = MathUtils.degToRad(12);
const HANE_THRESHOLD = MathUtils.degToRad(9);
const HANE_COOLDOWN = 0.22;

export class CardController {
  rotation = new Vector2();
  private velocity = new Vector2();
  private pointerTarget = new Vector2();
  private keyboardInput = new Vector2();
  private keyboardTarget = new Vector2();

  private pointerActive = false;
  private pointerStart = { x: 0, y: 0, time: 0 };
  private pointerLast = { x: 0, y: 0 };

  private pendingBurst = false;
  private lastKickAt = 0;
  private lastOverThreshold = { x: false, y: false };
  private motionScale = 1;
  private introTime = 0;
  private introDone = false;

  onBurst?: () => void;
  onKick?: (kick: AngleKick) => void;

  setMotionScale(scale: number) {
    this.motionScale = Math.max(0.1, Math.min(1, scale));
    this.updateKeyboardTarget();
  }

  resetIntro() {
    this.introTime = 0;
    this.introDone = false;
  }

  handlePointerEnter() {
    if (!this.pointerActive) {
      this.pointerTarget.setScalar(0);
    }
  }

  handlePointerMove(clientX: number, clientY: number, rect: DOMRect) {
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((clientY - rect.top) / rect.height) * 2 - 1;

    const motion = this.motionScale;
    this.pointerTarget.set(
      MathUtils.clamp(-ny, -1, 1) * MAX_TILT_RAD * motion,
      MathUtils.clamp(nx, -1, 1) * MAX_TILT_RAD * motion,
    );

    if (!this.pointerActive) {
      this.pointerLast = { x: clientX, y: clientY };
    }
  }

  handlePointerDown(clientX: number, clientY: number, rect: DOMRect, timeStamp: number) {
    this.pointerActive = true;
    this.pointerStart = { x: clientX, y: clientY, time: timeStamp };
    this.pointerLast = { x: clientX, y: clientY };
    this.handlePointerMove(clientX, clientY, rect);
  }

  handlePointerUp(clientX: number, clientY: number, timeStamp: number) {
    if (!this.pointerActive) return;
    this.pointerActive = false;
    const dt = timeStamp - this.pointerStart.time;
    const dist = Math.hypot(clientX - this.pointerStart.x, clientY - this.pointerStart.y);
    if (dt <= 200 && dist <= 10) {
      this.pendingBurst = true;
    }
    this.pointerLast = { x: clientX, y: clientY };
    this.pointerTarget.setScalar(0);
  }

  handlePointerLeave() {
    this.pointerActive = false;
    this.pointerTarget.setScalar(0);
  }

  setKeyboardTilt(pitch: number, yaw: number) {
    this.keyboardInput.set(
      MathUtils.clamp(pitch, -1, 1),
      MathUtils.clamp(yaw, -1, 1),
    );
    this.updateKeyboardTarget();
  }

  update(delta: number): UpdateResult {
    const followStrength = this.pointerActive ? 32 : 18;
    const damping = Math.pow(0.92, delta * 60);

    const desired = this.pointerActive ? this.pointerTarget : this.keyboardTarget;

    this.velocity.x += (desired.x - this.rotation.x) * followStrength * delta;
    this.velocity.y += (desired.y - this.rotation.y) * followStrength * delta;

    this.velocity.multiplyScalar(damping);

    this.rotation.addScaledVector(this.velocity, delta);

    // Snapback when idle
    if (!this.pointerActive && this.keyboardTarget.lengthSq() === 0) {
      const snap = Math.pow(0.85, delta * 60);
      this.rotation.multiplyScalar(snap);
    }

    this.detectKick();
    this.emitBurstIfNeeded();
    const progress = this.progressIntro(delta);

    return { rotation: this.rotation.clone(), introProgress: progress };
  }

  private emitBurstIfNeeded() {
    if (this.pendingBurst) {
      this.pendingBurst = false;
      this.onBurst?.();
    }
  }

  private detectKick() {
    const now = performance.now() / 1000;

    (['x', 'y'] as const).forEach((axis) => {
      const value = Math.abs(this.rotation[axis]);
      const crossed = value > HANE_THRESHOLD;
      if (crossed && !this.lastOverThreshold[axis]) {
        if (now - this.lastKickAt > HANE_COOLDOWN) {
          this.lastKickAt = now;
          const direction = this.rotation[axis] >= 0 ? 1 : -1;
          this.onKick?.({ axis, direction });
        }
      }
      this.lastOverThreshold[axis] = crossed;
    });
  }

  private progressIntro(delta: number) {
    if (this.introDone) return 1;
    this.introTime += delta;
    if (this.introTime >= 0.8) {
      this.introDone = true;
      return 1;
    }
    return Math.min(1, this.introTime / 0.8);
  }

  private updateKeyboardTarget() {
    this.keyboardTarget.set(
      this.keyboardInput.x * MAX_TILT_RAD * this.motionScale,
      this.keyboardInput.y * MAX_TILT_RAD * this.motionScale,
    );
  }
}
