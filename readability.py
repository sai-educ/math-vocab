"""
Readability scoring for the vocabulary bank.

Usable Math's practice is to check explanations against the Flesch-Kincaid
scale so they land within reach of young readers. build_data.py runs every
definition and example through this module and prints a report, so content
drift is caught at build time rather than in front of a child.

Two scores, from the same word/sentence/syllable counts:

  Flesch Reading Ease   0-100, higher is easier. 90-100 is "very easy"
                        (around a 5th-grade reader), 80-90 "easy".
  Flesch-Kincaid Grade  the US school grade needed to read the text.

Math vocabulary fights the formula: "denominator" is five syllables no
matter how kindly you use it. So the targets below apply to the *prose
around* the term, and the report is advisory - it never fails a build.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

# Flesch Reading Ease floors. Anything below is flagged in the report.
TARGET_EASE_DEFINITION = 70.0
TARGET_EASE_EXAMPLE = 70.0

# Flesch was designed for ~100-word passages and is unstable on very short
# ones: in a five-word definition a single word like "multiplication" drags
# the score below zero, which says nothing useful about whether a child can
# read it. Below this length we check hard-word density instead, which is
# what Gunning Fog and SMOG use and which stays meaningful on short text.
MIN_WORDS_FOR_FLESCH = 20
HARD_WORD_SYLLABLES = 3
MAX_HARD_WORD_RATIO = 0.25

_WORD_RE = re.compile(r"[A-Za-z][A-Za-z'’-]*")
_SENTENCE_RE = re.compile(r"[.!?]+(?:\s|$)")
_VOWEL_GROUP_RE = re.compile(r"[aeiouy]+")

# Words the vowel-group heuristic gets wrong often enough to matter here.
_SYLLABLE_OVERRIDES = {
    "area": 3, "every": 3, "being": 2, "idea": 3, "real": 1, "science": 2,
    "quiet": 2, "usually": 4, "one": 1, "once": 1, "square": 1, "squares": 1,
    "whole": 1, "whales": 1, "shape": 1, "shapes": 1, "same": 1, "size": 1,
    "line": 1, "lines": 1, "time": 1, "times": 1, "make": 1, "makes": 1,
    "more": 1, "store": 1, "score": 1, "there": 1, "where": 1, "here": 1,
    "three": 1, "these": 1, "those": 1, "come": 1, "some": 1, "done": 1,
    "have": 1, "give": 1, "live": 1, "move": 1, "love": 1, "note": 1,
    "side": 1, "sides": 1, "place": 1, "places": 1, "space": 1, "spaces": 1,
    "piece": 1, "pieces": 2, "price": 1, "prices": 2, "twelve": 1, "twice": 1,
}


def count_syllables(word: str) -> int:
    """Vowel-group heuristic with a silent-e correction."""
    w = word.lower().strip("'’-")
    if not w:
        return 0
    if w in _SYLLABLE_OVERRIDES:
        return _SYLLABLE_OVERRIDES[w]

    groups = _VOWEL_GROUP_RE.findall(w)
    count = len(groups)

    # Silent trailing "e" ("shape", "note") but not "-le" ("simple", "little").
    if w.endswith("e") and not w.endswith(("le", "ee", "ye")) and count > 1:
        count -= 1
    # "-ed" is usually silent unless preceded by t/d ("counted", "added").
    if w.endswith("ed") and len(w) > 3 and w[-3] not in "td" and count > 1:
        count -= 1

    return max(1, count)


@dataclass(frozen=True)
class Score:
    words: int
    sentences: int
    syllables: int
    ease: float
    grade: float
    hard_words: int

    @property
    def band(self) -> str:
        if self.ease >= 90:
            return "very easy"
        if self.ease >= 80:
            return "easy"
        if self.ease >= 70:
            return "fairly easy"
        if self.ease >= 60:
            return "standard"
        return "hard"

    @property
    def is_long_enough(self) -> bool:
        """Whether the Flesch score is statistically worth reading."""
        return self.words >= MIN_WORDS_FOR_FLESCH

    @property
    def hard_word_ratio(self) -> float:
        return self.hard_words / self.words if self.words else 0.0

    @property
    def needs_attention(self) -> bool:
        if self.is_long_enough:
            return self.ease < TARGET_EASE_DEFINITION
        return self.hard_word_ratio > MAX_HARD_WORD_RATIO


def score(text: str) -> Score:
    words = _WORD_RE.findall(text or "")
    if not words:
        return Score(0, 0, 0, 100.0, 0.0, 0)

    sentences = max(1, len(_SENTENCE_RE.findall(text.strip())))
    per_word = [count_syllables(w) for w in words]
    syllables = sum(per_word)

    words_per_sentence = len(words) / sentences
    syllables_per_word = syllables / len(words)

    ease = 206.835 - 1.015 * words_per_sentence - 84.6 * syllables_per_word
    grade = 0.39 * words_per_sentence + 11.8 * syllables_per_word - 15.59

    return Score(
        words=len(words),
        sentences=sentences,
        syllables=syllables,
        ease=round(ease, 1),
        grade=round(grade, 1),
        hard_words=sum(1 for n in per_word if n >= HARD_WORD_SYLLABLES),
    )


def report(entries: list[dict]) -> None:
    """Print a readability summary and list anything worth a second look."""
    def_scores = [score(e["definition"]) for e in entries]
    ex_scores = [score(e["example"]) for e in entries]

    def summarise(label: str, scores: list[Score]) -> list[int]:
        mean_ease = sum(s.ease for s in scores) / len(scores)
        mean_grade = sum(s.grade for s in scores) / len(scores)
        bands = {}
        for s in scores:
            bands[s.band] = bands.get(s.band, 0) + 1
        order = ["very easy", "easy", "fairly easy", "standard", "hard"]
        spread = "  ".join(f"{b}: {bands[b]}" for b in order if b in bands)
        print(f"  {label:<12} mean ease {mean_ease:5.1f}   mean FK grade {mean_grade:4.1f}")
        print(f"  {'':<12} {spread}")
        return [i for i, s in enumerate(scores) if s.needs_attention]

    print("\nReadability (Flesch)")
    flagged = {
        "definition": (summarise("definitions", def_scores), def_scores),
        "example": (summarise("examples", ex_scores), ex_scores),
    }

    for label, (idxs, scores) in flagged.items():
        if not idxs:
            print(f"\n  Nothing flagged for {label}s.")
            continue
        print(f"\n  Worth a second look ({label}) - {len(idxs)}:")
        for i in sorted(idxs, key=lambda i: scores[i].ease)[:10]:
            s, e = scores[i], entries[i]
            reason = (f"ease {s.ease:5.1f}" if s.is_long_enough
                      else f"{s.hard_words}/{s.words} long words")
            print(f"    {reason:<22} G{e['grade']:<2} {e['term']}")
        if len(idxs) > 10:
            print(f"    ... and {len(idxs) - 10} more")

    short = sum(1 for s in def_scores + ex_scores if not s.is_long_enough)
    print(f"\n  ({short} of {len(def_scores) + len(ex_scores)} texts are under "
          f"{MIN_WORDS_FOR_FLESCH} words, where Flesch is noisy and hard-word "
          f"density is checked instead.)")
