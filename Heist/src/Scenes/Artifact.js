class Artifact extends Phaser.GameObjects.Sprite {

    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame);


        this.startY = this.y;

        this.scale = 2;

        scene.add.existing(this);

        this.up = true;

        this.anims.play('artifact-idle');

        return this;
    }

    destroyArtifact() {
        this.visible = false;
    }

    update(visible) {

        if (!visible) {
            this.setVisible(false);
        } else {
            if (this.up) {
                this.y -= 0.25;

                if (this.y < this.startY - 5) {
                    this.up = false;
                }
            } else {
                this.y += 0.25;

                if (this.y > this.startY + 5) {
                    this.up = true;
                }
            }
        }
    }
}