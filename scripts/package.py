"""Package the exact extension bytes that passed scripts/test.mjs. No dependencies bundled."""
from pathlib import Path
import hashlib,json,zipfile,subprocess
root=Path(__file__).resolve().parents[1]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
proof=root/'test-results/verified-build.json'
if not proof.exists():raise SystemExit('Run npm test first; no matching verification record')
actual={str(p.relative_to(root/'extension')):sha(p) for p in sorted((root/'extension').rglob('*')) if p.is_file()}
verified=json.loads(proof.read_text())
if actual!=verified['files']:raise SystemExit('Extension differs from tested bytes; run npm test again')
version=json.loads((root/'package.json').read_text())['version']
assert json.loads((root/'extension/manifest.json').read_text())['version']==version
if verified.get('version')!=version:raise SystemExit('Tested version differs; run npm test again')
out=root/'dist'/('v'+version);out.mkdir(parents=True,exist_ok=True)
# Source list from Git + intended untracked project files; generated test output is excluded.
listed=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z'],cwd=root).decode().split('\0')
source=[root/f for f in listed if f and (root/f).is_file() and not any(x in {'dist','test-results','node_modules','.research','artifacts'} for x in Path(f).parts)]
archives={'extension':sorted((root/'extension').rglob('*')),'source':sorted(source)}
entries=[]
for kind,files in archives.items():
 name=f'Intelligent-UI-Portability-Lab-v{version}-{kind}.zip';target=out/name
 with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
  for p in files:
   if not p.is_file():continue
   info=zipfile.ZipInfo(str(p.relative_to(root)),date_time=(2026,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;z.writestr(info,p.read_bytes())
 with zipfile.ZipFile(target) as z:
  assert z.testzip() is None
  for f,digest in actual.items():assert hashlib.sha256(z.read('extension/'+f)).hexdigest()==digest
 entries.append({'file':name,'bytes':target.stat().st_size,'sha256':sha(target)})
(out/'SHA256SUMS').write_text(''.join(f"{e['sha256']}  {e['file']}\n" for e in entries))
(out/'package-manifest.json').write_text(json.dumps({'version':version,'testedAt':verified['testedAt'],'extensionFiles':actual,'archives':entries},indent=2)+'\n')
print(json.dumps(entries,indent=2))
