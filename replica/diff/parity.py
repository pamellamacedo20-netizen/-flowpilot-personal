#!/usr/bin/env python3
import csv, sys
from pathlib import Path
weights={'must':3,'should':2,'could':1}
credit={'yes':1.0,'partial':0.5,'no':0.0}
path=Path(sys.argv[1] if len(sys.argv)>1 else 'replica/features.csv')
rows=list(csv.DictReader(path.open(encoding='utf-8')))
num=den=0.0; missing=[]
for r in rows:
    if r['original'].lower()!='yes': continue
    w=weights.get(r['priority'].lower(),1)
    den+=w; num+=w*credit.get(r['clone'].lower(),0)
    if r['clone'].lower()!='yes': missing.append(r)
score=round(100*num/den) if den else 100
must_missing=[r for r in missing if r['priority'].lower()=='must']
print(f'Parity score: {score}/100')
print(f'Features: {len(rows)} | incomplete: {len(missing)} | incomplete must-haves: {len(must_missing)}')
print('Shippable:', 'NO' if must_missing else 'YES')
for r in must_missing:
    print(f"- MUST {r['feature']}: {r['clone']} — {r['notes']}")
