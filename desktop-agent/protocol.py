import math,time
ALLOWED={'BACK','FORWARD','REFRESH','ZOOM','MOVE_CURSOR','CLICK','DOUBLE_CLICK','MOUSE_DOWN','MOUSE_UP','SCROLL','SET_VOLUME','SET_BRIGHTNESS','VOLUME_STEP','BRIGHTNESS_STEP','HEARTBEAT','PAUSE','RESUME','RELEASE_ALL'}
def validate(data,last_seq):
    if not isinstance(data,dict) or data.get('type') not in ALLOWED:raise ValueError('Unsupported action')
    if type(data.get('seq')) is not int or data['seq']<=last_seq:raise ValueError('Stale sequence')
    exp=data.get('expires');now=time.time()*1000
    if not isinstance(exp,(int,float)) or isinstance(exp,bool) or not math.isfinite(exp) or not now<=exp<=now+3000:raise ValueError('Expired command')
    t=data['type'];fields={'type','seq','expires'}
    def number(k,lo,hi):
        v=data.get(k)
        if isinstance(v,bool) or not isinstance(v,(int,float)) or not math.isfinite(v) or not lo<=v<=hi:raise ValueError('Invalid '+k)
    if t=='MOVE_CURSOR':number('x',0,1);number('y',0,1);fields|={'x','y'}
    if t in {'SCROLL','VOLUME_STEP','BRIGHTNESS_STEP','SET_VOLUME','SET_BRIGHTNESS'}:
        lo,hi=(-500,500) if t=='SCROLL' else ((-10,10) if t.endswith('STEP') else (0,100));number('value',lo,hi);fields.add('value')
    if t=='ZOOM':number('value',-.2,.2);fields.add('value')
    if t=='CLICK':
        if data.get('button','left') not in ('left','right'):raise ValueError('Invalid button')
        fields.add('button')
    if set(data)-fields:raise ValueError('Unknown fields')
    return data
class Controller:
    def __init__(self,adapter):self.adapter=adapter;self.paused=True;self.last_seq=0;self.last_beat=time.monotonic()
    def halt(self):self.paused=True;self.adapter.release()
    def handle(self,data):
        data=validate(data,self.last_seq);self.last_seq=data['seq'];t=data['type']
        if t=='HEARTBEAT':self.last_beat=time.monotonic();return {'ok':True}
        if t=='PAUSE':self.halt();return {'ok':True}
        if t=='RELEASE_ALL':self.adapter.release();return {'ok':True}
        if t=='RESUME':self.paused=False;self.last_beat=time.monotonic();return {'ok':True}
        if self.paused:raise ValueError('Agent is paused')
        return self.adapter.execute(data)
    def check_heartbeat(self):
        if time.monotonic()-self.last_beat>2.5:self.halt();return False
        return True
