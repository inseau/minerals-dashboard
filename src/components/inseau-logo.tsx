export function InseauLogo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="inseau"
    >
      <rect
        x={6}
        y={6}
        width={88}
        height={88}
        rx={34}
        ry={34}
        fill="none"
        stroke="currentColor"
        strokeWidth={6}
      />
      <text
        x="50%"
        y="53%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="ui-monospace, SFMono-Regular, 'Roboto Mono', Menlo, Consolas, monospace"
        fontWeight={600}
        fontSize={38}
        letterSpacing={-1}
      >
        in
      </text>
    </svg>
  );
}
