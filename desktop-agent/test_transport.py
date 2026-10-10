import asyncio,json,time
import pytest
from websockets.asyncio.client import connect
from websockets.exceptions import InvalidStatus
from agent import run_service
class Adapter:
    capabilities=['mouse']
    def __init__(self):self.released=0;self.actions=[]
    def release(self):self.released+=1
    def execute(self,d):self.actions.append(d);return {'ok':True}
def test_real_websocket_origin_pairing_and_disconnect():
    async def scenario():
        stop=asyncio.Event();ready=asyncio.get_running_loop().create_future();a=Adapter()
        task=asyncio.create_task(run_service(a,'test-code',stop,['http://localhost:3000'],port=0,ready=ready));port=await ready;url=f'ws://127.0.0.1:{port}'
        try:
            with pytest.raises(InvalidStatus):
                async with connect(url,origin='https://untrusted.example'):pass
            async with connect(url,origin='http://localhost:3000') as ws:
                await ws.send(json.dumps({'type':'PAIR','code':'wrong'}));r=json.loads(await ws.recv());assert r['type']=='ERROR';assert not a.actions
            async with connect(url,origin='http://localhost:3000') as ws:
                await ws.send(json.dumps({'type':'PAIR','code':'test-code'}));r=json.loads(await ws.recv());assert r['type']=='PAIRED'
                for seq,t in enumerate(['RESUME','MOUSE_DOWN','PAUSE','CLICK'],1):
                    await ws.send(json.dumps({'type':t,'seq':seq,'expires':time.time()*1000+1000}));r=json.loads(await ws.recv());assert r['ok']==(t!='CLICK')
            await asyncio.wait_for(task,3);assert a.released>=2;assert len(a.actions)==1
        finally:stop.set();await task
    asyncio.run(scenario())
