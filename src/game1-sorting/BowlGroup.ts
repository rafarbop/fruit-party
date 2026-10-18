import Phaser from "phaser";

export type BowlInfo = {
  x: number;
  y: number;
  color: number;
  category: number;
};

export class BowlGroup {
  public bowls: BowlInfo[] = [];

  constructor(private scene: Phaser.Scene) {}

  buildBowls(onSelectCategory: (category: number) => void) {
    const { width, height } = this.scene.scale;
    const bowlY = height - 110;
    const labels = ["⬅️ Vermelho", "⬇️ Amarelo", "➡️ Verde"];

    this.bowls = [
      { x: width * 0.22, y: bowlY, color: 0xff4757, category: 0 },
      { x: width * 0.5, y: bowlY, color: 0xfeca57, category: 1 },
      { x: width * 0.78, y: bowlY, color: 0x2ed573, category: 2 },
    ];

    this.bowls.forEach((b, index) => {
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(b.color, 0.9);
      graphics.beginPath();
      graphics.arc(b.x, b.y - 10, 50, 0, Math.PI, false);
      graphics.closePath();
      graphics.fillPath();
      graphics.lineStyle(4, 0xffffff, 1);
      graphics.strokePath();
      graphics.strokeEllipse(b.x, b.y - 10, 100, 20);

      this.scene.add.text(b.x, b.y + 25, labels[index], {
        fontSize: "13px",
        color: "#ffffff",
        fontStyle: "bold",
      }).setOrigin(0.5);

      const zone = this.scene.add.zone(b.x, b.y, 110, 100).setInteractive();
      zone.on("pointerdown", () => onSelectCategory(b.category));
    });
  }

  getBowl(category: number): BowlInfo {
    return this.bowls[category] || this.bowls[0];
  }
}
