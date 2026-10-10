import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EyeEngine,chooseHand} from '../lib/saassum/eyes.ts';
import {GestureEngine,intent} from '../lib/saassum/core.ts';
const labels=[[{categoryName:'Right'}],[{categoryName:'Left'}]];
test('automatic hand selection recovers when first hand disappears',()=>{
 assert.equal(chooseHand(labels,'Right'),0);
 assert.equal(chooseHand([labels[1]],'Right'),0);
 assert.equal(chooseHand([],'Right'),-1);
 assert.equal(chooseHand(labels,null,'left'),0);
 assert.equal(chooseHand([labels[1]],null,'left'),-1);
});
const face=()=>{
 const l=Array.from({length:478},()=>({x:.5,y:.5}));
 for(const [i,x] of [[33,.3],[133,.45],[362,.55],[263,.7],[468,.375],[473,.625]]) l[i].x=x;
 return l;
};
function calibrated(){const e=new EyeEngine();for(let i=0;i<70;i++)e.frame(face(),0,i*20);return e;}
test('eye calibration gates movement and normal blinks never click',()=>{
 const e=calibrated(); assert.ok(e.centre);
 assert.deepEqual(e.frame(face(),.9,1500),[]);
 assert.deepEqual(e.frame(face(),0,1600),[]);
});
test('deliberate blink clicks once and long closure is ignored',()=>{
 const e=calibrated();e.frame(face(),.9,1500);
 assert.deepEqual(e.frame(face(),0,2000),[{type:'CLICK'}]);
 assert.ok(!e.frame(face(),0,2020).some(a=>a.type==='CLICK'));
 e.frame(face(),.9,4000);assert.deepEqual(e.frame(face(),0,5200),[]);
});
test('face loss cancels pending blink and centre gaze exits scrolling',()=>{
 const e=calibrated(); e.frame(face(),.9,1500);e.frame(null,0,1700);
 assert.ok(!e.frame(face(),0,2000).some(a=>a.type==='CLICK'));
 const actions=[];for(let i=0;i<100;i++)actions.push(...e.frame(face(),0,2100+i*20,true));
 assert.ok(actions.some(a=>a.type==='EYE_POINTER'));
});
test('gaze steering moves cursor and vertical gaze scrolls',()=>{
 const e=calibrated(),l=face();l[468].x-=.03;l[473].x-=.03;
 const a=e.frame(l,0,1500);assert.ok(a[0].x!>.5);
 l[468].y+=.01;l[473].y+=.01;
 assert.ok(e.frame(l,0,1700,true).some(a=>a.type==='SCROLL' && a.value!<0));
});
function pose(kind:string){
 const l=Array.from({length:21},()=>({x:.5,y:.65}));l[0]={x:.5,y:.9};l[9]={x:.5,y:.6};l[3]={x:.7,y:.65};l[4]={x:.75,y:kind==='confirm'?.3:.65};
 for(const [tip,pip] of [[8,6],[12,10],[16,14],[20,18]]) {l[pip]={x:.5,y:.55};l[tip]={x:.5,y:kind==='palm'||kind==='volume'&&tip!==20?.25:.65};}
 return l;
}
test('palm pauses once, fist stops, thumbs up confirms and swipe navigates',()=>{
 for(const [kind,type] of [['palm','PAUSE'],['fist','STOP'],['confirm','CLICK']]){
 const e=new GestureEngine(),a=[];for(let i=0;i<70;i++)a.push(...e.frame(pose(kind),i*20));
 assert.equal(a.filter(v=>v.type===type).length,1,kind);
 }
 const e=new GestureEngine();for(let i=0;i<8;i++)e.frame(pose('palm'),i*20);
 const l=pose('palm');for(const pt of l)pt.x+=.22;
 assert.ok(e.frame(l,200).some(a=>a.type==='BACK'));
});
test('three fingers change volume in bounded steps',()=>{
 const e=new GestureEngine();for(let i=0;i<10;i++)e.frame(pose('volume'),i*20);
 const l=pose('volume');for(const pt of l)pt.y-=.08;
 assert.ok(e.frame(l,400).some(a=>a.type==='VOLUME_STEP'&&a.value===5));
});
test('navigation voice commands are explicit',()=>{
 for(const [phrase,type] of [['go back','BACK'],['go forward','FORWARD'],['refresh','REFRESH'],['open dashboard','DASHBOARD'],['eye scroll','EYE_SCROLL']]) assert.equal(intent(phrase)?.type,type);
 assert.equal(intent('open arbitrary website'),null);
});
