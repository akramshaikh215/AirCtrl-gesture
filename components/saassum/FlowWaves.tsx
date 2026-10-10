export default function FlowWaves() {
  return <svg className="air-waves" viewBox="0 0 1100 680" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="air-spectrum" x1="100" y1="670" x2="790" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#241043"/><stop offset=".27" stopColor="#731856"/><stop offset=".48" stopColor="#d5256d"/><stop offset=".67" stopColor="#ff6541"/><stop offset=".86" stopColor="#ffad13"/><stop offset="1" stopColor="#ffe449"/>
      </linearGradient>
      <linearGradient id="air-rim" x1="100" y1="420" x2="830" y2="510" gradientUnits="userSpaceOnUse"><stop stopColor="#ffcde3"/><stop offset=".45" stopColor="#fff0cc"/><stop offset="1" stopColor="#ffb541"/></linearGradient>
      <filter id="air-shadow" x="-20%" y="-25%" width="150%" height="155%"><feDropShadow dx="0" dy="14" stdDeviation="12" floodColor="#78244e" floodOpacity=".18"/></filter>
    </defs>
    <g filter="url(#air-shadow)">
    {Array.from({length:19},(_,i)=>{
      const x=-175+i*18, y=155+i*20;
      return <path key={i} d={`M ${x} 760 C ${x-95} ${y+210}, ${x+60} ${y-155}, ${x+280} ${y} C ${x+405} ${y+105}, ${x+415} ${y+115}, ${x+600} ${y+145} C ${x+785} ${y+175}, ${x+790} ${y+245}, ${x+895} 760 Z`} fill="url(#air-spectrum)" stroke="url(#air-rim)" strokeWidth="2.2"/>;
    })}
    </g>
  </svg>;
}
