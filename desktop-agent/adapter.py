"""Windows primary-display adapter; imported only when running the native agent."""
import sys,math
class WindowsAdapter:
    def __init__(self):
        if sys.platform!='win32':raise RuntimeError('This MVP desktop adapter requires Windows 10/11.')
        import pyautogui
        self.pg=pyautogui;self.pg.FAILSAFE=True;self.pg.PAUSE=0.01;self.held=False;self.volume=None;self.brightness=None;self.scroll_remainder=0;self.zoom_remainder=0
        try:
            from pycaw.pycaw import AudioUtilities
            self.volume=AudioUtilities.GetSpeakers().EndpointVolume
            self.volume.GetMasterVolumeLevelScalar()
        except Exception:self.volume=None
        try:
            import screen_brightness_control as sbc
            if sbc.get_brightness(display=0):self.brightness=sbc
        except Exception:self.brightness=None
    @property
    def capabilities(self):return ['mouse','scroll']+(['volume'] if self.volume else [])+(['brightness'] if self.brightness else [])
    def release(self):
        # Release even when PyAutoGUI's corner fail-safe is active; never disable it globally.
        if self.held:
            import ctypes
            ctypes.windll.user32.mouse_event(0x0004,0,0,0,0)
        self.held=False;self.scroll_remainder=0;self.zoom_remainder=0
    def execute(self,d):
        t=d['type'];p=self.pg
        if t=='MOVE_CURSOR':
            w,h=p.size();p.moveTo(max(1,min(w-2,round(d['x']*(w-1)))),max(1,min(h-2,round(d['y']*(h-1)))))
        elif t=='CLICK':p.click(button=d.get('button','left'))
        elif t=='DOUBLE_CLICK':p.doubleClick(interval=.10)
        elif t=='MOUSE_DOWN':
            if not self.held:p.mouseDown();self.held=True
        elif t=='MOUSE_UP':self.release()
        elif t=='BACK':p.hotkey('alt','left')
        elif t=='FORWARD':p.hotkey('alt','right')
        elif t=='REFRESH':p.hotkey('ctrl','r')
        elif t=='ZOOM':
            self.zoom_remainder+=d['value']
            if abs(self.zoom_remainder)>=.12:
                p.hotkey('ctrl','+' if self.zoom_remainder>0 else '-');self.zoom_remainder=0
        elif t=='SCROLL':
            self.scroll_remainder+=d['value']/60;steps=math.trunc(self.scroll_remainder)
            if steps:p.scroll(steps);self.scroll_remainder-=steps
        elif t in {'SET_VOLUME','VOLUME_STEP'}:
            if not self.volume:return {'ok':False,'error':'System volume is unsupported on this device'}
            v=d['value'] if t=='SET_VOLUME' else self.volume.GetMasterVolumeLevelScalar()*100+d['value'];v=max(0,min(100,v));self.volume.SetMasterVolumeLevelScalar(v/100,None);return {'ok':True,'value':round(self.volume.GetMasterVolumeLevelScalar()*100)}
        elif t in {'SET_BRIGHTNESS','BRIGHTNESS_STEP'}:
            if not self.brightness:return {'ok':False,'error':'This monitor does not expose supported brightness controls'}
            v=d['value'] if t=='SET_BRIGHTNESS' else self.brightness.get_brightness(display=0)[0]+d['value'];v=max(0,min(100,v));self.brightness.set_brightness(v,display=0);return {'ok':True,'value':self.brightness.get_brightness(display=0)[0]}
        else:return {'ok':False,'error':'Unsupported adapter action'}
        return {'ok':True}
