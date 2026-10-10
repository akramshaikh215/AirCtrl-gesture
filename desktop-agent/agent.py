"""Loopback-only, origin-restricted, manually paired desktop controller."""
import asyncio,json,os,secrets,time
from websockets.asyncio.server import serve
from protocol import Controller
from adapter import WindowsAdapter
async def run_service(adapter,code,stop,origins,port=8765,ready=None):
    controller=Controller(adapter);created=time.monotonic();active=None;attempts=[]
    async def handler(ws):
        nonlocal active,code
        if active is not None:await ws.close(1008,'Another controller is connected');return
        current=time.monotonic();attempts[:]=[x for x in attempts if current-x<60]
        if len(attempts)>=5:await ws.close(1008,'Pairing rate limit');return
        attempts.append(current)
        try:
            data=json.loads(await asyncio.wait_for(ws.recv(),5))
            if not isinstance(data,dict) or set(data)!={'type','code'} or data['type']!='PAIR' or not isinstance(data['code'],str) or not secrets.compare_digest(data['code'],code) or time.monotonic()-created>300:
                await ws.send(json.dumps({'type':'ERROR','error':'Invalid or expired pairing code. Restart agent to pair.'}));return
            if active is not None:return
            active=ws;code=secrets.token_urlsafe(32);controller.last_seq=0;controller.last_beat=time.monotonic();controller.halt();start=time.monotonic();window=start;count=0
            await ws.send(json.dumps({'type':'PAIRED','capabilities':adapter.capabilities,'expires_in':900}))
            async for raw in ws:
                current=time.monotonic()
                if current-start>900:await ws.close(1008,'Session expired; restart agent to pair');break
                if current-window>=1:window=current;count=0
                count+=1
                if count>80:controller.halt();await ws.close(1008,'Rate limit');break
                seq=None
                try:
                    d=json.loads(raw);seq=d.get('seq') if isinstance(d,dict) else None;result=controller.handle(d)
                except Exception as e:
                    controller.halt();result={'ok':False,'error':str(e)}
                await ws.send(json.dumps({'seq':seq,**result}))
        except Exception:pass
        finally:
            if active is ws:controller.halt();active=None;stop.set()
    async def watchdog():
        while not stop.is_set():
            await asyncio.sleep(.2)
            if active and not controller.check_heartbeat():await active.close(1008,'Heartbeat lost')
    try:
        async with serve(handler,'127.0.0.1',port,origins=origins,max_size=2048,max_queue=1,ping_interval=10,ping_timeout=5) as server:
            if ready:ready.set_result(server.sockets[0].getsockname()[1])
            task=asyncio.create_task(watchdog())
            try:await stop.wait()
            finally:controller.halt();task.cancel()
    finally:controller.halt()
async def main():
    adapter=WindowsAdapter();code=secrets.token_urlsafe(9);stop=asyncio.Event();origins=os.getenv('SAASSUM_ORIGINS','http://localhost:3000').split(',')
    print('Airctrl · local desktop agent\nPair from your trusted local studio within 5 minutes.\nPairing code: '+code+'\nCtrl+Alt+Esc stops the agent. Screen corners activate PyAutoGUI fail-safe.\nAllowed origins: '+', '.join(origins),flush=True)
    loop=asyncio.get_running_loop()
    from pynput import keyboard
    hotkey=keyboard.GlobalHotKeys({'<ctrl>+<alt>+<esc>':lambda:loop.call_soon_threadsafe(stop.set)})
    hotkey.start()
    try:await run_service(adapter,code,stop,origins)
    finally:hotkey.stop()
if __name__=='__main__':
    try:asyncio.run(main())
    except KeyboardInterrupt:pass
