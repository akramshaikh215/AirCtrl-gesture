import { clamp, type Action, type Point } from './core.ts';

// Relative iris steering, not a clinical gaze estimator. Centre calibration
// removes individual offsets; looking away from centre moves the cursor.
export class EyeEngine {
  pos = {x:.5,y:.5};
  centre: Point | null = null;
  samples: Point[] = [];
  closedAt: number | null = null;
  lastClick = -Infinity;
  lastTime = 0;
  lastScroll = 0;
  centredSince: number | null = null;
  stable = 0;
  state = 'Look at the centre · calibrating';
  reset() { this.centre=null; this.samples=[]; this.lost(); }
  lost() { this.closedAt=null; this.lastTime=0; this.stable=0; this.state='Face lost · actions suspended'; }
  frame(l: Point[] | null, blink: number, t:number, scroll=false): Action[] {
    if(!l || l.length<478) { this.lost(); return []; }
    const dt = this.lastTime ? Math.min((t-this.lastTime)/1000,.05) : 0;
    this.lastTime=t;
    if(++this.stable<8) return [];
    // Freeze the pointer BEFORE measuring iris position while eyelids are closed.
    if(blink>.6) { this.closedAt ??= t; this.state='Blink · hold 0.35–0.9s, then open'; return []; }
    if(this.closedAt!==null) {
      const held=t-this.closedAt; this.closedAt=null;
      if(this.centre && held>=350 && held<=900 && t-this.lastClick>1000) {
        this.lastClick=t; this.state='Blink click'; return [{type:'CLICK'}];
      }
      return [];
    }
    const ratio=(iris:number,a:number,b:number,top:number,bottom:number)=>({
      x:(l[iris].x-l[a].x)/(l[b].x-l[a].x || .001),
      y:(l[iris].y-(l[top].y+l[bottom].y)/2)/Math.max(Math.abs(l[b].x-l[a].x),.001)
    });
    const a=ratio(468,33,133,159,145), b=ratio(473,362,263,386,374);
    const raw={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
    if(!this.centre) {
      this.samples.push(raw); this.state=`Look at the centre · calibration ${Math.min(100,Math.round(this.samples.length/60*100))}%`;
      if(this.samples.length>=60) this.centre={x:this.samples.reduce((s,p)=>s+p.x,0)/60,y:this.samples.reduce((s,p)=>s+p.y,0)/60};
      return [];
    }
    const dead=(v:number,d:number)=>Math.abs(v)>d ? v-Math.sign(v)*d : 0;
    const dx=-dead(raw.x-this.centre.x,.025),dy=dead(raw.y-this.centre.y,.018);
    this.state=scroll ? 'Eye scroll · look up/down; “eye pointer” to return' : 'Eye pointer · look to steer, centre to hold';
    if(scroll) {
      if(Math.abs(dy)<.005 && Math.abs(dx)<.01) {
        this.centredSince ??= t;
        if(t-this.centredSince>1500) {this.centredSince=null;return [{type:'EYE_POINTER'}];}
      } else this.centredSince=null;
      if(t-this.lastScroll>100 && Math.abs(dy)>.005) {this.lastScroll=t;return [{type:'SCROLL',value:clamp(-dy*1400,-90,90)}];}
      return [];
    }
    this.centredSince=null;
    this.pos={x:clamp(this.pos.x+dx*dt*3,.01,.99),y:clamp(this.pos.y+dy*dt*5,.01,.99)};
    return [{type:'MOVE_CURSOR',...this.pos}];
  }
}

export function chooseHand(hands: {categoryName:string}[][], previous:string|null, preference='auto') {
  // MediaPipe labels refer to an unmirrored frame; UI preference matches the mirrored selfie view.
  const wanted=preference==='auto' ? previous : preference==='left' ? 'Right' : 'Left';
  const matched=hands.findIndex(h=>h[0]?.categoryName===wanted);
  return matched>=0 ? matched : preference==='auto' && hands.length ? 0 : -1;
}
