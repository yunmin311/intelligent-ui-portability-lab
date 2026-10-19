import {captureElement} from './dom.js';
import {svg} from '../core/render.js';
/* UI Portability Lab: self-contained, user-invoked page element picker.
 * No fetch, no credential access, no history enumeration, no hidden APIs.
 */
(() => {
  'use strict';
  globalThis.__uiPortabilityCleanup?.();
  globalThis.__uiPortabilityActive = true;
  const format = globalThis.__UI_PORTABILITY_FORMAT__ || 'html';
  const controlled=globalThis.__UI_PORTABILITY_CONTROLLED__===true;
  const host = document.createElement('div');
  host.dataset.uipPicker = '';
  host.style.cssText='all:initial!important;position:fixed!important;inset:0!important;z-index:2147483647!important;pointer-events:none!important';
  const shadow=host.attachShadow({mode:'open'});
  shadow.innerHTML=`<style>:host{color-scheme:light dark}.panel{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);max-width:calc(100vw - 32px);background:#202124;color:#fff;font:13px/1.5 system-ui;padding:12px;border:1px solid #5f6368;border-radius:8px;box-shadow:0 3px 16px #0005;pointer-events:auto}button{min-height:44px;padding:6px 12px;margin:8px 4px 0 0;font:inherit;border:1px solid #5f6368;border-radius:4px;background:#303134;color:#fff;cursor:pointer}button:disabled{opacity:.4}button:focus-visible{outline:2px solid #8ab4f8}#outline{position:fixed;border:2px solid #1a73e8;box-sizing:border-box;background:#1a73e815;pointer-events:none;display:none}#label{font-weight:600}#error{color:#ffb4ab;white-space:pre-wrap;max-width:620px}</style><div id="outline"></div><div class="panel"><div id="label">移动指针选择区域，单击锁定</div><div>↑ 扩大到父容器 · ↓ 返回子区域 · Enter 预览 · Esc 取消</div><div id="error" role="status"></div><button id="parent">扩大区域 ↑</button><button id="child">缩小区域 ↓</button><button id="preview">捕获并预览</button><button id="cancel">取消</button></div>`;
  document.documentElement.append(host);
  const outline=shadow.getElementById('outline');
  let last=null, locked=false, trail=[], busy=false, controller=null;
  function status(text){if(globalThis.chrome?.runtime?.id)chrome.runtime.sendMessage({type:'pickerStatus',status:text}).catch(()=>{});}
  function draw(){
    if(!last?.isConnected){last=null;outline.style.display='none';return;}
    const r=last.getBoundingClientRect();
    Object.assign(outline.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',display:'block'});
    shadow.getElementById('label').textContent=`${locked?'已锁定':'候选'}：${last.localName} · ${Math.round(r.width)} × ${Math.round(r.height)} px`;
    shadow.getElementById('parent').disabled=!last.parentElement||last.parentElement===document.documentElement;
    shadow.getElementById('child').disabled=!trail.length;
  }
  function point(e){
    if(locked||busy||e.composedPath().includes(host))return;
    const target=e.target;
    if(!(target instanceof Element))return;
    // Prefer the nearest semantic component. Generic div layouts remain adjustable.
    last=target.closest('svg,section,article,figure,table,[role="region"],[role="table"],[role="img"]')||target;
    trail=[];draw();
  }
  function parent(){if(last?.parentElement&&last.parentElement!==document.documentElement){trail.push(last);last=last.parentElement;locked=true;draw();}}
  function child(){if(trail.length){last=trail.pop();locked=true;draw();}}
  function cleanup(){
    window.removeEventListener('pointermove',point,true);window.removeEventListener('click',choose,true);
    window.removeEventListener('keydown',key,true);window.removeEventListener('scroll',draw,true);window.removeEventListener('resize',draw);
    controller?.abort();host.remove();globalThis.__uiPortabilityActive=false;delete globalThis.__uiPortabilityCleanup;
  }
  globalThis.__uiPortabilityCleanup=cleanup;
  function key(e){
    if(!['Escape','ArrowUp','ArrowDown','Enter'].includes(e.key)||(busy&&e.key!=='Escape'))return;
    e.preventDefault();e.stopImmediatePropagation();
    if(e.key==='Escape'){cleanup();status('已取消，可重新选择');}
    else if(e.key==='ArrowUp')parent();else if(e.key==='ArrowDown')child();else capture();
  }
  shadow.getElementById('parent').onclick=parent;shadow.getElementById('child').onclick=child;
  shadow.getElementById('preview').onclick=()=>capture();shadow.getElementById('cancel').onclick=()=>{cleanup();status('已取消，可重新选择');};
  function choose(e){
    if(e.composedPath().includes(host))return;
    e.preventDefault();e.stopImmediatePropagation();
    if(busy)return;
    if(!locked)point(e);
    if(last){locked=true;draw();}
  }
  async function capture(){
    if(!last||busy)return;
    busy=true;controller=new AbortController();
    const signal=controller.signal;
    shadow.getElementById('error').textContent='捕获中… Esc 可取消';
    try {
      const snapshot=await captureElement(last,{signal,controlled,exclude:host,onProgress:n=>shadow.getElementById('error').textContent=`捕获中… ${n} 节点 · Esc 可取消`});
      if(format==='svg'&&!svg(snapshot))throw Error('SVG 格式只能选择 SVG 根元素');
      if(signal.aborted)return;
      if(!globalThis.chrome?.runtime?.id)throw Error('请通过已安装扩展的 Popup 启动捕获');
      const response=await chrome.runtime.sendMessage({type:'capture',snapshot,format});
      if(response?.error)throw Error(response.error);
      cleanup();
    }catch(error){if(!signal.aborted){status('捕获失败：'+error.message);shadow.getElementById('error').textContent='捕获失败：'+error.message+'。可重选后再试。';}}
    finally{busy=false;}
  }
  window.addEventListener('pointermove',point,true);
  window.addEventListener('click',choose,true);
  window.addEventListener('keydown',key,true);
  window.addEventListener('scroll',draw,true);window.addEventListener('resize',draw);
  status('正在选择 · 单击锁定，↑ 扩大，Enter 预览，Esc 取消');
})();
