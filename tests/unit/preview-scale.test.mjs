import {test} from 'node:test';
import assert from 'node:assert/strict';
import {previewScale} from '../../extension/src/preview-scale.js';
test('preview fit never enlarges, is bounded to available width and preserves explicit zoom',()=>{
 assert.equal(previewScale('fit',341,1200),341/1200);
 assert.equal(previewScale('fit',1500,1200),1);
 assert.equal(previewScale('fit',0,1200),1/1200);
 for(const zoom of [.25,.5,.75,1,1.25,1.5,2])assert.equal(previewScale(String(zoom),341,1200),zoom);
 for(const bad of ['Infinity','NaN','0','-1','100','bad'])assert.equal(previewScale(bad,341,1200),1);
});
