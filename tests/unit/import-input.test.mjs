import {test} from 'node:test';
import assert from 'node:assert/strict';
import {clipboardInput,textMarkup,fileKind} from '../../extension/src/import-input.js';
test('explicit clipboard payload precedence and MIME rejection',()=>{
 const clip=(html,text,items=[])=>({items,getData:t=>t==='text/html'?html:t==='text/plain'?text:''});
 assert.equal(clipboardInput(clip('<h1>A</h1>','A')).kind,'html');
 assert.equal(clipboardInput(clip('','<script>x</script>')).kind,'text');
 assert.throws(()=>clipboardInput(clip('','')),/没有/);
 assert.throws(()=>clipboardInput(clip('','',[{kind:'file',type:'image/gif'}])),/不支持/);
 assert.throws(()=>clipboardInput(null),/数据/);
});
test('plain markup is literal, preserves newlines and rejects oversize before escaping',()=>{
 assert.equal(textMarkup('<script>\n & x'),'<pre style="white-space:pre-wrap;overflow-wrap:anywhere"><span></span>&lt;script&gt;\n &amp; x</pre>');
 assert.throws(()=>textMarkup('x'.repeat(1000001)),/100 万/);
 assert.equal(fileKind('a.md'),'text');assert.equal(fileKind('a.JSON'),'json');assert.throws(()=>fileKind('a.exe'),/不支持/);
});
