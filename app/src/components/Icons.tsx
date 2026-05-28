import React from 'react';
import Svg, {
  Path,
  Circle,
  Rect,
  Line,
  type SvgProps,
} from 'react-native-svg';

interface IconProps extends SvgProps {
  size?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
}

function Icon({
  size = 22,
  stroke = 'currentColor',
  fill = 'none',
  strokeWidth = 1.6,
  children,
  color,
  ...rest
}: IconProps & {children: React.ReactNode}) {
  const s = color ?? stroke;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={s}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}>
      {children}
    </Svg>
  );
}

export function IconSongs(p: IconProps) {
  return (
    <Icon {...p}>
      <Path d="M9 18V5l12-2v13" />
      <Circle cx={6} cy={18} r={3} />
      <Circle cx={18} cy={16} r={3} />
    </Icon>
  );
}

export function IconSearch(p: IconProps) {
  return (
    <Icon {...p}>
      <Circle cx={11} cy={11} r={7} />
      <Path d="M20 20l-3.5-3.5" />
    </Icon>
  );
}

export function IconPlaylists(p: IconProps) {
  const c = p.color ?? 'currentColor';
  return (
    <Icon {...p}>
      <Path d="M3 6h13" />
      <Path d="M3 12h13" />
      <Path d="M3 18h9" />
      <Path d="M16 14l5 3-5 3v-6z" fill={c} />
    </Icon>
  );
}

export function IconPlay(p: IconProps) {
  const c = p.color ?? 'currentColor';
  return (
    <Icon {...p}>
      <Path d="M7 4v16l13-8L7 4z" fill={c} />
    </Icon>
  );
}

export function IconPause(p: IconProps) {
  const c = p.color ?? 'currentColor';
  return (
    <Icon {...p}>
      <Rect x={6} y={4} width={4} height={16} fill={c} stroke="none" rx={0.5} />
      <Rect x={14} y={4} width={4} height={16} fill={c} stroke="none" rx={0.5} />
    </Icon>
  );
}

export function IconNext(p: IconProps) {
  const c = p.color ?? 'currentColor';
  return (
    <Icon {...p}>
      <Path d="M5 4l10 8-10 8V4z" fill={c} />
      <Path d="M19 4v16" strokeWidth={2.2} />
    </Icon>
  );
}

export function IconPrev(p: IconProps) {
  const c = p.color ?? 'currentColor';
  return (
    <Icon {...p}>
      <Path d="M19 4L9 12l10 8V4z" fill={c} />
      <Path d="M5 4v16" strokeWidth={2.2} />
    </Icon>
  );
}

export function IconShuffle(p: IconProps) {
  return (
    <Icon {...p}>
      <Path d="M16 4h5v5" />
      <Path d="M21 4l-9 9" />
      <Path d="M3 4l5.5 5.5" />
      <Path d="M21 20h-5v-5" />
      <Path d="M21 20l-7-7" />
      <Path d="M3 20l5.5-5.5" />
    </Icon>
  );
}

export function IconRepeat(p: IconProps) {
  return (
    <Icon {...p}>
      <Path d="M17 2l3 3-3 3" />
      <Path d="M3 12V9a4 4 0 014-4h13" />
      <Path d="M7 22l-3-3 3-3" />
      <Path d="M21 12v3a4 4 0 01-4 4H4" />
    </Icon>
  );
}

export function IconPlus(p: IconProps) {
  return (
    <Icon {...p}>
      <Path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function IconMore(p: IconProps) {
  const c = p.color ?? 'currentColor';
  return (
    <Icon {...p}>
      <Circle cx={5} cy={12} r={1.4} fill={c} stroke="none" />
      <Circle cx={12} cy={12} r={1.4} fill={c} stroke="none" />
      <Circle cx={19} cy={12} r={1.4} fill={c} stroke="none" />
    </Icon>
  );
}

export function IconHeart(p: IconProps) {
  return (
    <Icon {...p}>
      <Path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z" />
    </Icon>
  );
}

export function IconHeartFilled(p: IconProps) {
  const c = p.color ?? 'currentColor';
  return (
    <Icon {...p}>
      <Path
        d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z"
        fill={c}
      />
    </Icon>
  );
}

export function IconChevDown(p: IconProps) {
  return (
    <Icon {...p}>
      <Path d="M6 9l6 6 6-6" />
    </Icon>
  );
}

export function IconClose(p: IconProps) {
  return (
    <Icon {...p}>
      <Path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  );
}

export function IconEQ(p: IconProps) {
  const c = p.color ?? 'currentColor';
  return (
    <Icon {...p}>
      <Path d="M4 21V13" />
      <Path d="M12 21V11" />
      <Path d="M20 21V15" />
      <Path d="M4 9V3" />
      <Path d="M12 7V3" />
      <Path d="M20 11V3" />
      <Circle cx={4} cy={11} r={1.6} fill={c} />
      <Circle cx={12} cy={9} r={1.6} fill={c} />
      <Circle cx={20} cy={13} r={1.6} fill={c} />
    </Icon>
  );
}

export function IconFolder(p: IconProps) {
  return (
    <Icon {...p}>
      <Path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </Icon>
  );
}

export function IconUpload(p: IconProps) {
  return (
    <Icon {...p}>
      <Path d="M12 16V4" />
      <Path d="M7 9l5-5 5 5" />
      <Path d="M5 20h14" />
    </Icon>
  );
}

export function IconDisc(p: IconProps) {
  const c = p.color ?? 'currentColor';
  return (
    <Icon {...p}>
      <Circle cx={12} cy={12} r={9} />
      <Circle cx={12} cy={12} r={2.5} fill={c} />
    </Icon>
  );
}

export function IconCassette(p: IconProps) {
  return (
    <Icon {...p}>
      <Rect x={2.5} y={6} width={19} height={13} rx={2} />
      <Circle cx={8} cy={13} r={2} />
      <Circle cx={16} cy={13} r={2} />
      <Path d="M6 18l1.5-1.5h9L18 18" />
    </Icon>
  );
}

export function IconBack(p: IconProps) {
  return (
    <Icon {...p}>
      <Path d="M15 18l-6-6 6-6" />
    </Icon>
  );
}

export function IconCheck(p: IconProps) {
  return (
    <Icon {...p}>
      <Path d="M5 13l4 4 10-10" />
    </Icon>
  );
}

export function IconDrag(p: IconProps) {
  const c = p.color ?? 'currentColor';
  return (
    <Svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 14 14">
      <Circle cx={4} cy={3} r={1} fill={c} />
      <Circle cx={10} cy={3} r={1} fill={c} />
      <Circle cx={4} cy={7} r={1} fill={c} />
      <Circle cx={10} cy={7} r={1} fill={c} />
      <Circle cx={4} cy={11} r={1} fill={c} />
      <Circle cx={10} cy={11} r={1} fill={c} />
    </Svg>
  );
}
