import {useCallback} from 'react';
import {useWindowDimensions} from 'react-native';

const DESIGN_WIDTH = 390;

const MIN_SCALE = 0.9;
const MAX_SCALE = 1.15;
const MAX_CONTENT_WIDTH = 480;

export function useResponsive() {
  const {width, height, scale, fontScale} = useWindowDimensions();

  const scaleFactor = Math.min(
    MAX_SCALE,
    Math.max(MIN_SCALE, width / DESIGN_WIDTH),
  );

  const r = useCallback(
    (size: number) => Math.round(size * scaleFactor),
    [scaleFactor],
  );

  const horizontalPadding = Math.max(12, Math.min(24, width * 0.03));

  const contentWidth = Math.min(
    width - horizontalPadding * 2,
    MAX_CONTENT_WIDTH,
  );

  return {
    width,
    height,
    scale,
    fontScale,
    r,
    horizontalPadding,
    contentWidth,
  };
}