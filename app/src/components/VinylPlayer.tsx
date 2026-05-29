import React, {useEffect} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import {hueToGradient, FONTS} from '../theme';

interface Props {
  isPlaying: boolean;
  progress: number;
  albumName: string;
  artistName: string;
  hue: number;
  size: number;
}

const GROOVE_COUNT = 20;
const RPM = 33.333;
const MS_PER_REV = (60 / RPM) * 1000;

const DUST_SPECKS = [
  {angle: 15, dist: 0.38, size: 1.2, opacity: 0.12},
  {angle: 67, dist: 0.72, size: 0.8, opacity: 0.09},
  {angle: 112, dist: 0.55, size: 1.5, opacity: 0.14},
  {angle: 148, dist: 0.82, size: 0.6, opacity: 0.08},
  {angle: 190, dist: 0.44, size: 1.0, opacity: 0.11},
  {angle: 223, dist: 0.68, size: 1.3, opacity: 0.13},
  {angle: 260, dist: 0.91, size: 0.7, opacity: 0.07},
  {angle: 295, dist: 0.50, size: 1.1, opacity: 0.10},
  {angle: 330, dist: 0.76, size: 0.9, opacity: 0.12},
  {angle: 42, dist: 0.88, size: 1.4, opacity: 0.08},
  {angle: 175, dist: 0.62, size: 0.5, opacity: 0.10},
  {angle: 310, dist: 0.35, size: 1.0, opacity: 0.09},
  {angle: 85, dist: 0.95, size: 0.8, opacity: 0.06},
  {angle: 205, dist: 0.30, size: 1.2, opacity: 0.11},
];

const TONEARM_REST = -24;
const TONEARM_START = -8;
const TONEARM_END = 18;

