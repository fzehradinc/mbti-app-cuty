import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FIELD_HEIGHT = 300;
const FIELD_WIDTH = SCREEN_WIDTH - 56;

const NODES = [
  { id: 'INTJ', x: 0.18, y: 0.12, r: 15, color: '#7EB8D4', label: true,  tier: 1 },
  { id: 'ENFP', x: 0.72, y: 0.16, r: 14, color: '#FB923C', label: true,  tier: 1 },
  { id: 'INFJ', x: 0.38, y: 0.48, r: 13, color: '#C084FC', label: true,  tier: 1 },
  { id: 'ESTP', x: 0.62, y: 0.56, r: 13, color: '#F59E0B', label: true,  tier: 1 },
  { id: 'ENTJ', x: 0.42, y: 0.22, r: 10, color: '#9F8FEF', label: false, tier: 2 },
  { id: 'ENTP', x: 0.08, y: 0.42, r: 8,  color: '#5FC97E', label: false, tier: 2 },
  { id: 'INFP', x: 0.84, y: 0.40, r: 9,  color: '#4DBDBA', label: false, tier: 2 },
  { id: 'ENFJ', x: 0.28, y: 0.72, r: 8,  color: '#F87171', label: false, tier: 2 },
  { id: 'INTP', x: 0.52, y: 0.08, r: 5,  color: '#6AABF7', label: false, tier: 3 },
  { id: 'ISTJ', x: 0.12, y: 0.68, r: 4,  color: '#94A3B8', label: false, tier: 3 },
  { id: 'ESFJ', x: 0.78, y: 0.70, r: 5,  color: '#F472B6', label: false, tier: 3 },
  { id: 'ISFP', x: 0.56, y: 0.78, r: 4,  color: '#34D399', label: false, tier: 3 },
  { id: 'ESTJ', x: 0.90, y: 0.24, r: 4,  color: '#EAB308', label: false, tier: 3 },
  { id: 'ISTP', x: 0.48, y: 0.88, r: 3,  color: '#A1A1AA', label: false, tier: 3 },
  { id: 'ESFP', x: 0.02, y: 0.82, r: 3,  color: '#F87171', label: false, tier: 3 },
  { id: 'ISFJ', x: 0.92, y: 0.60, r: 3,  color: '#A16207', label: false, tier: 3 },
];

const LINES: [number, number][] = [
  [0, 4], [4, 2], [1, 6], [2, 3], [5, 9],
];

function FloatingNode({ node, index }: { node: typeof NODES[0]; index: number }) {
  const driftX = useRef(new Animated.Value(0)).current;
  const driftY = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 800,
      delay: 300 + index * 120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const dur = 5000 + index * 700;
    const dx = (index % 2 === 0 ? 1 : -1) * (3 + (index % 4));
    const dy = (index % 3 === 0 ? -1 : 1) * (2 + (index % 3) * 2);

    Animated.loop(
      Animated.sequence([
        Animated.timing(driftX, { toValue: dx, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(driftX, { toValue: -dx * 0.6, duration: dur * 0.8, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(driftX, { toValue: 0, duration: dur * 0.5, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(driftY, { toValue: dy, duration: dur * 1.1, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(driftY, { toValue: -dy * 0.5, duration: dur * 0.9, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(driftY, { toValue: 0, duration: dur * 0.6, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2200 + index * 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2200 + index * 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const left = node.x * FIELD_WIDTH;
  const top = node.y * FIELD_HEIGHT;
  const baseOp = node.tier === 1 ? 0.9 : node.tier === 2 ? 0.55 : 0.3;
  const glowSize = node.r * (node.tier === 1 ? 3.5 : 2.5);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: left - node.r,
        top: top - node.r,
        alignItems: 'center',
        opacity: fadeIn,
        transform: [{ translateX: driftX }, { translateY: driftY }],
      }}
    >
      {node.tier <= 2 && (
        <Animated.View
          style={{
            position: 'absolute',
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
            backgroundColor: node.color,
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.04, 0.1] }),
            left: node.r - glowSize / 2,
            top: node.r - glowSize / 2,
          }}
        />
      )}

      <Animated.View
        style={{
          width: node.r * 2,
          height: node.r * 2,
          borderRadius: node.r,
          borderWidth: node.tier === 1 ? 1.2 : 0.8,
          borderColor: node.color + (node.tier === 1 ? '50' : '30'),
          backgroundColor: node.color + (node.tier === 1 ? '12' : '08'),
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [baseOp * 0.8, baseOp] }),
        }}
      >
        <View
          style={{
            width: node.r * 0.5,
            height: node.r * 0.5,
            borderRadius: node.r * 0.25,
            backgroundColor: node.color,
            opacity: node.tier === 1 ? 0.8 : 0.5,
          }}
        />
      </Animated.View>

      {node.label && (
        <Text style={{
          marginTop: 3,
          fontSize: 9,
          fontWeight: '600',
          color: node.color,
          letterSpacing: 0.8,
          opacity: 0.65,
        }}>
          {node.id}
        </Text>
      )}
    </Animated.View>
  );
}

function ConnectionLine({ from, to }: { from: typeof NODES[0]; to: typeof NODES[0] }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.07, duration: 3500, delay: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.02, duration: 3500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const x1 = from.x * FIELD_WIDTH;
  const y1 = from.y * FIELD_HEIGHT;
  const x2 = to.x * FIELD_WIDTH;
  const y2 = to.y * FIELD_HEIGHT;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x1,
        top: y1,
        width: length,
        height: 1,
        backgroundColor: '#FFFFFF',
        opacity,
        transform: [{ rotate: `${angle}deg` }],
      }}
    />
  );
}

export default function PersonalityConstellation() {
  return (
    <View style={styles.field}>
      {LINES.map(([i, j], idx) => (
        <ConnectionLine key={`l${idx}`} from={NODES[i]} to={NODES[j]} />
      ))}
      {NODES.map((node, i) => (
        <FloatingNode key={node.id} node={node} index={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    width: FIELD_WIDTH,
    height: FIELD_HEIGHT,
    alignSelf: 'center',
    position: 'relative',
  },
});
