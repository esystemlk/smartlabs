import { Bricolage_Grotesque, Instrument_Serif } from 'next/font/google';

// Heading fonts of the new design (homepage, login, PTE trainers). Load only where a layout uses them.
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-bricolage', display: 'swap' });
const instrument = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-instrument', display: 'swap' });

export const brandFontClass = `${bricolage.variable} ${instrument.variable}`;