export function VinylPlayer({
  isPlaying,
  progress,
  albumName,
  artistName,
  hue,
  size,
}: Props) {
  const rotation = useSharedValue(0);
  const tonearmAngle = useSharedValue(TONEARM_REST);
  const spunUp = useSharedValue(false);
  const p = Math.max(0, Math.min(1, progress));

  const startFullSpeed = () => {
    'worklet';
    rotation.value = withRepeat(
      withTiming(rotation.value + 360, {
        duration: MS_PER_REV,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  };

  useEffect(() => {
    if (isPlaying) {
      const targetAngle = TONEARM_START + (TONEARM_END - TONEARM_START) * p;
      tonearmAngle.value = withTiming(targetAngle, {
        duration: tonearmAngle.value < TONEARM_START ? 600 : 300,
        easing: Easing.out(Easing.cubic),
      });
      if (!spunUp.value) {
        spunUp.value = true;
        rotation.value = withTiming(
          rotation.value + 180,
          {
            duration: MS_PER_REV * 1.5,
            easing: Easing.out(Easing.quad),
          },
          () => {
            startFullSpeed();
          },
        );
      } else {
        startFullSpeed();
      }
    } else {
      cancelAnimation(rotation);
      spunUp.value = false;
      tonearmAngle.value = withTiming(TONEARM_REST, {
        duration: 500,
        easing: Easing.inOut(Easing.cubic),
      });
    }
  }, [isPlaying, p, rotation, tonearmAngle, spunUp]);

  const recordStyle = useAnimatedStyle(() => ({
    transform: [{rotate: `${rotation.value}deg`}],
  }));

  const tonearmStyle = useAnimatedStyle(() => ({
    transform: [{rotate: `${tonearmAngle.value}deg`}],
  }));

  const recordSize = size * 0.88;
  const labelSize = recordSize * 0.34;
  const holeSize = labelSize * 0.1;
  const [gradStart, gradEnd] = hueToGradient(hue);

  const initials = albumName
    .split(' ')
    .filter((w) => w.length > 1)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

  const innerRadius = labelSize / 2 + 6;
  const outerRadius = recordSize / 2 - 6;
  const grooves = Array.from({length: GROOVE_COUNT}, (_, i) => {
    const r =
      innerRadius +
      ((outerRadius - innerRadius) / GROOVE_COUNT) * (i + 0.5);
    return r;
  });

  const tonearmLength = recordSize * 0.52;
  const tonearmPivotX = size * 0.85;
  const tonearmPivotY = size * 0.02;

  return (
    <View style={[styles.container, {width: size, height: size}]}>
      <Animated.View
        style={[
          recordStyle,
          styles.record,
          {
            width: recordSize,
            height: recordSize,
            borderRadius: recordSize / 2,
          },
        ]}>
        <View
          style={[
            styles.vinylSurface,
            {
              width: recordSize,
              height: recordSize,
              borderRadius: recordSize / 2,
            },
          ]}>
          {grooves.map((r, i) => (
            <View
              key={i}
              style={[
                styles.groove,
                {
                  width: r * 2,
                  height: r * 2,
                  borderRadius: r,
                  borderWidth: StyleSheet.hairlineWidth,
                },
              ]}
            />
          ))}

          {/* Outer rim highlight */}
          <View
            style={[
              styles.outerRim,
              {
                width: recordSize - 2,
                height: recordSize - 2,
                borderRadius: (recordSize - 2) / 2,
              },
            ]}
          />

          {/* Dust specks */}
          {DUST_SPECKS.map((speck, i) => {
            const rad = (speck.angle * Math.PI) / 180;
            const r = (recordSize / 2) * speck.dist;
            return (
              <View
                key={`dust${i}`}
                style={{
                  position: 'absolute',
                  width: speck.size,
                  height: speck.size,
                  borderRadius: speck.size / 2,
                  backgroundColor: `rgba(255,255,255,${speck.opacity})`,
                  left: recordSize / 2 + Math.cos(rad) * r - speck.size / 2,
                  top: recordSize / 2 + Math.sin(rad) * r - speck.size / 2,
                }}
              />
            );
          })}

          <LinearGradient
            colors={[gradStart, gradEnd]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={[
              styles.label,
              {
                width: labelSize,
                height: labelSize,
                borderRadius: labelSize / 2,
              },
            ]}>
            {/* Worn label texture — faint radial scratches */}
            {Array.from({length: 8}).map((_, i) => {
              const angle = (i * 45 * Math.PI) / 180;
              const len = labelSize * 0.42;
              return (
                <View
                  key={`scratch${i}`}
                  style={{
                    position: 'absolute',
                    width: i % 2 === 0 ? 0.5 : 0.3,
                    height: len,
                    backgroundColor: `rgba(255,255,255,${i % 3 === 0 ? 0.06 : 0.03})`,
                    transform: [{rotate: `${i * 45}deg`}],
                  }}
                />
              );
            })}
            {/* Label edge ring */}
            <View
              style={[
                styles.labelRing,
                {
                  width: labelSize - 4,
                  height: labelSize - 4,
                  borderRadius: (labelSize - 4) / 2,
                },
              ]}
            />
            <Text
              style={[styles.labelInitials, {fontSize: labelSize * 0.3}]}>
              {initials}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                styles.labelAlbum,
                {fontSize: labelSize * 0.08, maxWidth: labelSize * 0.72},
              ]}>
              {albumName.toUpperCase()}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                styles.labelArtist,
                {fontSize: labelSize * 0.075, maxWidth: labelSize * 0.72},
              ]}>
              {artistName}
            </Text>
            <View
              style={[
                styles.hole,
                {
                  width: holeSize,
                  height: holeSize,
                  borderRadius: holeSize / 2,
                },
              ]}
            />
          </LinearGradient>
        </View>

      </Animated.View>

      {/* Sheen — fixed specular highlight that doesn't rotate */}
      <View
        style={[
          styles.sheen,
          {
            width: recordSize,
            height: recordSize,
            borderRadius: recordSize / 2,
          },
        ]}
        pointerEvents="none">
        <LinearGradient
          colors={[
            'transparent',
            'transparent',
            'rgba(255,255,255,0.10)',
            'rgba(255,255,255,0.04)',
            'transparent',
            'transparent',
          ]}
          locations={[0, 0.3, 0.42, 0.55, 0.65, 1]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <Animated.View
        style={[
          tonearmStyle,
          styles.tonearmPivot,
          {left: tonearmPivotX, top: tonearmPivotY},
        ]}>
        {/* Counterweight — behind the pivot */}
        <LinearGradient
          colors={['#aaa', '#666', '#888']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.counterweight}
        />
        <View style={styles.counterweightRing} />

        {/* Pivot base */}
        <LinearGradient
          colors={['#b0b0b0', '#666', '#888']}
          start={{x: 0.2, y: 0}}
          end={{x: 0.8, y: 1}}
          style={styles.tonearmBase}
        />
        <View style={styles.pivotDot} />

        {/* Anti-skate wire */}
        <View style={styles.antiSkate} />

        {/* Main shaft */}
        <LinearGradient
          colors={['#bbb', '#888', '#aaa']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={[styles.tonearmShaft, {height: tonearmLength}]}
        />

        {/* Headshell */}
        <LinearGradient
          colors={['#b0b0b0', '#707070']}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}
          style={[styles.headshell, {top: tonearmLength - 4}]}
        />

        {/* Cartridge */}
        <View style={[styles.cartridge, {top: tonearmLength + 8}]} />

        {/* Stylus tip */}
        <View style={[styles.stylus, {top: tonearmLength + 14}]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  record: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 12,
  },
  vinylSurface: {
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  outerRim: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  groove: {
    position: 'absolute',
    borderColor: 'rgba(255, 255, 255, 0.035)',
  },
  label: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  labelInitials: {
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    color: 'rgba(255, 240, 220, 0.85)',
  },
  labelAlbum: {
    fontFamily: FONTS.mono,
    color: 'rgba(255, 240, 220, 0.55)',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  labelArtist: {
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    color: 'rgba(255, 240, 220, 0.45)',
    marginTop: 1,
  },
  labelRing: {
    position: 'absolute',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  hole: {
    backgroundColor: '#1a1a1a',
    position: 'absolute',
  },
  sheen: {
    position: 'absolute',
    overflow: 'hidden',
  },
  tonearmPivot: {
    position: 'absolute',
    transformOrigin: 'top center',
    alignItems: 'center',
  },
  counterweight: {
    position: 'absolute',
    top: -30,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignSelf: 'center',
  },
  counterweightRing: {
    position: 'absolute',
    top: -30,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  tonearmBase: {
    position: 'absolute',
    top: -10,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignSelf: 'center',
  },
  pivotDot: {
    position: 'absolute',
    top: -3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#444',
    alignSelf: 'center',
    zIndex: 1,
  },
  antiSkate: {
    position: 'absolute',
    top: 2,
    left: -8,
    width: 10,
    height: 1,
    backgroundColor: 'rgba(180,180,180,0.5)',
    transform: [{rotate: '-25deg'}],
  },
  tonearmShaft: {
    width: 2.5,
    borderRadius: 1.25,
  },
  headshell: {
    position: 'absolute',
    width: 12,
    height: 18,
    borderRadius: 2,
    alignSelf: 'center',
  },
  cartridge: {
    position: 'absolute',
    width: 5,
    height: 7,
    backgroundColor: '#444',
    borderRadius: 1,
    alignSelf: 'center',
  },
  stylus: {
    position: 'absolute',
    width: 1.5,
    height: 3,
    backgroundColor: '#ccc',
    alignSelf: 'center',
  },
});
