import {
  DM_Sans,
  Fraunces,
  Libre_Baskerville,
  Manrope,
  Outfit,
  Source_Serif_4,
  Space_Grotesk,
} from "next/font/google";
import localFont from "next/font/local";

/**
 * LOH brand fonts — files in `src/fonts/` (push-safe via next/font/local).
 * Extra catalog fonts — Google (also bundled / push-safe).
 */

export const fontChalkboy = localFont({
  src: [
    {
      path: "../fonts/Font Chalkboy/Chalkboy.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/Font Chalkboy/Chalkboy.woff",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-chalkboy",
  display: "swap",
  fallback: ["sans-serif"],
});

export const fontDoublefinger = localFont({
  src: "../fonts/Doublefinger-Fun.otf",
  variable: "--font-doublefinger",
  display: "swap",
  fallback: ["sans-serif"],
});

export const fontRobgraves = localFont({
  src: "../fonts/Robgraves-lKYV.ttf",
  variable: "--font-robgraves",
  display: "swap",
  fallback: ["sans-serif"],
});

export const fontRnsSanz = localFont({
  src: [
    {
      path: "../fonts/RNS-Sanz/RNSSanz-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../fonts/RNS-Sanz/RNSSanz-Normal.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/RNS-Sanz/RNSSanz-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/RNS-Sanz/RNSSanz-SemiBold.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/RNS-Sanz/RNSSanz-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/RNS-Sanz/RNSSanz-ExtraBold.otf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../fonts/RNS-Sanz/RNSSanz-Black.otf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-rns-sanz",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const fontOutfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const fontDmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const fontSpaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const fontManrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const fontFraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const fontSourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
});

export const fontLibreBaskerville = Libre_Baskerville({
  variable: "--font-libre-baskerville",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

/** Class names to put on <html> so CSS variables are available app-wide */
export const lohFontVariableClassName = [
  fontChalkboy.variable,
  fontDoublefinger.variable,
  fontRobgraves.variable,
  fontRnsSanz.variable,
  fontOutfit.variable,
  fontDmSans.variable,
  fontSpaceGrotesk.variable,
  fontManrope.variable,
  fontFraunces.variable,
  fontSourceSerif.variable,
  fontLibreBaskerville.variable,
].join(" ");
