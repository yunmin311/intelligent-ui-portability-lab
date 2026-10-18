"""Create installable/source archives without dependencies or research downloads."""
from pathlib import Path
import hashlib, json, zipfile
root=Path(__file__).resolve().parents[1]
out=root/'dist';out.mkdir(exist_ok=True)
archives={
 'Intelligent-UI-Portability-Lab-v0.2-extension.zip': sorted((root/'extension').glob('*')),
 'Intelligent-UI-Portability-Lab-v0.2-source.zip': sorted(p for p in root.rglob('*') if p.is_file() and not any(x in {'node_modules','.research','dist','.git','test-results','playwright-report','__pycache__'} for x in p.relative_to(root).parts))
}
entries=[]
for name,files in archives.items():
 target=out/name
 with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as z:
  for p in files:z.write(p,p.relative_to(root))
 with zipfile.ZipFile(target) as z:
  assert z.testzip() is None
  if 'extension.zip' in name:assert json.loads(z.read('extension/manifest.json'))['version']=='0.2.0'
 entries.append({'file':name,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'files':len(files)})
(out/'SHA256SUMS').write_text(''.join(f"{e['sha256']}  {e['file']}\n" for e in entries))
(out/'package-manifest.json').write_text(json.dumps({'version':'0.2.0','archives':entries},indent=2)+'\n')
print(json.dumps(entries,indent=2))
