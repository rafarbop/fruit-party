import Phaser from "phaser";
import * as THREE from "three";
import { ThreeManager } from "../ThreeManager";

type ItemDef = {
  id: string;
  name: string;
  categories: number[]; // 0: Vermelho, 1: Amarelo, 2: Verde
  scaleFactor: number; // Escala individual personalizada para equilibrar tamanhos 3D
  isJunk?: boolean;
};

const HEALTHY_FRUITS: ItemDef[] = [
  // Vermelhas (0)
  { id: "morango", name: "Morango", categories: [0], scaleFactor: 2.5 },
  { id: "maca", name: "Maçã", categories: [0], scaleFactor: 2.3 },
  { id: "cereja", name: "Cereja", categories: [0], scaleFactor: 2.4 },

  // Amarelas (1)
  { id: "banana", name: "Banana", categories: [1], scaleFactor: 2.0 },
  { id: "maracuja", name: "Maracujá", categories: [1], scaleFactor: 2.2 },
  { id: "manga", name: "Abacaxi / Manga", categories: [1], scaleFactor: 2.0 },

  // Verdes (2)
  { id: "melancia", name: "Melancia", categories: [2], scaleFactor: 1.6 },
  { id: "caju", name: "Pêra Verde", categories: [2], scaleFactor: 2.3 },
];

const JUNK_FOODS: ItemDef[] = [
  { id: "burger", name: "Hambúrguer", categories: [], scaleFactor: 1.6, isJunk: true },
  { id: "fries", name: "Batata Frita", categories: [], scaleFactor: 1.6, isJunk: true },
  { id: "pizza", name: "Fatia de Pizza", categories: [], scaleFactor: 1.6, isJunk: true },
  { id: "hotdog", name: "Cachorro Quente", categories: [], scaleFactor: 1.6, isJunk: true },
];

const ALL_ITEMS = [...HEALTHY_FRUITS, ...JUNK_FOODS];

export class SortingGameScene extends Phaser.Scene {
  private threeManager!: ThreeManager;
  private currentMesh: THREE.Group | null = null;
  private currentItemData: ItemDef | null = null;
  
  private fruitY: number = 4;
  private fruitX: number = 0;
  private speed: number = 0.04;
  private isFalling: boolean = false;
  private isGameStarted: boolean = false;

  private score: number = 0;
  private lives: number = 3;
  private isGameOver: boolean = false;

  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private startOverlayObjects: Phaser.GameObjects.GameObject[] = [];

  private swipeStartX: number = 0;

  constructor() {
    super({ key: "SortingGameScene" });
  }

  async create() {
    this.score = 0;
    this.lives = 3;
    this.speed = 0.04;
    this.isGameOver = false;
    this.isGameStarted = false;
    this.startOverlayObjects = [];

    const { width, height } = this.scale;

    this.createBackground(width, height);

    this.threeManager = new ThreeManager("game-container", width, height);

    try {
      await this.threeManager.initTexture();

      for (const item of ALL_ITEMS) {
        const path = item.isJunk 
          ? `assets/models/junk/${item.id}.glb`
          : `assets/models/fruits/${item.id}.glb`;
        await this.threeManager.loadModel(item.id, path).catch(e => console.warn(e));
      }

      await this.threeManager.loadModel("bowl_red", "assets/models/bowls/plate_deep.glb", 0xff4757).catch(e => console.warn(e));
      await this.threeManager.loadModel("bowl_yellow", "assets/models/bowls/plate_deep.glb", 0xfeca57).catch(e => console.warn(e));
      await this.threeManager.loadModel("bowl_green", "assets/models/bowls/plate_deep.glb", 0x2ed573).catch(e => console.warn(e));
    } catch (err) {
      console.error("Erro no carregamento 3D:", err);
    }

    this.setup3DBowls();
    this.setupTrashCan(width, height);
    this.createUI(width);
    this.setupControls();

    this.showStartScreen(width, height);
  }

  private createBackground(width: number, height: number) {
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x74b9ff, 0x74b9ff, 0xa29bfe, 0xa29bfe, 1);
    graphics.fillRect(0, 0, width, height);

    const topBar = this.add.graphics();
    topBar.fillStyle(0x2d3436, 0.4);
    topBar.fillRoundedRect(15, 15, width - 30, 60, 16);

