"""Authenticated persistence API. This service never controls desktop hardware."""
import os, uuid, math
from datetime import datetime, timezone
from functools import wraps
import jwt
from flask import Flask, request, jsonify, g
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
from dotenv import load_dotenv
load_dotenv()
db = SQLAlchemy()
def now(): return datetime.now(timezone.utc)
DEFAULTS = dict(sensitivity=1.25,smoothing=.28,pinch=.30,debounce=400,hold=550,scroll=1,invert=False,language='en-US',history=True,gestures=True,click=True,drag=True,scrollEnabled=True,mode='browser')
class Preference(db.Model):
    __tablename__='preferences'
    user_id=db.Column(db.String(36),primary_key=True)
    data=db.Column(db.JSON,nullable=False)
    updated_at=db.Column(db.DateTime(timezone=True),nullable=False,default=now,onupdate=now)
class Session(db.Model):
    __tablename__='control_sessions'
    id=db.Column(db.String(36),primary_key=True,default=lambda:str(uuid.uuid4()))
    user_id=db.Column(db.String(36),nullable=False,index=True)
    mode=db.Column(db.String(10),nullable=False)
    status=db.Column(db.String(10),nullable=False,default='running')
    started_at=db.Column(db.DateTime(timezone=True),nullable=False,default=now)
    ended_at=db.Column(db.DateTime(timezone=True))
    command_count=db.Column(db.Integer,nullable=False,default=0)
    __table_args__=(db.CheckConstraint("mode IN ('browser','desktop')"),db.CheckConstraint("status IN ('running','ended')"),db.CheckConstraint('command_count >= 0'))
    def json(self):return dict(id=self.id,mode=self.mode,status=self.status,started_at=self.started_at.isoformat(),ended_at=self.ended_at.isoformat() if self.ended_at else None,command_count=self.command_count)
class Event(db.Model):
    __tablename__='command_events'
    id=db.Column(db.String(36),primary_key=True)
    session_id=db.Column(db.String(36),db.ForeignKey('control_sessions.id',ondelete='CASCADE'),nullable=False,index=True)
    action=db.Column(db.String(40),nullable=False)
    source=db.Column(db.String(10),nullable=False)
    result=db.Column(db.String(15),nullable=False)
    created_at=db.Column(db.DateTime(timezone=True),nullable=False,default=now)
    __table_args__=(db.CheckConstraint("source IN ('gesture','voice','eyes')"),db.CheckConstraint("result IN ('success','unsupported')"))
ACTIONS={'BACK','FORWARD','REFRESH','DASHBOARD','STUDIO','CLICK','DOUBLE_CLICK','MOUSE_DOWN','SCROLL','ZOOM','SET_VOLUME','SET_BRIGHTNESS','VOLUME_STEP','BRIGHTNESS_STEP'}
def validate_prefs(data):
    if not isinstance(data,dict) or set(data)-set(DEFAULTS):raise ValueError('Unknown preference fields')
    result={**DEFAULTS,**data}
    for key,(lo,hi) in dict(sensitivity=(.5,2),smoothing=(.1,.7),pinch=(.15,.6),debounce=(200,1000),hold=(300,1200),scroll=(.5,3)).items():
        v=result[key]
        if isinstance(v,bool) or not isinstance(v,(int,float)) or not math.isfinite(v) or not lo<=v<=hi:raise ValueError('Invalid '+key)
    for key in ['invert','history','gestures','click','drag','scrollEnabled']:
        if type(result[key]) is not bool:raise ValueError('Invalid '+key)
    if result['mode'] not in ('browser','desktop'):raise ValueError('Invalid control mode')
    if result['language'] not in ['en-US','en-IN']:raise ValueError('Unsupported language')
    return result

