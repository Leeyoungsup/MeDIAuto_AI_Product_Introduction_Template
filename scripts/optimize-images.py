"""Optional asset regeneration. Requires Pillow; originals remain unchanged."""
import json
from pathlib import Path
from PIL import Image
root = Path(__file__).resolve().parents[1] / 'public/mediauto-ai'
p = root / 'manifest.json'
manifest = json.loads(p.read_text())
for pair in manifest['pairs']:
    pair['web'] = {}
    for side in ('before', 'after'):
        source = root / pair[side]
        target = source.with_suffix('.webp')
        with Image.open(source) as image:
            assert image.size == (1600, 1000)
            image.save(target, 'WEBP', quality=90, method=6)
        pair['web'][side] = target.relative_to(root).as_posix()
p.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
with Image.open(root / 'expert-review.png') as image:
    image.save(root / 'expert-review.webp', 'WEBP', quality=90, method=6)
print('Generated equal-size WebP pairs at quality 90; preserved original PNGs.')
