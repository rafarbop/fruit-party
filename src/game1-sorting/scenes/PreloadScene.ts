import Phaser from "phaser";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: "PreloadScene" });
  }

  preload() {
    const { width, height } = this.scale;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x2d3436, 0.8);
    progressBox.fillRoundedRect(width / 2 - 120, height / 2 - 15, 240, 30, 10);

    this.add.text(width / 2, height / 2 - 50, "Carregando Frutas 3D...", {
      fontSize: "20px",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.load.on("progress", (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xfeca57, 1);
      progressBar.fillRoundedRect(width / 2 - 115, height / 2 - 10, 230 * value, 20, 6);
    });

    this.load.on("complete", () => {
      this.scene.start("SortingGameScene");
    });

    // Asset fictício apenas para disparar a contagem do Phaser Preloader
    this.load.image("bg_placeholder", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");
  }
}