def create_app(config=None):
    app=Flask(__name__)
    app.config.update(SQLALCHEMY_DATABASE_URI=os.getenv('DATABASE_URL','postgresql+psycopg://saassum:saassum@localhost:5432/saassum'),MAX_CONTENT_LENGTH=65536,SUPABASE_URL=os.getenv('SUPABASE_URL','').rstrip('/'))
    if config:app.config.update(config)
    db.init_app(app);Migrate(app,db)
    CORS(app,resources={r'/api/*':{'origins':os.getenv('FRONTEND_ORIGINS','http://localhost:3000').split(',')}},allow_headers=['Authorization','Content-Type'])
    jwks=jwt.PyJWKClient(app.config['SUPABASE_URL']+'/auth/v1/.well-known/jwks.json',cache_jwk_set=True,lifespan=300) if app.config['SUPABASE_URL'] else None
    def auth(fn):
        @wraps(fn)
        def wrapped(*args,**kwargs):
            header=request.headers.get('Authorization','')
            if not header.startswith('Bearer ') or not jwks:return jsonify(error='Authentication required or Supabase not configured'),401
            token=header[7:]
            try:
                key=jwks.get_signing_key_from_jwt(token)
                claims=jwt.decode(token,key.key,algorithms=['ES256','RS256'],audience='authenticated',issuer=app.config['SUPABASE_URL']+'/auth/v1',options={'require':['exp','iat','sub','aud','iss']})
                g.user_id=str(uuid.UUID(claims['sub']))
            except Exception:return jsonify(error='Invalid or expired access token'),401
            return fn(*args,**kwargs)
        return wrapped
    def owned(sid,lock=False):
        q=db.select(Session).where(Session.id==sid,Session.user_id==g.user_id)
        if lock:q=q.with_for_update()
        s=db.session.scalar(q)
        if not s:from flask import abort;abort(404,description='Session not found')
        return s
    @app.errorhandler(Exception)
    def error(e):
        db.session.rollback()
        if isinstance(e,HTTPException):return jsonify(error=e.description),e.code
        if isinstance(e,(ValueError,TypeError,KeyError)):return jsonify(error=str(e)),400
        app.logger.exception('API failure');return jsonify(error='Service unavailable. Please try again.'),503
    @app.get('/api/health')
    def health():return jsonify(status='ok',service='saassum-api')
    @app.get('/api/me')
    @auth
    def me():return jsonify(id=g.user_id)
    @app.route('/api/preferences',methods=['GET','PUT','DELETE'])
    @auth
    def preferences():
        p=db.session.get(Preference,g.user_id)
        if request.method=='GET':return jsonify(p.data if p else DEFAULTS)
        if request.method=='DELETE':
            if p:db.session.delete(p)
            db.session.commit();return jsonify(ok=True)
        data=validate_prefs(request.get_json())
        if not p:p=Preference(user_id=g.user_id);db.session.add(p)
        p.data=data;db.session.commit();return jsonify(data)
    @app.route('/api/sessions',methods=['GET','POST'])
    @auth
    def sessions():
        if request.method=='GET':return jsonify([s.json() for s in db.session.scalars(db.select(Session).where(Session.user_id==g.user_id).order_by(Session.started_at.desc()).limit(100))])
        data=request.get_json()
        if not isinstance(data,dict) or data.get('mode') not in ('browser','desktop'):raise ValueError('Invalid mode')
        p=db.session.get(Preference,g.user_id)
        if p and not p.data.get('history',True):return jsonify(error='History disabled'),409
        s=Session(user_id=g.user_id,mode=data['mode']);db.session.add(s);db.session.commit();return jsonify(s.json()),201
    @app.post('/api/sessions/<sid>/events')
    @auth
    def events(sid):
        s=owned(sid,True)
        if s.status=='ended':return jsonify(error='Session has ended'),409
        p=db.session.get(Preference,g.user_id)
        if p and not p.data.get('history',True):return jsonify(accepted=0)
        payload=request.get_json()
        if not isinstance(payload,dict):raise ValueError('Expected an object')
        items=payload.get('events')
        if not isinstance(items,list) or len(items)>100:raise ValueError('Use batches of at most 100 events')
        count=0
        for e in items:
            if not isinstance(e,dict) or set(e)!={'id','action','source','result'}:raise ValueError('Invalid event fields')
            eid=str(uuid.UUID(e['id']))
            if e['action'] not in ACTIONS or e['source'] not in ('gesture','voice','eyes') or e['result'] not in ('success','unsupported'):raise ValueError('Invalid event')
            old=db.session.get(Event,eid)
            if old:
                if old.session_id!=s.id:raise ValueError('Duplicate event ID')
                continue
            db.session.add(Event(id=eid,session_id=s.id,action=e['action'],source=e['source'],result=e['result']));count+=1
        s.command_count+=count;db.session.commit();return jsonify(accepted=count)
    @app.patch('/api/sessions/<sid>/end')
    @auth
    def end(sid):
        s=owned(sid,True)
        if s.status!='ended':s.status='ended';s.ended_at=now();db.session.commit()
        return jsonify(s.json())
    @app.get('/api/stats')
    @auth
    def stats():
        rows=db.session.execute(db.select(Event.action,db.func.count(Event.id)).join(Session,Event.session_id==Session.id).where(Session.user_id==g.user_id,Event.source=='voice',Event.result=='success').group_by(Event.action).order_by(db.func.count(Event.id).desc()).limit(5)).all()
        return jsonify(voice_commands=[dict(action=action,count=count) for action,count in rows])
    @app.delete('/api/history')
    @auth
    def delete_history():
        ids=db.select(Session.id).where(Session.user_id==g.user_id)
        db.session.execute(db.delete(Event).where(Event.session_id.in_(ids)))
        db.session.execute(db.delete(Session).where(Session.user_id==g.user_id));db.session.commit();return jsonify(ok=True)
    return app
if __name__=='__main__':create_app().run(host='127.0.0.1',port=5000)
