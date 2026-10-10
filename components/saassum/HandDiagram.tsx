export default function HandDiagram({ small = false }: { small?: boolean }) {
  return (
    <svg
      viewBox="0 0 320 340"
      role="img"
      aria-label="Illustration of hand tracking landmarks"
      className={small ? "hand small" : "hand"}
    >
      <path
        d="M112 297C92 272 54 218 48 196C42 174 58 166 72 182L100 211L95 97C94 75 115 69 120 94L131 164L138 49C140 24 162 25 164 50L170 159L181 64C184 44 205 46 205 70L202 170L219 106C225 86 245 95 241 118L232 216C228 250 203 284 199 302"
        fill="currentColor"
        fillOpacity=".05"
        stroke="currentColor"
        strokeOpacity=".32"
        strokeWidth="2"
      />
      <g fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".6">
        <path d="M153 292L104 231L65 192M153 292L128 193L115 141L108 91M153 292L160 185L155 117L151 48M153 292L190 190L194 128L194 69M153 292L218 205L228 154L231 111M128 193L160 185L190 190L218 205" />
      </g>
      {[
        [153, 292],
        [104, 231],
        [65, 192],
        [128, 193],
        [115, 141],
        [108, 91],
        [160, 185],
        [155, 117],
        [151, 48],
        [190, 190],
        [194, 128],
        [194, 69],
        [218, 205],
        [228, 154],
        [231, 111],
      ].map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i === 5 ? 7 : 3.5}
          fill="currentColor"
        />
      ))}
      <circle
        cx="108"
        cy="91"
        r="19"
        fill="none"
        stroke="currentColor"
        strokeDasharray="3 5"
      />
      <path
        d="M258 75h25v25M35 260v25h25M35 75V50h25M283 260v25h-25"
        stroke="currentColor"
        fill="none"
        opacity=".3"
      />
    </svg>
  );
}
