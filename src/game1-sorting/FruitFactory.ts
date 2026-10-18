import Phaser from "phaser";

export type FruitType = {
  id: string;
  name: string;
  color: number;
  secondColor?: number;
  categories: number[];
  isSpecial?: boolean;
};

export const FRUITS: FruitType[] = [
  { id: "morango", name: "Morango", color: 0xff4757, categories: [0] },
  { id: "maca", name: "Maçã", color: 0xee5253, categories: [0] },
  { id: "cereja", name: "Cereja", color: 0xff6b6b, categories: [0] },
  { id: "banana", name: "Banana", color: 0xfeca57, categories: [1] },
  { id: "maracuja", name: "Maracujá", color: 0xff9f43, categories: [1] },
  { id: "caju", name: "Caju", color: 0xffb142, categories: [1] },
  { id: "uva", name: "Uva", color: 0x1dd1a1, categories: [2] },
  { id: "melancia", name: "Melancia", color: 0x10ac84, categories: [2] },
  { id: "maca_verde", name: "Maçã Verde", color: 0x2ed573, categories: [2] },
  { id: "manga", name: "Manga", color: 0xff4757, secondColor: 0xfeca57, categories: [0, 1], isSpecial: true },
  { id: "laranja", name: "Laranja", color: 0xff9f43, secondColor: 0x2ed573, categories: [1, 2], isSpecial: true },
];

export class FruitFactory {
  static createFruitContainer(scene: Phaser.Scene, fruit: FruitType, x: number, y: number): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);
    const g = scene.add.graphics();

    if (fruit.secondColor) {
      g.fillStyle(fruit.color, 1);
      g.fillSlice(0, 0, 30, Phaser.Math.DegToRad(90), Phaser.Math.DegToRad(270), true);
      g.fillStyle(fruit.secondColor, 1);
      g.fillSlice(0, 0, 30, Phaser.Math.DegToRad(270), Phaser.Math.DegToRad(90), true);
      g.lineStyle(3, 0xffffff, 1);
      g.strokeCircle(0, 0, 30);
    } else if (fruit.id === "banana") {
      g.fillStyle(fruit.color, 1);
      g.fillRoundedRect(-25, -12, 50, 24, 10);
      g.lineStyle(3, 0xffffff, 1);
      g.strokeRoundedRect(-25, -12, 50, 24, 10);
    } else if (fruit.id === "morango") {
      g.fillStyle(fruit.color, 1);
      g.fillTriangle(-22, -15, 22, -15, 0, 25);
      g.lineStyle(3, 0xffffff, 1);
      g.strokeTriangle(-22, -15, 22, -15, 0, 25);
    } else {
      g.fillStyle(fruit.color, 1);
      g.fillCircle(0, 0, 28);
      g.lineStyle(3, 0xffffff, 1);
      g.strokeCircle(0, 0, 28);
    }

    const nameText = scene.add.text(0, 0, fruit.name, {
      fontSize: "12px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5);

    container.add([g, nameText]);
    return container;
  }
}
