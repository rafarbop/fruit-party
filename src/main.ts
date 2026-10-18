import Phaser from "phaser";
import { PreloadScene } from "./game1-sorting/scenes/PreloadScene";
import { SortingGameScene } from "./game1-sorting/scenes/SortingGameScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: 450,
  height: 800,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  backgroundColor: "#353b48",
  scene: [PreloadScene, SortingGameScene],
};

new Phaser.Game(config);
