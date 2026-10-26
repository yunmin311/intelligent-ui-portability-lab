import test from 'node:test';import assert from 'node:assert/strict';
import {markdown,html} from '../../extension/src/core/render.js';import {validateSnapshot,diagnostic} from '../../extension/src/core/ir.js';
const t=text=>({text});const n=(tag,children=[],attrs={},ns='html')=>({tag,ns,attrs,style:{},children});
const snapshot=tree=>({schemaVersion:'1.4.0',kind:'ui-portability-snapshot',capability:'static',createdAt:new Date().toISOString(),source:{type:'html',origin:'local'},dimensions:{width:600,height:400},background:'#fff',tree,resources:[],provenance:{method:'local-file',status:'external-unverified'},omissions:[],limitations:[],security:{redacted:false,remoteResources:false,scripts:false}});
test('Markdown keeps nested lists, ordered starts, item values and continuation blocks',()=>{
 const s=snapshot(n('ol',[n('li',[t('Parent'),n('ul',[n('li',[t('Child')])]),n('p',[t('continued')])]),n('li',[t('Next')])],{start:'3'}));const md=markdown(s);assert.match(md,/3\. Parent\n\n   - Child/);assert.match(md,/\n   continued/);assert.match(md,/4\. Next/);
});
test('Markdown retains quote, emphasis, inline code and sub/sup meaning',()=>{const md=markdown(snapshot(n('blockquote',[n('p',[n('em',[t('emphasis')]),t(' '),n('code',[t('a|b')]),t(' H'),n('sub',[t('2')]),t('O x'),n('sup',[t('2')])])])));assert.match(md,/> \*emphasis\* `a\|b` H<sub>2<\/sub>O x<sup>2<\/sup>/);});
test('Markdown merged cells retain safe HTML table rather than misaligned pipe table',()=>{const md=markdown(snapshot(n('table',[n('tr',[n('th',[t('Group')],{colspan:'2'})]),n('tr',[n('td',[t('A')]),n('td',[t('B')])])])));assert.match(md,/<table>/);assert.match(md,/<th colspan="2">Group<\/th>/);assert.doesNotMatch(md,/\| Group/);});
test('MathML display semantics and ordered list attributes survive validated HTML',()=>{const math=n('math',[n('mfrac',[n('mi',[t('x')],{},'math'),n('mn',[t('2')],{},'math')],{},'math')],{display:'block'},'math');assert.doesNotThrow(()=>validateSnapshot(snapshot(math)));assert.match(html(snapshot(math)),/display="block"/);});

test('IR 1.0–1.3 migrate explicitly; unknown or wrongly labelled new attributes fail',async()=>{const {migrate}=await import('../../extension/src/core/ir.js');const {parseSnapshot}=await import('../../extension/src/core/import-snapshot.js');for(const schemaVersion of ['1.0.0','1.1.0','1.2.0','1.3.0']){const old={...snapshot(n('p',[t('legacy')])),schemaVersion};assert.equal(migrate(old).schemaVersion,'1.4.0');assert.equal((await parseSnapshot(JSON.stringify(old))).provenance.status,'external-unverified');}assert.throws(()=>validateSnapshot({...snapshot(n('ol',[],{start:'3'})),schemaVersion:'1.3.0'}),/1.4/);await assert.rejects(parseSnapshot(JSON.stringify({...snapshot(n('p')),schemaVersion:'9.0.0'})),/schemaVersion/);});
test('list starts handle zero, negatives and invalid values; inline code pipes remain literal',()=>{assert.match(markdown(snapshot(n('ol',[n('li',[t('zero')])],{start:'0'}))),/0\. zero/);assert.match(markdown(snapshot(n('ol',[n('li',[t('negative')])],{start:'-2'}))),/<ol start="-2">/);assert.match(markdown(snapshot(n('ol',[n('li',[t('fallback')])],{start:'nonsense'}))),/1\. fallback/);assert.match(markdown(snapshot(n('p',[n('code',[t('a|b')])]))),/`a\|b`/);});
test('mixed verified recipes plus nested Markdown blocks export MD and ZIP independently',async()=>{
 const controls=n('section',[n('input',[],{type:'number',disabled:'',min:'-100',max:'100',step:'0.01',value:'1'}),n('input',[],{type:'number',disabled:'',min:'-100',max:'100',step:'0.01',value:'2'}),n('output',[t('3')])]);
 const s=snapshot(n('main',[n('ul',[n('li',[t('item')])]),controls,n('blockquote',[n('p',[t('quote')])]),n('table',[n('tr',[n('td',[t('merged')],{colspan:'2'})])])]));s.behaviors=[{recipe:'calculator@1',bindings:{root:'0.1',left:'0.1.0',right:'0.1.1',output:'0.1.2'},state:{left:1,right:2},evidence:'model-validated-v1'}];validateSnapshot(s);assert.match(markdown(s),/- item/);assert.match(markdown(s),/> quote/);assert.match(markdown(s),/colspan="2"/);const {archive}=await import('../../extension/src/core/archive.js');assert.ok((await archive(s)).length>100);
});

