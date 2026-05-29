import React, {useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import {
  Canvas,
  RoundedRect,
  Circle,
  Line,
  Text as SkText,
  useFont,
  Rect,
  vec,
  Group,
  LinearGradient as SkLinearGradient,
  RadialGradient as SkRadialGradient,
  Path,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

interface Props {
  isPlaying: boolean;
  progress: number;
  trackTitle: string;
  artistName: string;
  hue: number;
  size: number;
  durationSec: number;
  albumName: string;
}

const HUB_SPOKES = 6;

function hslToHex(h: number, s: number, l: number): string {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l / 100 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function CassettePlayer({
  isPlaying,
  progress,
  trackTitle,
  artistName,
  hue,
  size,
  durationSec,
  albumName,
}: Props) {
  const w = size;
  const h = size * 0.82;
  const cornerR = 12;
  const pad = 16;

  const shellLight = hslToHex(hue, 38, 58);
  const shellMid = hslToHex(hue, 40, 45);
  const shellDark = hslToHex(hue, 42, 32);

  const p = Math.max(0, Math.min(1, progress));

  // Label area at top
  const labelX = pad;
  const labelY = pad;
  const labelW = w - pad * 2;
  const labelH = 80;

  // Tape window below label
  const windowX = pad;
  const windowY = labelY + labelH + 14;
  const windowW = w - pad * 2;
  const windowH = 92;
  const windowR = 8;

  // Reel centers inside tape window
  const reelSize = 56;
  const reelR = reelSize / 2;
  const reelCY = windowY + windowH / 2;
  const leftReelCX = windowX + windowW * 0.28;
  const rightReelCX = windowX + windowW * 0.72;

  const hubR = reelSize * 0.21;

  // Tape fill radii driven by progress
  const minFillR = hubR + 2;
  const maxFillR = reelR - 1;
  const leftFillR = maxFillR - (maxFillR - minFillR) * p;
  const rightFillR = minFillR + (maxFillR - minFillR) * p;

  // Head contact point (bottom center of window)
  const headY = windowY + windowH - 10;
  const headCX = windowX + windowW / 2;
  const headW = windowW * 0.18;

  // Footer strip below window
  const footerY = windowY + windowH + 14;
  const footerH = 18;
  const footerX = pad;
  const footerW = w - pad * 2;

  // Punch hole positions on label
  const punchR = 4;
  const punchY = labelY + labelH - 2;
  const punchLeftX = labelX + 26;
  const punchRightX = labelX + labelW - 26;

  // Screws
  const screwR = 3;
  const screwPositions = [
    {x: 10, y: 10},
    {x: w - 10, y: 10},
    {x: 10, y: footerY - 6},
    {x: w - 10, y: footerY - 6},
    {x: 10, y: h - 10},
    {x: w - 10, y: h - 10},
  ];

  const hubRotation = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      hubRotation.value = withRepeat(
        withTiming(hubRotation.value + 360, {
          duration: 1800,
          easing: Easing.linear,
        }),
        -1,
        false,
      );
    } else {
      cancelAnimation(hubRotation);
    }
  }, [isPlaying, hubRotation]);

  const leftHubAngle = useDerivedValue(() => {
    const speedFactor = leftFillR > 0 ? maxFillR / leftFillR : 1;
    return hubRotation.value * speedFactor;
  });

  const rightHubAngle = useDerivedValue(() => {
    const speedFactor = rightFillR > 0 ? maxFillR / rightFillR : 1;
    return hubRotation.value * speedFactor;
  });

  const leftTransform = useDerivedValue(() => [
    {rotate: (leftHubAngle.value * Math.PI) / 180},
  ]);

  const rightTransform = useDerivedValue(() => [
    {rotate: (rightHubAngle.value * Math.PI) / 180},
  ]);

  const monoFont = useFont(
    require('../assets/fonts/JetBrainsMono-Variable.ttf'),
    8,
  );
  const titleFont = useFont(
    require('../assets/fonts/InstrumentSerif-Italic.ttf'),
    20,
  );
  const artistFont = useFont(
    require('../assets/fonts/JetBrainsMono-Variable.ttf'),
    9,
  );

  return (
    <View style={[styles.container, {width: w, height: h}]}>
      <Canvas style={{width: w, height: h}}>
        {/* Shell body */}
        <RoundedRect x={0} y={0} width={w} height={h} r={cornerR}>
          <SkLinearGradient
            start={vec(0, 0)}
            end={vec(0, h)}
            colors={[shellLight, shellMid, shellDark]}
          />
        </RoundedRect>

        {/* Shell top highlight */}
        <RoundedRect
          x={1}
          y={1}
          width={w - 2}
          height={h / 2}
          r={cornerR}
          style="stroke"
          strokeWidth={1}
          color="rgba(255,255,255,0.25)"
        />

        {/* Shell bottom shadow */}
        <Rect
          x={0}
          y={h - 4}
          width={w}
          height={4}
          color="rgba(0,0,0,0.18)"
        />

        {/* Screws */}
        {screwPositions.map((sp, i) => (
          <React.Fragment key={`screw${i}`}>
            <Circle cx={sp.x} cy={sp.y} r={screwR}>
              <SkRadialGradient
                c={vec(sp.x - 1, sp.y - 1)}
                r={screwR}
                colors={['#d4be90', '#5a4222']}
              />
            </Circle>
            <Circle
              cx={sp.x}
              cy={sp.y}
              r={screwR}
              style="stroke"
              strokeWidth={0.5}
              color="rgba(0,0,0,0.3)"
            />
          </React.Fragment>
        ))}

        {/* ── Label area ── */}
        <RoundedRect
          x={labelX}
          y={labelY}
          width={labelW}
          height={labelH}
          r={4}
          color="#f4ebd2"
        />

        {/* Label header: Side A / Chrome */}
        {monoFont && (
          <>
            <SkText
              x={labelX + 12}
              y={labelY + 16}
              text="SIDE A"
              font={monoFont}
              color="#7a5d44"
            />
            <SkText
              x={labelX + labelW - 90}
              y={labelY + 16}
              text={`CHROME · ${Math.ceil(durationSec / 60)} MIN`}
              font={monoFont}
              color="#7a5d44"
            />
          </>
        )}

        {/* Label divider line */}
        <Line
          p1={vec(labelX + 12, labelY + 22)}
          p2={vec(labelX + labelW - 12, labelY + 22)}
          color="rgba(122,93,68,0.2)"
          strokeWidth={0.5}
        />

        {/* Track title */}
        {titleFont && (
          <SkText
            x={labelX + 12}
            y={labelY + 46}
            text={trackTitle.length > 22 ? trackTitle.slice(0, 22) + '…' : trackTitle}
            font={titleFont}
            color="#2a1e14"
          />
        )}

        {/* Artist name */}
        {artistFont && (
          <SkText
            x={labelX + 12}
            y={labelY + 62}
            text={artistName.length > 16 ? artistName.slice(0, 16) + '…' : artistName}
            font={artistFont}
            color="#5a4222"
          />
        )}

        {/* Album name — right-aligned */}
        {artistFont && albumName ? (
          <SkText
            x={labelX + labelW - 12 - artistFont.measureText(albumName.length > 16 ? albumName.slice(0, 16) + '…' : albumName).width}
            y={labelY + 62}
            text={albumName.length > 16 ? albumName.slice(0, 16) + '…' : albumName}
            font={artistFont}
            color="#8a7a64"
          />
        ) : null}

        {/* Punch holes at label bottom */}
        <Circle cx={punchLeftX} cy={punchY} r={punchR} color={shellMid} />
        <Circle cx={punchRightX} cy={punchY} r={punchR} color={shellMid} />

        {/* ── Tape window ── */}
        <RoundedRect
          x={windowX}
          y={windowY}
          width={windowW}
          height={windowH}
          r={windowR}>
          <SkLinearGradient
            start={vec(windowX, windowY)}
            end={vec(windowX, windowY + windowH)}
            colors={[
              'rgba(0,0,0,0.55)',
              'rgba(0,0,0,0.85)',
              'rgba(0,0,0,0.55)',
            ]}
          />
        </RoundedRect>

        {/* Window inner shadow */}
        <RoundedRect
          x={windowX}
          y={windowY}
          width={windowW}
          height={windowH}
          r={windowR}
          style="stroke"
          strokeWidth={1}
          color="rgba(0,0,0,0.5)"
        />

        {/* Window outer highlight */}
        <RoundedRect
          x={windowX - 0.5}
          y={windowY + windowH}
          width={windowW + 1}
          height={1}
          r={0}
          color="rgba(255,255,255,0.12)"
        />

        {/* Tape path — smooth bezier curves from each reel down to the head */}
        <Path
          color="rgba(80,55,30,0.85)"
          style="stroke"
          strokeWidth={1.5}
          path={`M ${leftReelCX} ${reelCY + leftFillR} C ${leftReelCX} ${headY}, ${headCX - headW} ${headY}, ${headCX - headW} ${headY} L ${headCX + headW} ${headY} C ${headCX + headW} ${headY}, ${rightReelCX} ${headY}, ${rightReelCX} ${reelCY + rightFillR}`}
        />
        {/* Tape thickness fill */}
        <Path
          color="rgba(50,30,12,0.15)"
          path={`M ${leftReelCX} ${reelCY + leftFillR} C ${leftReelCX} ${headY}, ${headCX - headW} ${headY}, ${headCX - headW} ${headY} L ${headCX + headW} ${headY} C ${headCX + headW} ${headY}, ${rightReelCX} ${headY}, ${rightReelCX} ${reelCY + rightFillR} L ${rightReelCX} ${reelCY + rightFillR + 1.5} C ${rightReelCX} ${headY + 1.5}, ${headCX + headW} ${headY + 1.5}, ${headCX + headW} ${headY + 1.5} L ${headCX - headW} ${headY + 1.5} C ${headCX - headW} ${headY + 1.5}, ${leftReelCX} ${headY + 1.5}, ${leftReelCX} ${reelCY + leftFillR + 1.5} Z`}
        />

        {/* Head contact bar */}
        <RoundedRect x={headCX - headW - 3} y={headY - 2.5} width={headW * 2 + 6} height={5} r={2} color="#555" />
        <RoundedRect x={headCX - headW - 3} y={headY - 2.5} width={headW * 2 + 6} height={5} r={2} style="stroke" strokeWidth={0.4} color="rgba(255,255,255,0.15)" />

        {/* ── Left reel (supply — starts full) ── */}
        <Circle
          cx={leftReelCX}
          cy={reelCY}
          r={leftFillR}
          color="rgba(60,30,10,0.7)"
        />
        {/* Wound tape rings on left reel */}
        {Array.from({length: Math.max(0, Math.floor((leftFillR - hubR - 2) / 2.5))}).map((_, i) => (
          <Circle
            key={`lt${i}`}
            cx={leftReelCX}
            cy={reelCY}
            r={hubR + 3 + i * 2.5}
            style="stroke"
            strokeWidth={0.4}
            color={i % 2 === 0 ? 'rgba(90,50,20,0.5)' : 'rgba(40,20,5,0.4)'}
          />
        ))}
        <Circle
          cx={leftReelCX}
          cy={reelCY}
          r={leftFillR}
          style="stroke"
          strokeWidth={0.5}
          color="rgba(80,40,15,0.5)"
        />

        {/* Left hub */}
        <Group
          transform={leftTransform}
          origin={vec(leftReelCX, reelCY)}>
          <Circle cx={leftReelCX} cy={reelCY} r={hubR} color="#1a1208" />
          {Array.from({length: HUB_SPOKES}).map((_, i) => {
            const angle = ((i * 360) / HUB_SPOKES) * (Math.PI / 180);
            const innerR = hubR * 0.35;
            const outerR = hubR * 0.92;
            return (
              <Line
                key={`lh${i}`}
                p1={vec(
                  leftReelCX + Math.cos(angle) * innerR,
                  reelCY + Math.sin(angle) * innerR,
                )}
                p2={vec(
                  leftReelCX + Math.cos(angle) * outerR,
                  reelCY + Math.sin(angle) * outerR,
                )}
                color="#3a2a18"
                strokeWidth={2.5}
                strokeCap="round"
              />
            );
          })}
          <Circle cx={leftReelCX} cy={reelCY} r={3.5} color="#0a0503" />
        </Group>

        {/* ── Right reel (takeup — starts empty) ── */}
        <Circle
          cx={rightReelCX}
          cy={reelCY}
          r={rightFillR}
          color="rgba(60,30,10,0.7)"
        />
        {/* Wound tape rings on right reel */}
        {Array.from({length: Math.max(0, Math.floor((rightFillR - hubR - 2) / 2.5))}).map((_, i) => (
          <Circle
            key={`rt${i}`}
            cx={rightReelCX}
            cy={reelCY}
            r={hubR + 3 + i * 2.5}
            style="stroke"
            strokeWidth={0.4}
            color={i % 2 === 0 ? 'rgba(90,50,20,0.5)' : 'rgba(40,20,5,0.4)'}
          />
        ))}
        <Circle
          cx={rightReelCX}
          cy={reelCY}
          r={rightFillR}
          style="stroke"
          strokeWidth={0.5}
          color="rgba(80,40,15,0.5)"
        />

        {/* Right hub */}
        <Group
          transform={rightTransform}
          origin={vec(rightReelCX, reelCY)}>
          <Circle cx={rightReelCX} cy={reelCY} r={hubR} color="#1a1208" />
          {Array.from({length: HUB_SPOKES}).map((_, i) => {
            const angle = ((i * 360) / HUB_SPOKES) * (Math.PI / 180);
            const innerR = hubR * 0.35;
            const outerR = hubR * 0.92;
            return (
              <Line
                key={`rh${i}`}
                p1={vec(
                  rightReelCX + Math.cos(angle) * innerR,
                  reelCY + Math.sin(angle) * innerR,
                )}
                p2={vec(
                  rightReelCX + Math.cos(angle) * outerR,
                  reelCY + Math.sin(angle) * outerR,
                )}
                color="#3a2a18"
                strokeWidth={2.5}
                strokeCap="round"
              />
            );
          })}
          <Circle cx={rightReelCX} cy={reelCY} r={3.5} color="#0a0503" />
        </Group>

        {/* ── Footer strip (pressure pad) ── */}
        <RoundedRect
          x={footerX}
          y={footerY}
          width={footerW}
          height={footerH}
          r={4}>
          <SkLinearGradient
            start={vec(footerX, footerY)}
            end={vec(footerX, footerY + footerH)}
            colors={['rgba(0,0,0,0.18)', 'rgba(0,0,0,0.32)']}
          />
        </RoundedRect>

        {/* Pressure pad teeth */}
        {[0, 1, 2, 3, 4].map((i) => {
          const cx = footerX + footerW / 2 + (i - 2) * 8;
          return (
            <RoundedRect
              key={`pp${i}`}
              x={cx - 1.5}
              y={footerY + 5}
              width={3}
              height={8}
              r={1.5}
              color="rgba(0,0,0,0.45)"
            />
          );
        })}

        {/* Write-protection tab notches */}
        <RoundedRect
          x={6}
          y={h - 14}
          width={10}
          height={8}
          r={2}
          color="rgba(0,0,0,0.2)"
        />
        <RoundedRect
          x={6}
          y={h - 14}
          width={10}
          height={8}
          r={2}
          style="stroke"
          strokeWidth={0.5}
          color="rgba(0,0,0,0.15)"
        />
        <RoundedRect
          x={w - 16}
          y={h - 14}
          width={10}
          height={8}
          r={2}
          color="rgba(0,0,0,0.2)"
        />
        <RoundedRect
          x={w - 16}
          y={h - 14}
          width={10}
          height={8}
          r={2}
          style="stroke"
          strokeWidth={0.5}
          color="rgba(0,0,0,0.15)"
        />

        {/* Embossed brand text */}
        {monoFont && (
          <SkText
            x={w / 2 - 16}
            y={footerY + footerH + 14}
            text="MUSIX"
            font={monoFont}
            color="rgba(255,255,255,0.08)"
          />
        )}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
});
