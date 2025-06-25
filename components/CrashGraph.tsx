
import React, { useEffect, useRef } from 'react';
import { CrashGameState, type CrashDataPoint } from '../types';

interface CrashGraphProps {
  dataPoints: CrashDataPoint[];
  gameState: CrashGameState;
  currentMultiplierValue: number; // To determine the line color based on current value
}

const PADDING = { TOP: 20, RIGHT: 30, BOTTOM: 30, LEFT: 40 };
const GRID_COLOR = 'rgba(100, 116, 139, 0.3)'; // slate-500 with opacity
const AXIS_LABEL_COLOR = 'rgb(148, 163, 184)'; // slate-400
const MIN_Y_RANGE = 2; // Minimum Y-axis range (e.g., 1x to 3x) to prevent overly flat graphs at start
const TARGET_GRID_LINES_Y = 5; // Aim for this many horizontal grid lines
const TARGET_GRID_LINES_X = 5; // Aim for this many vertical grid lines
const MAX_DATA_POINTS_OPTIMIZATION = 200; // After this many points, start downsampling older points for performance


export const CrashGraph: React.FC<CrashGraphProps> = ({ dataPoints, gameState, currentMultiplierValue }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getMultiplierLineColor = (multiplier: number): string => {
    if (multiplier < 1.5) return 'rgb(56, 189, 248)'; // sky-400
    if (multiplier < 2) return 'rgb(74, 222, 128)';  // green-400
    if (multiplier < 5) return 'rgb(250, 204, 21)';  // yellow-400
    if (multiplier < 10) return 'rgb(249, 115, 22)'; // orange-500
    return 'rgb(239, 68, 68)'; // red-500
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Responsive canvas sizing
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const canvasActualWidth = rect.width;
    const canvasActualHeight = rect.height;

    ctx.clearRect(0, 0, canvasActualWidth, canvasActualHeight);

    // Only draw graph if we are in RUNNING state or CRASHED (to show final line) and have enough data
    if (![CrashGameState.RUNNING, CrashGameState.CRASHED].includes(gameState) || dataPoints.length < 2) {
      // If not running or not enough data, just clear and potentially draw an empty grid or nothing.
      // The "Waiting for round" text is handled by CrashGameView.
      // Optionally draw empty grid here if desired for IDLE/BETTING states
        ctx.strokeStyle = GRID_COLOR;
        ctx.lineWidth = 0.5;
        // Draw basic Y-axis line
        ctx.beginPath();
        ctx.moveTo(PADDING.LEFT, PADDING.TOP);
        ctx.lineTo(PADDING.LEFT, canvasActualHeight - PADDING.BOTTOM);
        ctx.stroke();
        // Draw basic X-axis line
        ctx.beginPath();
        ctx.moveTo(PADDING.LEFT, canvasActualHeight - PADDING.BOTTOM);
        ctx.lineTo(canvasActualWidth - PADDING.RIGHT, canvasActualHeight - PADDING.BOTTOM);
        ctx.stroke();
      return;
    }
    
    let currentDataPoints = dataPoints;
    // Basic downsampling for very long rounds
    if (dataPoints.length > MAX_DATA_POINTS_OPTIMIZATION) {
        const keepEveryN = Math.ceil(dataPoints.length / MAX_DATA_POINTS_OPTIMIZATION);
        currentDataPoints = dataPoints.filter((_, i) => i % keepEveryN === 0 || i === dataPoints.length -1 );
        if (currentDataPoints.length < 2 && dataPoints.length >=2) { // ensure we have at least 2 points if original had them
            currentDataPoints = [dataPoints[0], dataPoints[dataPoints.length - 1]];
        }
    }
    if (currentDataPoints.length < 2) return;


    const startTime = currentDataPoints[0].time;
    const endTime = currentDataPoints[currentDataPoints.length - 1].time;
    const timeRange = Math.max(1000, endTime - startTime); // Ensure minimum time range to avoid division by zero

    const maxMultiplier = Math.max(...currentDataPoints.map(p => p.multiplier), 1.05); // Ensure a little space above 1x
    const yMin = 1.0;
    const yMax = Math.max(yMin + MIN_Y_RANGE, maxMultiplier); // Ensure a minimum visible range
    const yRange = yMax - yMin;

    const graphWidth = canvasActualWidth - PADDING.LEFT - PADDING.RIGHT;
    const graphHeight = canvasActualHeight - PADDING.TOP - PADDING.BOTTOM;

    // Draw Grid Lines (Y-axis - Multiplier)
    ctx.strokeStyle = GRID_COLOR;
    ctx.fillStyle = AXIS_LABEL_COLOR;
    ctx.lineWidth = 0.5;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';

    const yGridStep = Math.max(0.1, Math.pow(10, Math.floor(Math.log10(yRange / TARGET_GRID_LINES_Y))));
    for (let m = yMin; m <= yMax + (yGridStep/2); m += yGridStep) {
        if (m < yMin) continue; // Skip lines below yMin that might occur due to step logic
        const yPos = PADDING.TOP + graphHeight - ((m - yMin) / yRange) * graphHeight;
        if (yPos < PADDING.TOP || yPos > PADDING.TOP + graphHeight) continue;

        ctx.beginPath();
        ctx.moveTo(PADDING.LEFT, yPos);
        ctx.lineTo(PADDING.LEFT + graphWidth, yPos);
        ctx.stroke();
        if (m === yMin || m % (yGridStep * 2) < yGridStep || yGridStep < 0.5) { // Avoid cluttered labels
             ctx.fillText(m.toFixed(m < 2 ? 2 : (m < 10 ? 1: 0)) + 'x', PADDING.LEFT - 5, yPos + 3);
        }
    }

    // Draw Grid Lines (X-axis - Time)
    const xGridStepTime = Math.max(1000, Math.ceil(timeRange / TARGET_GRID_LINES_X / 1000) * 1000); // In ms, round to seconds
    ctx.textAlign = 'center';
    for (let t = 0; t <= timeRange; t += xGridStepTime) {
      const xPos = PADDING.LEFT + (t / timeRange) * graphWidth;
      if (xPos < PADDING.LEFT || xPos > PADDING.LEFT + graphWidth) continue;

      ctx.beginPath();
      ctx.moveTo(xPos, PADDING.TOP);
      ctx.lineTo(xPos, PADDING.TOP + graphHeight);
      ctx.stroke();
      if (t > 0) { // Don't label 0s if it's too close to Y axis labels
        ctx.fillText(`${(t / 1000).toFixed(0)}s`, xPos, PADDING.TOP + graphHeight + 15);
      }
    }


    // Draw Graph Line
    ctx.beginPath();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = getMultiplierLineColor(currentMultiplierValue);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    currentDataPoints.forEach((point, index) => {
      const x = PADDING.LEFT + ((point.time - startTime) / timeRange) * graphWidth;
      const y = PADDING.TOP + graphHeight - ((point.multiplier - yMin) / yRange) * graphHeight;
      
      // Clamp Y to prevent drawing outside graph area if data is slightly out of calculated range
      const clampedY = Math.max(PADDING.TOP, Math.min(y, PADDING.TOP + graphHeight));

      if (index === 0) {
        ctx.moveTo(x, clampedY);
      } else {
        ctx.lineTo(x, clampedY);
      }
    });
    ctx.stroke();

    // Draw a small circle at the end of the line
    if (currentDataPoints.length > 0) {
        const lastPoint = currentDataPoints[currentDataPoints.length - 1];
        const x = PADDING.LEFT + ((lastPoint.time - startTime) / timeRange) * graphWidth;
        const y = PADDING.TOP + graphHeight - ((lastPoint.multiplier - yMin) / yRange) * graphHeight;
        const clampedY = Math.max(PADDING.TOP, Math.min(y, PADDING.TOP + graphHeight));

        ctx.beginPath();
        ctx.fillStyle = getMultiplierLineColor(currentMultiplierValue);
        ctx.arc(x, clampedY, 4, 0, Math.PI * 2);
        ctx.fill();
    }


  }, [dataPoints, gameState, currentMultiplierValue]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
};
