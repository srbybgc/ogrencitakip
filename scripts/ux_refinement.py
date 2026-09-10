from pathlib import Path

def rep(s, old, new, label):
    if old in s: return s.replace(old, new, 1)
    if new in s: return s
    raise SystemExit('missing '+label)

# Re-run the existing one-shot patch below; each replacement is intentionally idempotent.
exec(Path(__file__).with_name('ux_refinement_body.py').read_text())