test('discontinuous ordered values use HTML so CommonMark cannot renumber them',()=>{const md=markdown(snapshot(n('ol',[n('li',[t('three')]),n('li',[t('seven')],{value:'7'})],{start:'3'})));assert.match(md,/<ol start="3">/);assert.match(md,/<li value="7">seven<\/li>/);assert.match(markdown(snapshot(n('p',[n('code',[t(' foo ')])]))),/`  foo  `/);});

test('direct legacy IR1.0 Markdown subtree export remains valid',()=>{const s={...snapshot(n('div',[n('ul',[n('li',[t('legacy')])]),n('blockquote',[n('p',[t('quoted')])])])),schemaVersion:'1.0.0'};assert.match(markdown(s),/- legacy/);assert.match(markdown(s),/> quoted/);});

test('CSSOM expanded safe border/radius/overflow/column properties remain representable',async()=>{
 const {styleProps,safeCss}=await import('../../extension/src/core/policy.js');
 for(const key of ['border-top-width','border-left-style','border-bottom-color','border-top-left-radius','overflow-x','overflow-y','column-count','column-width','column-rule-width'])assert.ok(styleProps.includes(key),key);
 for(const value of ['url(https://example.com/evil)','u\\rl(x)','image-set("https://example.com")'])assert.equal(safeCss(value),false);
});

test('diagnostic exposes math display and source font families without inventing formula conversion',()=>{
 const formula=n('math',[n('mi',[t('α')],{},'math')],{display:'block'},'math');formula.style['font-family']='Source Math, serif';const s=snapshot(n('main',[formula]));const d=diagnostic(s);assert.equal(d.typography.math.block,1);assert.equal(d.typography.math.inline,0);assert.deepEqual(d.typography.sourceFontFamilies,['Source Math, serif']);assert.equal(d.typography.glyphCoverage,'unverified');assert.match(d.typography.markdown,/MathML/);
});

test('long-document runtime and published schema share dimension boundaries',async()=>{
 const {LIMITS}=await import('../../extension/src/core/ir.js');
 const {readFile}=await import('node:fs/promises');
 const schema=JSON.parse(await readFile(new URL('../../docs/snapshot.schema.json',import.meta.url),'utf8'));
 for(const axis of ['width','height']){
  assert.equal(schema.properties.dimensions.properties[axis].maximum,LIMITS.dimension);
  const s=snapshot(n('p',[t('long document')]));s.dimensions[axis]=LIMITS.dimension;
  assert.doesNotThrow(()=>validateSnapshot(s));
  s.dimensions[axis]++;assert.throws(()=>validateSnapshot(s));
 }
});

test('HTML title includes all descendant heading text',()=>{
 const s=snapshot(n('main',[n('h1',[n('span',[t('My ')]),n('em',[t('title')])])]));
 assert.match(html(s),/<title>My title<\/title>/);
});
