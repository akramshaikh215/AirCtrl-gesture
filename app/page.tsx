"use client";
import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ArrowRight, Hand, Eye, Mic, MousePointer2, ShieldCheck, MoveVertical, Plus, Check, Command } from "lucide-react";
import FlowWaves from "../components/saassum/FlowWaves";
const inputs = {
  hands:{label:"Hand gestures",icon:Hand,title:"A little movement. A lot of possibility.",description:"Point to move. Thumbs up to confirm. Two fingers to scroll. Choose either hand and make the workspace yours.",action:"Thumbs up → confirm",signal:"Index finger → pointer",note:"Hand control preview"},
  eyes:{label:"Eye control",icon:Eye,title:"A new way to find your way.",description:"Calibrate at centre, look to steer, and deliberately blink to click. Experimental eye steering offers another way to connect.",action:"Deliberate blink → click",signal:"Calibrated gaze → pointer",note:"Eye steering · experimental"},
  voice:{label:"Voice commands",icon:Mic,title:"You say it. Your workspace responds.",description:"“Open dashboard.” “Go back.” “Scroll down.” Supported voice commands put everyday actions within reach.",action:"“Open dashboard” → navigate",signal:"Supported speech → action",note:"Voice command preview"}
};
const faq=[
 ["Do I need an account to try it?","No. You can try Website Control without an account. Authentication and saved history require the configured Supabase and Flask services."],
 ["Does this control my whole computer?","Website Control operates inside Airctrl. Real Windows cursor, volume and application control require the separately installed and paired Python desktop agent."],
 ["Can I use it without hand gestures?","You can enable voice commands or try experimental eye steering. Eye mode needs centre calibration and deliberate blink clicks; accuracy varies with the camera and lighting. Initial permissions may require a helper."],
 ["What happens to my camera video?","Hand and face landmarks are processed in your browser. Camera frames are not uploaded to the Flask backend. Models download when needed. Browser speech services may process audio remotely."],
 ["How do I pause or stop?","Use the visible Pause or Stop controls. An open palm held still pauses hand control; a fist stops the session. Escape pauses the page, and the desktop agent has additional emergency controls."]
];
export default function Home(){
 const [selected,setSelected]=useState<keyof typeof inputs>("hands");
 const [open,setOpen]=useState<number|null>(0);
 const reduced=useReducedMotion(); const active=inputs[selected]; const Icon=active.icon;
 return <div className="air-home">
  <section className="air-hero" aria-labelledby="air-title">
    <div className="air-hero-grain"/>
    <motion.div className="air-hero-copy" initial={reduced?false:{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.7}}>
      <div className="air-kicker"><span/> A MORE HUMAN WAY TO CONNECT</div>
      <h1 id="air-title">Less reaching.<br/><span>More possibility.</span></h1>
      <p>Your hands guide. Your eyes navigate. Your voice takes control.<br className="air-desktop"/> Discover a workspace that moves with you.</p>
      <div className="air-hero-ctas"><Link className="air-primary" href="/studio">Start your flow <ArrowUpRight size={18}/></Link><a className="air-link" href="#experience">Explore the experience <ArrowRight size={16}/></a></div>
      <div className="air-trust"><ShieldCheck size={14}/> Camera stays in your browser <i/> Try without an account</div>
    </motion.div>
    <div className="air-wave-wrap"><FlowWaves/></div>
    <div className="air-float air-float-one"><span className="air-icon-circle"><MousePointer2 size={18}/></span><div><small>YOUR INTENTION</small><strong>Into action.</strong></div><ArrowUpRight size={17}/></div>
    <div className="air-float air-float-two"><span className="air-dot"/><Hand size={17}/><Eye size={17}/><Mic size={17}/><span>Three ways. Your choice.</span></div>
    <div className="air-hero-bottom"><span>DESIGNED AROUND YOU</span><a href="#experience">SCROLL TO DISCOVER <MoveVertical size={14}/></a><span>01 / AIRCTRL</span></div>
  </section>
  <section className="air-band" aria-label="Input choices"><span><Hand size={19}/> Either hand</span><span><Eye size={19}/> Eyes · experimental</span><span><Mic size={19}/> Your voice</span><span><ShieldCheck size={19}/> Local camera processing</span></section>
  <section id="experience" className="air-section air-experience">
    <div className="air-section-top"><div><span className="air-eyebrow">01 / FIND YOUR FLOW</span><h2>One workspace.<br/><em>More ways in.</em></h2></div><p>Interaction should feel comfortable.<br/>Choose the input that works for you.</p></div>
    <div className="air-experience-grid"><div className="air-input-copy">
      <div className="air-tabs" role="tablist" aria-label="Explore input modes">{(Object.keys(inputs) as (keyof typeof inputs)[]).map(key=>{const TabIcon=inputs[key].icon;return <button key={key} id={`tab-${key}`} role="tab" aria-selected={selected===key} aria-controls="input-preview" className={selected===key?"active":""} onClick={()=>setSelected(key)}><TabIcon size={17}/>{inputs[key].label}</button>})}</div>
      <div role="tabpanel" id="input-preview" aria-labelledby={`tab-${selected}`}><h3>{active.title}</h3><p>{active.description}</p><Link className="air-link" href="/studio">Try it in the studio <ArrowUpRight size={17}/></Link></div>
      <div className="air-input-foot"><Check size={15}/> You choose when control starts.</div>
    </div><div className={`air-visual air-visual-${selected}`} aria-label={`${active.note}, illustrative only`}>
      <div className="air-visual-head"><span><Command size={16}/> AIRCTRL STUDIO</span><small>Illustrative preview</small></div>
      <div className="air-orbit air-orbit-one"/><div className="air-orbit air-orbit-two"/>
      <div className="air-visual-icon"><Icon size={85} strokeWidth={.85}/></div>
      {selected==="voice"?<div className="air-voice-wave" aria-hidden="true">{Array.from({length:17},(_,i)=><i key={i} style={{height:12+(i*23%51),animationDelay:`${i*.07}s`}}/>)}</div>:<div className="air-signal-line"/>}
      <span className="air-preview-pointer"><MousePointer2 size={23}/></span>
      <div className="air-action-pill"><span className="air-dot"/>{active.action}</div><div className="air-visual-foot"><span>{active.signal}</span><span>{active.note}</span></div>
    </div></div>
  </section>
  <section id="how" className="air-how air-section"><div className="air-section-top"><div><span className="air-eyebrow">02 / FROM INTENTION TO ACTION</span><h2>A small setup.<br/>A new sense of freedom.</h2></div><Link className="air-link" href="/docs">Read the setup guide <ArrowUpRight size={17}/></Link></div><div className="air-steps">{[
    ["01","Choose your way","Hands, eyes or voice. Start with the input you’re comfortable using."],
    ["02","Make a connection","Allow camera or microphone access when you’re ready. Calibrate for a comfortable starting point."],
    ["03","Find your flow","Explore the website. Pair the local agent when you want to try native Windows control."]
  ].map(([n,title,text])=><article key={n}><span className="air-step-num">{n}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
  <section id="features" className="air-freedom"><div className="air-freedom-copy"><span className="air-eyebrow">03 / ACCESS BEYOND LIMITS</span><h2>Technology should<br/>meet you <em>where you are.</em></h2><p>Different abilities. Different preferences. Airctrl brings multiple input choices into one place, with clear feedback and control over every session.</p><Link className="air-primary air-primary-light" href="/gestures">Meet your gestures <ArrowUpRight size={18}/></Link></div><div className="air-freedom-art" aria-hidden="true"><div className="air-access-ring ring-a"/><div className="air-access-ring ring-b"/><div className="air-access-ring ring-c"/><span className="air-ring-centre"><Eye size={34} strokeWidth={1}/></span><span className="air-ring-hand"><Hand size={27}/></span><span className="air-ring-mic"><Mic size={27}/></span></div></section>
  <section className="air-section air-faq"><div><span className="air-eyebrow">04 / A LITTLE CLARITY</span><h2>Good questions.<br/><em>Clear answers.</em></h2><Link className="air-link" href="/privacy">Privacy & accessibility <ArrowUpRight size={17}/></Link></div><div className="air-faq-list">{faq.map(([q,a],i)=><div className="air-faq-item" key={q}><h3><button aria-expanded={open===i} aria-controls={`faq-${i}`} onClick={()=>setOpen(open===i?null:i)}>{q}<Plus size={19} className={open===i?"is-open":""}/></button></h3><div id={`faq-${i}`} hidden={open!==i}><p>{a}</p></div></div>)}</div></section>
  <section className="air-closing"><span className="air-eyebrow">YOUR NEXT MOVE</span><h2>Make room for<br/><em>a different kind of control.</em></h2><Link className="air-primary" href="/studio">Open Airctrl studio <ArrowUpRight size={19}/></Link><p>Nothing starts until you choose. Pause anytime.</p></section>
 </div>;
}
