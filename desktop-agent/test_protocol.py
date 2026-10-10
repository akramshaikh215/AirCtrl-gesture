import time
import pytest
from protocol import Controller,validate
class Adapter:
    def __init__(self):self.released=0;self.actions=[]
    def release(self):self.released+=1
    def execute(self,d):self.actions.append(d);return {'ok':False,'error':'unsupported'} if d['type']=='SET_BRIGHTNESS' else {'ok':True}
def message(t,seq=1,**kw):return dict(type=t,seq=seq,**{'expires':time.time()*1000+1000,**kw})
def test_paused_rejects_actions():
    c=Controller(Adapter())
    with pytest.raises(ValueError):c.handle(message('CLICK'))
def test_pause_releases_and_blocks_queued_actions():
    a=Adapter();c=Controller(a);c.handle(message('RESUME'));c.handle(message('MOUSE_DOWN',2));c.handle(message('PAUSE',3))
    assert a.released==1
    with pytest.raises(ValueError):c.handle(message('CLICK',4))
    with pytest.raises(ValueError):c.handle(message('CLICK',2))
def test_heartbeat_loss_releases():
    c=Controller(Adapter());c.last_beat=time.monotonic()-4
    assert not c.check_heartbeat();assert c.paused;assert c.adapter.released==1
@pytest.mark.parametrize('data',[message('SHELL'),message('MOVE_CURSOR',x=2,y=.5),message('SET_VOLUME',value=-1),message('CLICK',command='calc'),message('CLICK',expires=0)])
def test_invalid_commands(data):
    with pytest.raises(ValueError):validate(data,0)
def test_hardware_unsupported_is_not_success():
    c=Controller(Adapter());c.handle(message('RESUME'));assert not c.handle(message('SET_BRIGHTNESS',2,value=70))['ok']

@pytest.mark.parametrize('action',['BACK','FORWARD','REFRESH'])
def test_fixed_navigation_actions(action):
    assert validate(message(action),0)['type']==action
    with pytest.raises(ValueError):validate(message(action,command='calc'),0)

@pytest.mark.parametrize('value',[-.2,0,.2])
def test_zoom_bounds(value):
    assert validate(message('ZOOM',value=value),0)['value']==value

@pytest.mark.parametrize('value',[1,-1,float('nan')])
def test_zoom_rejects_invalid_values(value):
    with pytest.raises(ValueError):validate(message('ZOOM',value=value),0)
