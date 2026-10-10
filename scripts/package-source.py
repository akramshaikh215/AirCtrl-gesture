"""Create the portable source download without runtime data or Site credentials."""
from pathlib import Path
import os, zipfile, json
root=Path(__file__).resolve().parent.parent
excluded={'.git','node_modules','.next','.vinext','dist','.wrangler','.sites-runtime','.pytest_cache','__pycache__','.venv','downloads','.openai'}
output=root/'public/downloads/saassum-ai-source.zip'
output.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED) as archive:
    for base,dirs,files in os.walk(root):
        dirs[:]=[d for d in dirs if d not in excluded]
        for name in files:
            if name=='next-env.d.ts' or name.endswith(('.pyc','.tsbuildinfo')) or (name.startswith('.env') and name!='.env.example'):continue
            path=Path(base)/name
            archive.write(path,Path('saassum-ai')/path.relative_to(root))
    archive.writestr('saassum-ai/.openai/hosting.json',json.dumps({'d1':None,'r2':None},indent=2))
print(output)
