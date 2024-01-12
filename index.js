const EMPTY = 0;
const APPLE = 1;
const SNAKE_HEAD = 2;
const SNAKE_BODY = 3;

const GAME_PAUSED = 100;
const GAME_RUNNING = 101;
const GAME_OVER = 102;

const KEY_CONTROL_UP = 201;
const KEY_CONTROL_DOWN = 202;
const KEY_CONTROL_LEFT = 203;
const KEY_CONTROL_RIGHT = 204;

const KEYDOWN = 301;
const KEYUP = 302;

const point2D = (x, y) => {
  const self = { x, y };
  self.add = (other) => point2D(self.x + other.x, self.y + other.y);
  self.sub = (other) => point2D(self.x - other.x, self.y - other.y);
  return self;
}

const drawGameWith = (game, ctx, pxWidth, pxHeight) => {
  // Clear
  ctx.fillStyle = "#00FF00";
  ctx.fillRect(0, 0, pxWidth, pxHeight);

  let cellHeight = pxHeight / game.numLines;
  for (var l = 0; l < game.numLines; l++) {
    let cellWidth = pxWidth / game.numColumns;
    for (var c = 0; c < game.numColumns; c++) {
      let pxPos = { x: cellWidth * c, y: cellHeight * l };
      let gridValue = game.grid[l][c];

      switch (gridValue) {
        case SNAKE_HEAD:
        case SNAKE_BODY:
          ctx.fillStyle = game.state == GAME_OVER ? "#808080" : "#FF0000";
          ctx.fillRect(pxPos.x, pxPos.y, cellWidth, cellHeight);
          break;
        default:
          break;
      }
    }
  }
}

const placeApple = (game) => {
  while (true) {
    const randX = Math.floor(Math.random() * (game.numColumns - 1));
    const randY = Math.floor(Math.random() * (game.numLines - 1));
  }
}

const iterateGame = (game) => {
  const newSnakeDirection = point2D(0, 0);
  game.keyEventQueue.forEach(({ key, }) => {
    switch (key) {
      case KEY_CONTROL_UP:
        newSnakeDirection.y -= 1;
        break;
      case KEY_CONTROL_DOWN:
        newSnakeDirection.y += 1;
        break;
      case KEY_CONTROL_LEFT:
        newSnakeDirection.x -= 1;
        break;
      case KEY_CONTROL_RIGHT:
        newSnakeDirection.x += 1;
        break;
    }
  });
  // Our snake cannot move in diagonals so... it likes moving sideways more... I guess...
  if (newSnakeDirection.x != 0) {
    newSnakeDirection.y = 0;
  }
  // Our snake also does not like backtracking
  if (newSnakeDirection.x == -game.snakeDirection.x || newSnakeDirection.y == -game.snakeDirection.y) {
    newSnakeDirection.x = 0;
    newSnakeDirection.y = 0;
  }
  // JS is kind of cute
  game.keyEventQueue.length = 0;
  if (newSnakeDirection.x != 0 || newSnakeDirection.y != 0) {
    game.snakeDirection = newSnakeDirection;
  }

  let nextPos = game.snake[0].add(game.snakeDirection);
  const outOfRange = nextPos.x < 0 || nextPos.x >= game.numColumns || nextPos.y < 0 || nextPos.y >= game.numLines;
  if (outOfRange) {
    game.state = GAME_OVER;
    return;
  }
  if (game.grid[nextPos.y][nextPos.x] != EMPTY) {
    game.state = GAME_OVER;
    return;
  }

  let lastSnakeSegment = game.snake[game.snake.length - 1];
  // Erase last segment
  game.grid[lastSnakeSegment.y][lastSnakeSegment.x] = EMPTY;
  // Place head
  game.grid[nextPos.y][nextPos.x] = SNAKE_HEAD;
  // Replace old head with a body
  game.grid[game.snake[0].y][game.snake[0].x] = SNAKE_BODY;
  for (var i = 0; i < game.snake.length; i++) {
    let prevPos = game.snake[i];
    game.snake[i] = nextPos;
    nextPos = prevPos;
  }
}

const gameRestart = (game) => {
  game.grid.length = 0;
  for (var l = 0; l < game.numLines; l++) {
    const line = [];
    for (var c = 0; c < game.numColumns; c++) {
      line.push(EMPTY);
    }
    game.grid.push(line);
  }

  const snakeHeadPos = point2D(Math.floor(game.numColumns/2), Math.floor(game.numLines/2));

  game.snake.length = 0;
  game.snake.push(snakeHeadPos);
  game.grid[snakeHeadPos.y][snakeHeadPos.x] = SNAKE_HEAD;

  const snakeBodyLen = 3;
  let snakeBodyPos = snakeHeadPos;
  for (var i = 0; i < snakeBodyLen; i++) {
    snakeBodyPos = snakeBodyPos.add(point2D(0, 1));
    game.snake.push(snakeBodyPos);
    game.grid[snakeBodyPos.y][snakeBodyPos.x] = SNAKE_BODY;
  }

  game.snakeDirection = point2D(0, -1); // Up
  game.state = GAME_RUNNING;
}

const makeGame = (lines, columns) => {
  const keyEventQueue = [];

  const game = {
    grid: [],
    snake: [],
    snakeDirection: point2D(0, 0),
    state: GAME_RUNNING,
    
    numLines: lines,
    numColumns: columns,

    keyEventQueue,

    drawWith: (ctx, pxWidth, pxHeight) => drawGameWith(game, ctx, pxWidth, pxHeight),
    iterate: () => iterateGame(game),
    notifyKey: (key, eventType) => keyEventQueue.push({ key, eventType }),
    restart: () => gameRestart(game),
  };

  game.restart();

  return game;
}

function init(_event) {
  const canvas = document.getElementById("tela-da-cobra");

  const ctx = canvas.getContext("2d");

  const game = makeGame(30, 20);

  const iterate = () => {
    if (game.state != GAME_RUNNING) {
      return;
    }

    game.iterate();

    game.drawWith(ctx, 400, 600);
  };

  setInterval(iterate, 180);

  window.addEventListener("keydown", (event) => {
    if (event.repeat) {
      return;
    }

    if (event.code == "KeyW" || event.code == "ArrowUp") {
      game.notifyKey(KEY_CONTROL_UP, KEYDOWN);
    }
    if (event.code == "KeyS" || event.code == "ArrowDown") {
      game.notifyKey(KEY_CONTROL_DOWN, KEYDOWN);
    }
    if (event.code == "KeyA" || event.code == "ArrowLeft") {
      game.notifyKey(KEY_CONTROL_LEFT, KEYDOWN);
    }
    if (event.code == "KeyD" || event.code == "ArrowRight") {
      game.notifyKey(KEY_CONTROL_RIGHT, KEYDOWN);
    }

    if (event.code == "KeyR") {
      game.restart();
    }
  });
}

window.addEventListener("load", init);
