import { LOGO_PATHS as P } from './logo-paths';

/**
 * The Smart Labs logo as crisp vectors (traced from public/logo.png), built piece by piece with CSS animations
 * (.lb-* in home.css): SMART rises in, the yellow A arch grows and its dot bounces in, the lines draw outward,
 * LABS fades up, then a light shine sweeps across. Sharp at any screen size, no video download.
 */
export function LogoBuild() {
  const blue = '#597BE2';
  return (
    <svg className="lb" viewBox="0 -12 644 136" role="img" aria-label="Smart Labs">
      <defs>
        <linearGradient id="lb-arch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F9BD04" /><stop offset="1" stopColor="#F8A405" /></linearGradient>
        <linearGradient id="lb-labs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F89609" /><stop offset="1" stopColor="#F88C04" /></linearGradient>
        <linearGradient id="lb-shine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff" stopOpacity=".75" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id="lb-clip">{Object.values(P).map((d, i) => <path key={i} d={d} fillRule="evenodd" />)}</clipPath>
      </defs>
      <g fill={blue} fillRule="evenodd">
        <path className="lb-part lb-rise" style={{ animationDelay: '.35s' }} d={P.S} />
        <path className="lb-part lb-rise" style={{ animationDelay: '.5s' }} d={P.M} />
        <path className="lb-part lb-rise" style={{ animationDelay: '.8s' }} d={P.R} />
        <path className="lb-part lb-rise" style={{ animationDelay: '.95s' }} d={P.T} />
        <path className="lb-part lb-line-l" d={P.lineL} />
        <path className="lb-part lb-line-r" d={P.lineR} />
      </g>
      <path className="lb-part lb-arch" fill="url(#lb-arch)" fillRule="evenodd" d={P.Aarch} />
      <path className="lb-part lb-dot" fill="#F7AA07" d={P.dot} />
      <g fill="url(#lb-labs)" fillRule="evenodd">
        {[P.L, P.A2, P.B, P.S2].map((d, i) => <path key={i} className="lb-part lb-up" style={{ animationDelay: `${1.75 + i * .1}s` }} d={d} />)}
      </g>
      <g clipPath="url(#lb-clip)"><rect className="lb-shine" x="-160" y="-12" width="140" height="136" fill="url(#lb-shine)" /></g>
    </svg>
  );
}
