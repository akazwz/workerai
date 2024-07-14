// GameOfLife.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";

// 设置画布大小和细胞大小
const canvasWidth = 800;
const canvasHeight = 600;
const cellSize = 10; // 每个细胞的像素尺寸
const gridWidth = canvasWidth / cellSize;
const gridHeight = canvasHeight / cellSize;

// 初始化细胞网格
const createEmptyGrid = () => {
  const grid = [];
  for (let i = 0; i < gridHeight; i++) {
    grid.push(Array.from(Array(gridWidth), () => 0));
  }
  return grid;
};

const GameOfLife: React.FC = () => {
  const [grid, setGrid] = useState(createEmptyGrid());
  const [running, setRunning] = useState(false);
  const runningRef = useRef(running);
  runningRef.current = running;

  const runSimulation = useCallback(() => {
    if (!runningRef.current) {
      return;
    }

    setGrid((g) => {
      // 创建下一代网格
      const newGrid = createEmptyGrid();

      for (let i = 0; i < gridHeight; i++) {
        for (let j = 0; j < gridWidth; j++) {
          let neighbors = 0;
          // 计算周围8个细胞的存活状态
          for (let ii = -1; ii <= 1; ii++) {
            for (let jj = -1; jj <= 1; jj++) {
              if (ii === 0 && jj === 0) {
                continue; // 跳过自己
              }
              const x = i + ii;
              const y = j + jj;

              // 处理边界情况
              if (x >= 0 && x < gridHeight && y >= 0 && y < gridWidth) {
                neighbors += g[x][y];
              }
            }
          }

          // 应用生命游戏的规则
          if (neighbors < 2 || neighbors > 3) {
            newGrid[i][j] = 0;
          } else if (g[i][j] === 0 && neighbors === 3) {
            newGrid[i][j] = 1;
          } else {
            newGrid[i][j] = g[i][j];
          }
        }
      }

      return newGrid;
    });

    // 请求下一帧
    requestAnimationFrame(runSimulation);
  }, []);

  useEffect(() => {
    const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;

    // 绘制网格
    const drawGrid = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      for (let i = 0; i < gridHeight; i++) {
        for (let j = 0; j < gridWidth; j++) {
          const value = grid[i][j];
          if (value) {
            ctx.fillStyle = "white";
            ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
          }
        }
      }
    };

    drawGrid();
  }, [grid]);

  return (
    <>
      <button
        onClick={() => {
          setRunning(!running);
          if (!running) {
            runningRef.current = true;
            runSimulation();
          }
        }}
      >
        {running ? "Stop" : "Start"}
      </button>
      <canvas id="gameCanvas" width={canvasWidth} height={canvasHeight} />
    </>
  );
};

export default GameOfLife;
