export class ComparisonViewer {
 constructor(mount, { priority = false } = {}) {
  this.mount = mount; this.priority = priority; this.version = 0; this.position = 50;
  mount.innerHTML = `<div class="comparison"><div class="viewer-toolbar"><span class="viewer-title"></span><div class="view-options" aria-label="관찰 영역"><button data-view="context">넓은 영역</button><button data-view="detail">확대 영역</button></div></div><div class="image-stage" aria-busy="true"><div class="image-layers" hidden></div><div class="image-label before-label" hidden></div><div class="image-label after-label" hidden></div><div class="divider" hidden><span>‹ <i></i> ›</span></div><input class="compare-range" type="range" min="0" max="100" step="1" value="50" aria-label="원본 영상 노출 비율" disabled><div class="viewer-status" role="status"></div></div><div class="viewer-bottom"><span>↔ 드래그 또는 방향키로 비교</span><button class="reset-position" aria-label="비교 위치 50%로 초기화">50 : 50</button></div></div>`;
  this.stage = mount.querySelector('.image-stage'); this.range = mount.querySelector('input'); this.layers = mount.querySelector('.image-layers'); this.status = mount.querySelector('.viewer-status');
  this.range.addEventListener('input', () => this.setPosition(+this.range.value));
  const move = e => { const r = this.stage.getBoundingClientRect(); this.setPosition((e.clientX-r.left)/r.width*100); };
  this.stage.addEventListener('pointerdown', e => { if(this.range.disabled) return; e.preventDefault(); this.range.focus(); this.stage.setPointerCapture(e.pointerId); this.dragging = true; move(e); });
  this.stage.addEventListener('pointermove', e => { if(this.dragging) move(e); });
  for (const event of ['pointerup','pointercancel','lostpointercapture']) this.stage.addEventListener(event, () => this.dragging = false);
  mount.querySelector('.reset-position').onclick = () => this.setPosition(50);
  mount.querySelectorAll('[data-view]').forEach(b => b.onclick = () => this.selectView(b.dataset.view));
 }
 setPosition(value) { this.position = Math.max(0,Math.min(100,Math.round(value))); this.range.value = this.position; this.range.setAttribute('aria-valuetext',`원본 ${this.position}%, 결과 ${100-this.position}%`); this.stage.style.setProperty('--split',`${this.position}%`); }
 setFeature(pairs, view = 'context') { this.pairs = pairs; this.selectView(view); }
 selectView(view) { this.view = view; const pair = this.pairs.find(p=>p.view===view); this.mount.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.view===view))); this.load(pair); }
 async load(pair) {
  const version = ++this.version; this.pair = pair; this.mount.dataset.pair = pair.id; this.mount.dataset.state = 'loading';
  this.mount.querySelector('.viewer-title').textContent = pair.feature;
  this.range.disabled = true; this.dragging = false; this.stage.setAttribute('aria-busy','true'); this.layers.hidden = true;
  this.mount.querySelectorAll('.image-label,.divider').forEach(el=>el.hidden=true);
  this.status.hidden = false; this.status.textContent = '원본과 AI 결과를 함께 불러오는 중…'; this.setPosition(50);
  try {
   const images = await Promise.all(['before','after'].map(async side => {
    const img = new Image(); img.width=1600; img.height=1000; img.alt = `${pair.feature} · ${pair.view==='context'?'넓은 영역':'확대 영역'} · ${pair[`${side}_label`]}`;
    img.className = side; img.decoding='async'; img.fetchPriority=this.priority?'high':'auto'; img.src=pair[`${side}URL`]; await img.decode();
    if(img.naturalWidth!==1600 || img.naturalHeight!==1000) throw new Error('Invalid image dimensions'); return img;
   }));
   if(version!==this.version) return;
   this.layers.replaceChildren(...images); this.layers.hidden=false;
   this.mount.querySelector('.before-label').textContent = pair.before_label.replace(' · AI 표시 OFF',' 영상');
   this.mount.querySelector('.after-label').textContent = pair.after_label.replace(' · ON','');
   this.mount.querySelectorAll('.image-label,.divider').forEach(el=>el.hidden=false);
   this.range.disabled=false; this.status.hidden=true; this.mount.dataset.state='ready';
  } catch {
   if(version!==this.version) return;
   this.mount.dataset.state='error'; this.status.replaceChildren(); const label=document.createElement('p'); label.textContent='비교 이미지를 불러오지 못했습니다.'; const retry=document.createElement('button'); retry.className='button primary'; retry.textContent='다시 시도'; retry.onclick=()=>this.load(pair); this.status.append(label,retry);
  } finally { if(version===this.version) this.stage.setAttribute('aria-busy','false'); }
 }
}
