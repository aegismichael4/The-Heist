class Door extends Phaser.GameObjects.Sprite {

    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame);

        scene.add.existing(this);

        this.scene = scene;
        this.closing = false;
    }

    startClosing() {
        this.scene.doorSFX.play();

        this.scene.tweens.add({
            targets:  this,
            y:   18 * 20,
            duration: 90000
        });

        this.scene.tweens.add({
            targets:  this.body,
            y:   18 * 6,
            duration: 90000
        });

        this.closing = true;
    }

    update() {
        if (this.closing && this.y >= 359) {
            this.scene.doorSFX.stop();
            this.scene.doorCloseSFX.play();
            this.closing = false;
        }
    }
}