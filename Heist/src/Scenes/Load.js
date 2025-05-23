class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load characters spritesheet
        this.load.atlas("platformer_characters", "tilemap-characters-packed.png", "tilemap-characters-packed.json");
        this.load.spritesheet("glass", "glass_packed.png", { frameWidth: 36, frameHeight: 36});

        // Load tilemap information
        this.load.image("industrial_tiles", "tilemap_packed.png");                         // Packed tilemap
        this.load.image("block_tiles", "marble_packed.png");
        this.load.tilemapTiledJSON("heist_json", "heist.json");             // Tilemap in JSON

        // extra sprites
        this.load.spritesheet("artifact", "artifact.png", { frameWidth: 32, frameHeight: 32});
        this.load.image("door", "door.png");

        // particle effects
        this.load.image("plus_particle", "plus_particle.png");
        this.load.image("glass_particle", "glass_particle.png");


        //audio
        this.load.audio("sparkle", "sparkle.wav");
        this.load.audio("ding", "ding.wav");
        this.load.audio("shatter", "shatter.wav");
        this.load.audio("shatter2", "shatter2.mp3");
        this.load.audio("shatter3", "shatter3.wav");
        this.load.audio("footstep1", "footstep1.wav");
        this.load.audio("footstep2", "footstep2.wav");
        this.load.audio("thud", "thud.wav");
        this.load.audio("slide", "slide.wav");
        this.load.audio("jump", "jump.wav");
        this.load.audio("long_jump", "long_jump.wav");
        this.load.audio("wall_jump", "wall_jump.wav");
        this.load.audio("dive", "dive.wav");
        this.load.audio("door", "door.wav");
        this.load.audio("door_close", "door_close.wav");
        this.load.audio("power_up", "power_up.wav");

        //font
 //       this.load.bitmapFont('pixel_font', 'megaman_font_1.png', 'megaman_font_1.fnt');
    }

    create() {

        /*
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_",
                start: 0,
                end: 1,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: 'idle',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0000.png" }
            ],
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0001.png" }
            ],
        });

         // ...and pass to the next Scene
         this.scene.start("platformerScene");

         */

        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('glass', { start: 0, end: 0}),
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('glass', { start: 1, end: 4}),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'wall_stick',
            frames: this.anims.generateFrameNumbers('glass', { start: 5, end: 5}),
            frameRate: 15,
            repeat: -1
        });


        this.anims.create({
            key: 'jump_1',
            frames: this.anims.generateFrameNumbers('glass', { start: 6, end: 6}),
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: 'jump_2',
            frames: this.anims.generateFrameNumbers('glass', { start: 7, end: 7}),
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: 'jump_3',
            frames: this.anims.generateFrameNumbers('glass', { start: 8, end: 8}),
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: 'jump_4',
            frames: this.anims.generateFrameNumbers('glass', { start: 9, end: 9}),
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: 'slide',
            frames: this.anims.generateFrameNumbers('glass', { start: 10, end: 10}),
            frameRate: 15,
            repeat: -1
        });


         this.scene.start("platformerScene");

         this.anims.create({
            key: 'artifact-idle',
            frames: this.anims.generateFrameNumbers('artifact', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
         });
    }

    // Never get here since a new scene is started in create()
    update() {
    }
}