    const counter = this.add.graphics();
    counter.fillStyle(0xdfe6e9, 0.9);
    counter.fillRoundedRect(10, height - 160, width - 20, 150, 20);
    counter.lineStyle(4, 0xb2bec3, 1);
    counter.strokeRoundedRect(10, height - 160, width - 20, 150, 20);

    const bowlPositionsX = [width * 0.22, width * 0.5, width * 0.78];
    bowlPositionsX.forEach((posX) => {
      const shadow = this.add.graphics();
      shadow.fillStyle(0x636e72, 0.3);
      shadow.fillEllipse(posX, height - 90, 100, 30);
    });
  }

  private setupTrashCan(width: number, height: number) {
    const trashWidth = 70;
    const trashHeight = 140;
    const trashX = width - 45;
    const trashY = height / 2 - 20;

    const trashContainer = this.add.graphics();
    trashContainer.fillStyle(0x2d3436, 0.9);
    trashContainer.fillRoundedRect(trashX, trashY, trashWidth, trashHeight, 15);
    trashContainer.lineStyle(3, 0x636e72, 1);
    trashContainer.strokeRoundedRect(trashX, trashY, trashWidth, trashHeight, 15);

    this.add.text(width - 15, trashY + trashHeight / 2, "🗑️\nLIXO", {
      fontSize: "14px",
      color: "#ffffff",
      fontStyle: "bold",
      align: "center",
      fontFamily: "sans-serif"
    }).setOrigin(0.5);

    const trashZone = this.add.zone(width - 25, trashY + trashHeight / 2, 70, trashHeight).setInteractive();
    trashZone.on("pointerdown", () => this.handleDiscard());
  }

  private createUI(width: number) {
    this.scoreText = this.add.text(35, 30, "PONTOS: 0", {
      fontSize: "20px",
      color: "#feca57",
      fontStyle: "bold",
      fontFamily: "sans-serif"
    });

    this.livesText = this.add.text(width - 165, 30, "VIDAS: ❤️❤️❤️", {
      fontSize: "18px",
      color: "#ffffff",
      fontStyle: "bold",
      fontFamily: "sans-serif"
    });
  }

  private setup3DBowls() {
    const positionsX = [-1.4, 0, 1.4];
    const keys = ["bowl_red", "bowl_yellow", "bowl_green"];
    const labels = ["⬅️ Vermelho", "⬇️ Amarelo", "➡️ Verde"];
    const colors = ["#ff4757", "#ffa502", "#2ed573"];
    const screenPositions = [this.scale.width * 0.22, this.scale.width * 0.5, this.scale.width * 0.78];

    positionsX.forEach((x, index) => {
      const bowl = this.threeManager.createModelInstance(keys[index]);
      if (bowl) {
        bowl.position.set(x, -3.1, 0);
        bowl.scale.set(1.5, 1.5, 1.5);
      }

      const zone = this.add.zone(screenPositions[index], this.scale.height - 85, 110, 100).setInteractive();
      zone.on("pointerdown", () => this.handleInput(index));

      const badge = this.add.graphics();
      badge.fillStyle(Phaser.Display.Color.HexStringToColor(colors[index]).color, 0.9);
      badge.fillRoundedRect(screenPositions[index] - 55, this.scale.height - 45, 110, 32, 10);

      this.add.text(screenPositions[index], this.scale.height - 29, labels[index], {
        fontSize: "13px",
        color: "#ffffff",
        fontStyle: "bold",
        fontFamily: "sans-serif"
      }).setOrigin(0.5);
    });
  }

  private setupControls() {
    if (this.input.keyboard) {
      this.input.keyboard.removeAllListeners();
      this.input.keyboard.on("keydown-LEFT", () => this.handleInput(0));
      this.input.keyboard.on("keydown-DOWN", () => this.handleInput(1));
      this.input.keyboard.on("keydown-RIGHT", () => this.handleInput(2));
      this.input.keyboard.on("keydown-SPACE", () => this.handleDiscard());
      this.input.keyboard.on("keydown-UP", () => this.handleDiscard());
    }

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.swipeStartX = pointer.x;
    });

    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      const swipeDistanceX = pointer.x - this.swipeStartX;
      if (swipeDistanceX > 60) {
        this.handleDiscard();
      }
    });
  }

  private showStartScreen(width: number, height: number) {
    const dimBg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);
    
    const cardBg = this.add.graphics();
    cardBg.fillStyle(0x2d3436, 0.95);
    cardBg.fillRoundedRect(width / 2 - 170, height / 2 - 170, 340, 340, 20);
    cardBg.lineStyle(4, 0xfeca57, 1);
    cardBg.strokeRoundedRect(width / 2 - 170, height / 2 - 170, 340, 340, 20);

    const title = this.add.text(width / 2, height / 2 - 120, "FRUIT PARTY 3D", {
      fontSize: "26px",
      color: "#feca57",
      fontStyle: "bold",
      fontFamily: "sans-serif"
    }).setOrigin(0.5);

    const instructions = this.add.text(width / 2, height / 2 - 35, 
      "• Separe as Frutas nas tigelas da cor correspondente!\n" +
      "• CUIDADO com Fast Food (🍔🍕🍟)!\n" +
      "• Descarte o Fast Food no LIXO 🗑️ (Arraste p/ direita, clique na lixeira ou ESPAÇO)!", {
      fontSize: "14px",
      color: "#ffffff",
      align: "center",
      wordWrap: { width: 300 },
      fontFamily: "sans-serif"
    }).setOrigin(0.5);

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x2ed573, 1);
    btnBg.fillRoundedRect(width / 2 - 120, height / 2 + 75, 240, 50, 15);

    const btnText = this.add.text(width / 2, height / 2 + 100, "▶ INICIAR JOGO", {
      fontSize: "20px",
      color: "#ffffff",
      fontStyle: "bold",
      fontFamily: "sans-serif"
    }).setOrigin(0.5);

    const btnZone = this.add.zone(width / 2, height / 2 + 100, 240, 50).setInteractive();

    this.startOverlayObjects = [dimBg, cardBg, title, instructions, btnBg, btnText, btnZone];

    btnZone.on("pointerdown", () => {
      this.startOverlayObjects.forEach(obj => obj.destroy());
      this.startOverlayObjects = [];
      this.isGameStarted = true;
      this.spawnFruit3D();
    });
  }

  private spawnFruit3D() {
    if (this.isGameOver || !this.isGameStarted) return;

    if (this.currentMesh) {
      this.threeManager.removeModel(this.currentMesh);
      this.currentMesh = null;
    }

    const isJunkSpawn = Math.random() < 0.20;
    if (isJunkSpawn) {
      this.currentItemData = Phaser.Utils.Array.GetRandom(JUNK_FOODS);
    } else {
      this.currentItemData = Phaser.Utils.Array.GetRandom(HEALTHY_FRUITS);
    }

    this.currentMesh = this.threeManager.createModelInstance(this.currentItemData.id);

    if (this.currentMesh && this.currentItemData) {
      this.fruitX = (Math.random() - 0.5) * 1.2;
      this.fruitY = 4.5;
      this.currentMesh.position.set(this.fruitX, this.fruitY, 0);
      
      // Aplica a escala individual personalizada do item
      const s = this.currentItemData.scaleFactor;
      this.currentMesh.scale.set(s, s, s);
    }

    this.isFalling = true;
  }

  update() {
    if (this.game.canvas && this.threeManager) {
      this.threeManager.syncCanvasPosition(this.game.canvas);
      this.threeManager.render();
    }

    if (this.isGameOver || !this.isGameStarted || !this.isFalling || !this.currentMesh) return;

    this.fruitY -= this.speed;
    this.currentMesh.position.y = this.fruitY;
    this.currentMesh.rotation.x += 0.02;
    this.currentMesh.rotation.y += 0.03;

    if (this.fruitY < -2.9) {
      this.processMiss();
    }
  }

  private handleInput(chosenCategory: number) {
    if (this.isGameOver || !this.isGameStarted || !this.isFalling || !this.currentMesh || !this.currentItemData) return;

    this.isFalling = false;

    if (this.currentItemData.isJunk) {
      if (this.currentMesh) {
        this.threeManager.removeModel(this.currentMesh);
        this.currentMesh = null;
      }

      this.lives -= 1;
      this.livesText.setText(`VIDAS: ${"❤️".repeat(Math.max(0, this.lives))}`);

      if (this.lives <= 0) {
        this.triggerGameOver("Suas vidas acabaram!");
      } else {
        this.spawnFruit3D();
      }
      return;
    }

    const isCorrect = this.currentItemData.categories.includes(chosenCategory);
    const targetX = [-1.4, 0, 1.4][chosenCategory];

    if (isCorrect) {
      const mesh = this.currentMesh;
      const startY = mesh.position.y;
      const startX = mesh.position.x;
      let progress = 0;

      const animTimer = setInterval(() => {
        progress += 0.1;
        mesh.position.x = startX + (targetX - startX) * progress;
        mesh.position.y = startY + (-3.1 - startY) * progress;
        mesh.scale.multiplyScalar(0.9);

        if (progress >= 1) {
          clearInterval(animTimer);
          this.threeManager.removeModel(mesh);
          this.currentMesh = null;

          this.score += 10;
          this.speed += 0.002;
          this.scoreText.setText(`PONTOS: ${this.score}`);

          this.spawnFruit3D();
        }
      }, 16);
    } else {
      this.processMiss();
    }
  }

  private handleDiscard() {
    if (this.isGameOver || !this.isGameStarted || !this.isFalling || !this.currentMesh || !this.currentItemData) return;

    this.isFalling = false;
    const mesh = this.currentMesh;
    const startY = mesh.position.y;
    const startX = mesh.position.x;
    const targetX = 2.6;
    let progress = 0;

    const animTimer = setInterval(() => {
      progress += 0.1;
      mesh.position.x = startX + (targetX - startX) * progress;
      mesh.position.y = startY + (0 - startY) * progress;
      mesh.scale.multiplyScalar(0.85);

      if (progress >= 1) {
        clearInterval(animTimer);
        this.threeManager.removeModel(mesh);
        this.currentMesh = null;

        if (this.currentItemData?.isJunk) {
          this.score += 15;
          this.scoreText.setText(`PONTOS: ${this.score}`);
          this.spawnFruit3D();
        } else {
          this.score -= 10;
          
          if (this.score <= 0) {
            this.score = 0;
            this.scoreText.setText("PONTOS: 0");
            this.triggerGameOver("Você desperdiçou frutas e perdeu seus pontos!");
          } else {
            this.scoreText.setText(`PONTOS: ${this.score}`);
            this.spawnFruit3D();
          }
        }
      }
    }, 16);
  }

  private processMiss() {
    this.isFalling = false;

    if (this.currentMesh) {
      this.threeManager.removeModel(this.currentMesh);
      this.currentMesh = null;
    }

    if (this.currentItemData && !this.currentItemData.isJunk) {
      this.lives -= 1;
      this.livesText.setText(`VIDAS: ${"❤️".repeat(Math.max(0, this.lives))}`);
    }

    if (this.lives <= 0) {
      this.triggerGameOver("Suas vidas acabaram!");
    } else {
      this.spawnFruit3D();
    }
  }

  private triggerGameOver(reason: string = "FIM DE JOGO!") {
    this.isGameOver = true;
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75);

    const panel = this.add.graphics();
    panel.fillStyle(0x2d3436, 0.95);
    panel.fillRoundedRect(width / 2 - 160, height / 2 - 140, 320, 280, 20);
    panel.lineStyle(4, 0xff4757, 1);
    panel.strokeRoundedRect(width / 2 - 160, height / 2 - 140, 320, 280, 20);

    this.add.text(width / 2, height / 2 - 90, "FIM DE JOGO!", {
      fontSize: "28px",
      color: "#ff4757",
      fontStyle: "bold",
      fontFamily: "sans-serif"
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 50, reason, {
      fontSize: "14px",
      color: "#dfe6e9",
      fontStyle: "italic",
      fontFamily: "sans-serif"
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2, `Pontuação Final: ${Math.max(0, this.score)}`, {
      fontSize: "20px",
      color: "#feca57",
      fontStyle: "bold",
      fontFamily: "sans-serif"
    }).setOrigin(0.5);

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xfeca57, 1);
    btnBg.fillRoundedRect(width / 2 - 120, height / 2 + 50, 240, 50, 15);

    this.add.text(width / 2, height / 2 + 75, "🔄 JOGAR NOVAMENTE", {
      fontSize: "17px",
      color: "#2d3436",
      fontStyle: "bold",
      fontFamily: "sans-serif"
    }).setOrigin(0.5);

    const restartBtnZone = this.add.zone(width / 2, height / 2 + 75, 240, 50).setInteractive();

    restartBtnZone.on("pointerdown", () => {
      this.scene.restart();
    });
  }
}
