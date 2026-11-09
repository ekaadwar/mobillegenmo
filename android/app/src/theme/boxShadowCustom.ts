import { colors } from './colors';

export type ButtonVariant =
  | 'primary'
  | 'danger'
  | 'warning'
  | 'success'
  | 'info'
  | 'neutral'
  | 'primary-outline'
  | 'danger-outline'
  | 'warning-outline'
  | 'success-outline'
  | 'info-outline'
  | 'neutral-outline';

type BaseVariant = Exclude<ButtonVariant, `${string}-outline`>;

type VariantPalette = {
  background: string;
  hover: string;
  active: string;
  hoverText: string;
  outlineText: string;
};

interface BoxShadowInCase {
  offsetX: number;
  offsetY: number;
  blurRadius: number;
  spreadDistance: number;
  inset: boolean;
}

interface BoxShadowStyle {
  offsetX: number;
  offsetY: number;
  blurRadius: number;
  spreadDistance: number;
  color: string;
  inset: boolean;
}

interface VariantStyle {
  backgroundColor: string;
  color: string;
  hoverBackground: string;
  hoverText: string;
  borderWidth?: number;
  borderColor?: string;
  boxShadow?: BoxShadowStyle[];
  activeBackground: string;
  activeText: string;
}

const palettes: Record<BaseVariant, VariantPalette> = {
  primary: {
    background: colors.primary, hover: colors.primaryHover,
    active: colors.primaryActive, hoverText: colors.white,
    outlineText: colors.primary,
  },
  danger: {
    background: colors.danger, hover: colors.dangerHover,
    active: colors.dangerActive, hoverText: colors.white,
    outlineText: colors.danger,
  },
  warning: {
    background: colors.warning, hover: colors.warningHover,
    active: colors.warningActive, hoverText: colors.warningHoverText,
    outlineText: colors.warningActive,
  },
  success: {
    background: colors.success, hover: colors.successHover,
    active: colors.successActive, hoverText: colors.successHoverText,
    outlineText: colors.successActive,
  },
  info: {
    background: colors.info, hover: colors.infoHover,
    active: colors.infoActive, hoverText: colors.white,
    outlineText: colors.infoOutline,
  },
  neutral: {
    background: colors.neutral, hover: colors.neutralHover,
    active: colors.neutralActive, hoverText: colors.white,
    outlineText: colors.neutral,
  },
};

const boxShadowColorOutline: string[] = [
  "rgba(255, 255, 255, 0.2)", "#ffffff"]

const buttonVariants: ButtonVariant[] = [
  'primary',
  'danger',
  'warning',
  'success',
  'info',
  'neutral',
  'primary-outline',
  'danger-outline',
  'warning-outline',
  'success-outline',
  'info-outline',
  'neutral-outline'
]

const boxShadowColors: Record<ButtonVariant, string[]> = {
  'primary': ['rgba(39, 9, 150, 0.2)', '#653ff3'],
  'danger': ["rgba(150, 9, 50, 0.2)", "#f7789d"],
  'warning': ["rgba(230, 247, 166, 0.2)", "#c9ee3f"],
  'success': ["rgba(13, 212, 154, 0.2)", "#78f7d2"],
  'info': ["rgba(223, 159, 249, 0.2)", "#d278f7"],
  'neutral': ["rgba(107, 113, 117, 0.2)", "#8a9094"],
  'primary-outline': boxShadowColorOutline,
  'danger-outline': boxShadowColorOutline,
  'warning-outline': boxShadowColorOutline,
  'success-outline': boxShadowColorOutline,
  'info-outline': boxShadowColorOutline,
  'neutral-outline': boxShadowColorOutline,
}

const boxShadowInCase: BoxShadowInCase[] = [
  {
    offsetX: -2,
    offsetY: -2,
    blurRadius: 7,
    spreadDistance: 0,
    inset: false,
  },
  {
    offsetX: 2,
    offsetY: 2,
    blurRadius: 4,
    spreadDistance: 0,
    inset: true,
  }
]

const boxShadowGeneral: BoxShadowStyle[] = [
  {
    offsetX: -2,
    offsetY: -2,
    blurRadius: 4,
    spreadDistance: 0,
    color: 'rgba(0, 0, 0, 0.25)',
    inset: true,
  },
  {
    offsetX: 4,
    offsetY: 4,
    blurRadius: 8,
    spreadDistance: 0,
    color: 'rgba(0, 0, 0, 0.1)',
    inset: false,
  },
  {
    offsetX: 1,
    offsetY: 1,
    blurRadius: 2,
    spreadDistance: 0,
    color: 'rgba(0, 0, 0, 0.2)',
    inset: false,
  },
]

export const variants = buttonVariants.reduce<Record<ButtonVariant, VariantStyle>>(
  (acc, item) => {
    const outline = item.endsWith('-outline');
    const base = item.replace(/-outline$/, '') as BaseVariant;
    const palette = palettes[base];

    acc[item] = {
      backgroundColor: outline
        ? (base === 'primary' ? colors.primaryOutlineBackground : colors.background)
        : palette.background,
      color: outline ? palette.outlineText : colors.white,
      hoverBackground: palette.hover,
      hoverText: palette.hoverText,
      activeBackground: palette.active,
      activeText: colors.white,
      borderWidth: 0,
      borderColor: 'transparent',
      boxShadow: [
        ...boxShadowGeneral,
        { ...boxShadowInCase[0], color: boxShadowColors[item][0] },
        { ...boxShadowInCase[1], color: boxShadowColors[item][1] },
      ],
    };
    return acc;
  },
  {} as Record<ButtonVariant, VariantStyle>,
);