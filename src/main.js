import { ComparisonViewer } from './comparison.js';
import { descriptions } from './content.js';
import { contact, manifestURL } from './config.js';
const heroMount=document.querySelector('#hero-viewer');
const featureMount=document.querySelector('#feature-viewer');
async function start() {
 try {
  const response=await fetch(manifestURL); if(!response.ok) throw new Error('manifest');
  const manifest=await response.json();
  if(!Array.isArray(manifest.pairs)||!manifest.pairs.length) throw new Error('pairs');
  const groups = new Map();
  for(const p of manifest.pairs) {
   const key=p.feature.split(' · ')[0];
   if(!groups.has(key)) groups.set(key,new Map());
   const variants=groups.get(key); if(!variants.has(p.feature)) variants.set(p.feature,[]);
   variants.get(p.feature).push({...p,beforeURL:new URL(p.web?.before || p.before,manifestURL).href,afterURL:new URL(p.web?.after || p.after,manifestURL).href});
  }
  const hero=new ComparisonViewer(heroMount,{priority:true}); hero.setFeature([...groups.values()][0].values().next().value);
  const explorer=new ComparisonViewer(featureMount);
  const nav=document.querySelector('#feature-nav'); nav.replaceChildren();
  let selectedVariants, active=false;
  function setGroup(key,index) {
   selectedVariants=groups.get(key); const copy=descriptions[key];
   document.querySelector('#feature-number').textContent=String(index+1).padStart(2,'0');
   document.querySelector('#feature-title').textContent=key;
   document.querySelector('#feature-headline').textContent=copy.headline;
   document.querySelector('#feature-description').textContent=copy.description;
   document.querySelector('#feature-value').textContent=copy.value;
   nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.textContent===key)));
   const options=document.querySelector('#variant-controls'); options.replaceChildren();
   for(const [name,pairs] of selectedVariants) {
    const button=document.createElement('button'); button.textContent=name.split(' · ')[1]||'세포 라벨'; button.setAttribute('aria-pressed','false');
    button.onclick=()=>{ options.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button))); explorer.setFeature(pairs); }; options.append(button);
   }
   options.firstElementChild.setAttribute('aria-pressed','true');
   if(active) options.firstElementChild.click();
  }
  [...groups.keys()].forEach((key,index)=>{const b=document.createElement('button'); b.textContent=key;b.onclick=()=>setGroup(key,index);nav.append(b);});
  setGroup([...groups.keys()][0],0);
  new IntersectionObserver((entries,observer)=>{if(entries.some(e=>e.isIntersecting)){active=true;document.querySelector('#variant-controls button[aria-pressed="true"]').click();observer.disconnect();}},{rootMargin:'100px'}).observe(featureMount);
 } catch {
  heroMount.innerHTML='<div class="manifest-error"><p>비교 정보를 불러오지 못했습니다.</p><button class="button primary">다시 시도</button></div>';
  heroMount.querySelector('button').onclick=start;
 }
}
start();
const dialog=document.querySelector('#contact-dialog');
document.querySelector('#contact-unconfigured').onclick=()=>dialog.showModal();
dialog.querySelectorAll('button').forEach(b=>b.onclick=()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
if(contact.url && /^(https:\/\/|mailto:)/.test(contact.url)) {const a=document.querySelector('#contact-link');a.href=contact.url;a.hidden=false;document.querySelector('#contact-unconfigured').hidden=true;}
