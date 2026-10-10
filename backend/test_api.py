import uuid,time
from types import SimpleNamespace
import jwt,pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from app import create_app,db
@pytest.fixture
def env(monkeypatch):
    key=rsa.generate_private_key(public_exponent=65537,key_size=2048)
    monkeypatch.setattr(jwt.PyJWKClient,'get_signing_key_from_jwt',lambda *_:SimpleNamespace(key=key.public_key()))
    app=create_app({'TESTING':True,'SQLALCHEMY_DATABASE_URI':'sqlite://','SUPABASE_URL':'https://example.supabase.co'})
    with app.app_context():db.create_all()
    def token(user):return {'Authorization':'Bearer '+jwt.encode({'sub':user,'aud':'authenticated','iss':'https://example.supabase.co/auth/v1','iat':int(time.time()),'exp':int(time.time())+60},key,algorithm='RS256')}
    return app.test_client(),token

def test_auth_and_ownership(env):
    c,token=env;a,b=str(uuid.uuid4()),str(uuid.uuid4())
    assert c.get('/api/preferences').status_code==401
    assert c.get('/api/preferences',headers={'Authorization':'Bearer fake'}).status_code==401
    r=c.post('/api/sessions',headers=token(a),json={'mode':'browser'});assert r.status_code==201;sid=r.json['id']
    assert c.patch('/api/sessions/'+sid+'/end',headers=token(b),json={}).status_code==404
    assert c.get('/api/sessions',headers=token(b)).json==[]
    event={'id':str(uuid.uuid4()),'action':'CLICK','source':'voice','result':'success'}
    for _ in range(2):assert c.post('/api/sessions/'+sid+'/events',headers=token(a),json={'events':[event]}).status_code==200
    assert c.get('/api/sessions',headers=token(a)).json[0]['command_count']==1
    assert c.get('/api/stats',headers=token(a)).json['voice_commands']==[{'action':'CLICK','count':1}]
    assert c.get('/api/stats',headers=token(b)).json['voice_commands']==[]
    for _ in range(2):assert c.patch('/api/sessions/'+sid+'/end',headers=token(a),json={}).status_code==200
    assert c.delete('/api/history',headers=token(a)).status_code==200
    assert c.get('/api/sessions',headers=token(a)).json==[]
def test_preferences_validation(env):
    c,token=env;h=token(str(uuid.uuid4()))
    assert c.put('/api/preferences',headers=h,json={'sensitivity':99}).status_code==400
    assert c.put('/api/preferences',headers=h,json={'history':False}).status_code==200
    assert c.post('/api/sessions',headers=h,json={'mode':'browser'}).status_code==409

def test_eye_navigation_events_are_accepted_and_unknown_sources_rejected(env):
    c,token=env;h=token(str(uuid.uuid4()))
    sid=c.post('/api/sessions',headers=h,json={'mode':'browser'}).json['id']
    events=[{'id':str(uuid.uuid4()),'action':action,'source':'eyes','result':'success'} for action in ['CLICK','SCROLL','BACK','FORWARD','REFRESH','DASHBOARD']]
    assert c.post('/api/sessions/'+sid+'/events',headers=h,json={'events':events}).status_code==200
    assert c.get('/api/sessions',headers=h).json[0]['command_count']==6
    events[0]['id']=str(uuid.uuid4());events[0]['source']='unknown'
    assert c.post('/api/sessions/'+sid+'/events',headers=h,json={'events':[events[0]]}).status_code==400
