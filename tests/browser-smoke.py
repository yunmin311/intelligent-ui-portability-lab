"""Legacy entry point. Run real MV3 E2E instead of the old page-only smoke."""
import pathlib, subprocess
raise SystemExit(subprocess.call(['npm', 'run', 'test:e2e'], cwd=pathlib.Path(__file__).resolve().parents[1]))
