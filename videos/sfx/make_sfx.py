"""Synthesizes the explainer-video sound cues to WAV (python3 make_sfx.py).

A small, warm "mallet" palette so the cues feel like part of the lesson, not
like interface beeps. Everything sits in C major pentatonic, so any two cues
heard together are consonant.

  number_0..5  soft marimba note; steps rise when things are counted in turn
  operation    round, low wooden tock (a sign is placed)
  result       gentle three-note bell chime rising to the answer
  tick         tiny high pluck, one per item that is dealt or moved
"""
import os
import wave

import numpy as np

SR = 44100
OUT = os.path.dirname(os.path.abspath(__file__))
PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]  # C5 D5 E5 G5 A5 C6
rng = np.random.default_rng(7)


def t_axis(seconds):
    return np.arange(int(SR * seconds)) / SR


def fftconvolve(a, b):
    n = len(a) + len(b) - 1
    size = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(a, size) * np.fft.rfft(b, size), size)[:n]


def lowpass(x, cutoff):
    """One-pole low-pass, enough to take the edge off a click."""
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def mallet(freq, seconds, decay, partials=((1, 1.0, 1.0), (4, 0.30, 0.35), (10, 0.06, 0.12))):
    """Marimba-style bar: fundamental plus the 4th and 10th partials, which die faster."""
    t = t_axis(seconds)
    y = sum(amp * np.sin(2 * np.pi * freq * ratio * t) * np.exp(-t / (decay * speed))
            for ratio, amp, speed in partials)
    thump = lowpass(rng.standard_normal(len(t)) * np.exp(-t / 0.006), 1800) * 0.35
    return y * np.minimum(1, t / 0.004) + thump


def bell(freq, seconds, decay):
    t = t_axis(seconds)
    y = (np.sin(2 * np.pi * freq * t) * np.exp(-t / decay)
         + 0.28 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t / (decay * 0.6))
         + 0.10 * np.sin(2 * np.pi * freq * 3 * t) * np.exp(-t / (decay * 0.35)))
    return y * np.minimum(1, t / 0.006)


def tock():
    t = t_axis(0.35)
    sweep = 330 * np.exp(-t / 0.03) + 190
    body = np.sin(2 * np.pi * np.cumsum(sweep) / SR) * np.exp(-t / 0.07)
    knock = lowpass(rng.standard_normal(len(t)) * np.exp(-t / 0.004), 1200) * 0.5
    return (body + knock) * np.minimum(1, t / 0.003)


def reverb(x, wet=0.16, seconds=0.45):
    t = t_axis(seconds)
    ir = lowpass(rng.standard_normal(len(t)), 4500) * np.exp(-t / 0.11)
    ir /= np.sqrt(np.sum(ir ** 2))
    tail = fftconvolve(x, ir)[: len(x) + len(ir)]
    padded = np.pad(x, (0, len(tail) - len(x)))
    return (1 - wet) * padded + wet * tail


def finish(x, peak):
    """Trim the silent tail, fade out, and set the peak level."""
    x = x / np.max(np.abs(x))
    live = np.nonzero(np.abs(x) > 0.01)[0]
    x = x[: live[-1] + 1]
    fade = int(SR * 0.03)
    x[-fade:] *= np.linspace(1, 0, fade)
    return x * peak


def write(name, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype("<i2")
    with wave.open(os.path.join(OUT, f"{name}.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f"{name:12s} {len(x) / SR:.2f}s")


def chime():
    notes = [523.25, 659.25, 783.99]  # C5 E5 G5
    mix = np.zeros(int(SR * 1.3))
    for i, f in enumerate(notes):
        voice = bell(f, 1.1, 0.35 + 0.05 * i)
        start = int(SR * 0.085 * i)
        mix[start:start + len(voice)] += voice * (0.8 + 0.1 * i)
    return mix


for step, freq in enumerate(PENTATONIC):
    write(f"number_{step}", finish(reverb(mallet(freq, 0.6, 0.16), wet=0.14), 0.8))
write("operation", finish(reverb(tock(), wet=0.1), 0.8))
write("result", finish(reverb(chime(), wet=0.2, seconds=0.6), 0.85))
write("tick", finish(reverb(mallet(1318.5, 0.2, 0.05), wet=0.08), 0.35))
