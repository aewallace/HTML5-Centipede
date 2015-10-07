// Constants
var HEADER_OFFSET = 16;
var PLAYER_SPEED = 300;
var BOUND_PLAYER_HIGH = 432;
var BOUND_PLAYER_LOW = 528;
var RENDER_AREA_WIDTH = 512;
var RENDER_AREA_HEIGHT = 544;
var UPPER_BOUND_ID = 1, LOWER_BOUND_ID = 2,
 LEFT_BOUND_ID = 3, RIGHT_BOUND_ID = 4;
var TOUCH = Phaser.Device.touch;

var game;

if (TOUCH){
  game = new Phaser.Game(RENDER_AREA_WIDTH, RENDER_AREA_HEIGHT + 144, Phaser.CANVAS, 'game', { preload: preload, create: create, update: update}, null, false, false);
}
else {
  game = new Phaser.Game(RENDER_AREA_WIDTH, RENDER_AREA_HEIGHT, Phaser.CANVAS, 'game', { preload: preload, create: create, update: update}, null, false, false);
}

// Global variables, or Globs as I call them.
// Characters/things you can see
var player, bolts, centipedes, centipede, section, spider, scorpion, flea,
    mushrooms, life_sprites, monsters;
//boundaries
var allBoundariesX, allBoundariesY, leftBoundary, rightBoundary, upperBoundary, lowerBoundary;
// Mechanics
var lives, score, score_disp, hi_score_disp, speed, wave, wave_offset,
    fire_button, cursors, touch, touch_button, mushrows, mush_array, rowHeight;
// Timers
var flea_timer, scorpion_timer, spider_timer, score_timer;


// Set up assets.
function preload() {
  game.load.bitmapFont('2P', 'assets/2P.png', 'assets/2P.fnt');
  game.load.atlasJSONHash('atlas', 'assets/centipede_sprites_1.png', 'assets/cent_sprites.json');
  game.load.spritesheet('button', 'assets/button.png', 512, 144);
}

// Set up objects and groups and place the first centipede.
function create(){
  powersave_timer = 0;
  enter_powersave = false;
  score_disp = game.add.bitmapText(game.width/8, 0, '2P', null, 16);
  hi_score_disp = game.add.bitmapText(game.width/2 - 20, 0, '2P', null, 16);
  mushrows = [];
  lives = 3;
  speed = 5;
  score = 0;
  rowHeight = 16; //height of virtual "rows" for centipede movement
  score_disp.setText(score.toString());
  hi_score_disp.setText(16543);
  wave_offset = 0;
  game.physics.startSystem(Phaser.Physics.ARCADE);

  mushrooms = game.add.group();
  mushrooms.enableBody = true;
  mushrooms.physicsBodyType = Phaser.Physics.ARCADE;
  spawnMushrooms();

  bolts = game.add.group();
  bolts.enableBody = true;
  bolts.physicsBodyType = Phaser.Physics.ARCADE;
  bolts.createMultiple(1, 'atlas', 'bolt');
  bolts.setAll('anchor.x', 0.5);
  bolts.setAll('anchor.y', 1);
  bolts.setAll('outOfBoundsKill', true);
  bolts.setAll('checkWorldBounds', true);

  centipedes = game.add.group();
  centipedes.enableBody = true; //tentatively remove in future
  centipedes.physicsBodyType = Phaser.Physics.ARCADE; //tentatively remove in future
  centipedes.setAll('checkWorldBounds', true); //tentatively remove in future
  //centipedes now merely acts as a placeholder
  //and each individual centipede part is reponsible for its body, physics, etc

  allBoundariesX = game.add.group();
  allBoundariesY = game.add.group();

  leftBoundary = game.add.sprite(1,game.height/2); //AEW
  game.physics.enable(leftBoundary, Phaser.Physics.ARCADE);
  leftBoundary.height = game.height;
  leftBoundary.width = 1;
  leftBoundary.idType = LEFT_BOUND_ID;
  leftBoundary.body.immovable = true;
  leftBoundary.body.collideWorldBounds = true;

  rightBoundary = game.add.sprite(game.width-1,game.height/2); //AEW
  game.physics.enable(rightBoundary, Phaser.Physics.ARCADE);
  rightBoundary.height = game.height;
  rightBoundary.width = 1;
  rightBoundary.idType = RIGHT_BOUND_ID;
  rightBoundary.body.collideWorldBounds = true;
  rightBoundary.body.immovable = true;

  upperBoundary = game.add.sprite(game.width/2,0); //AEW
  game.physics.enable(upperBoundary, Phaser.Physics.ARCADE);
  upperBoundary.height = 1;
  upperBoundary.width = game.width;
  upperBoundary.idType = UPPER_BOUND_ID;
  upperBoundary.body.collideWorldBounds = true;
  upperBoundary.body.immovable = true;

  lowerBoundary = game.add.sprite(game.width/2,RENDER_AREA_HEIGHT); //AEW
  game.physics.enable(lowerBoundary, Phaser.Physics.ARCADE);
  lowerBoundary.height = 1;
  lowerBoundary.width = game.width;
  lowerBoundary.idType = LOWER_BOUND_ID;
  lowerBoundary.body.collideWorldBounds = true;
  lowerBoundary.body.immovable = true;

  allBoundariesY.add(upperBoundary);
  allBoundariesY.add(lowerBoundary);
  allBoundariesX.add(leftBoundary);
  allBoundariesX.add(rightBoundary);


  if (TOUCH){
    player = game.add.sprite(game.width/2, game.height - 152, 'atlas', 'player');
  }
  else{
    player = game.add.sprite(game.width/2, game.height, 'atlas', 'player');
  }
  player.anchor.setTo(0.5, 0.5);
  player.alive = true;
  game.physics.enable(player, Phaser.Physics.ARCADE);
  player.body.collideWorldBounds = true;
  player.animations.add('die', Phaser.Animation.generateFrameNames('bigexplosion', 0, 7, '', 2), 30, true);

  cursors = game.input.keyboard.createCursorKeys();
  fire_button = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

  touch_button = game.add.button(256, 616, 'button', touchButton, this, 2, 1, 0);
  touch_button.name = 'touch_button';
  touch_button.anchor.setTo(0.5, 0.5);

  monsters = new MonsterManager(game);
  var monster = new MonsterGenerator(game, 'atlas', monsters); //maybe this
  //is only used to create a spider? in which case, why is it not used
  //to create the other creatures?

  spawnCentipede(game.width/2, 16);
  spawnScorpion();
  spawnSpider(monster);
  spawnFlea();
}

// Called 60(maybe?) times a second, the heartbeat of the game.
function update(){
  game.physics.arcade.collide(player, mushrooms);
  game.physics.arcade.collide(centipedes, allBoundariesY, hitWallY, null, this); //AEW
  game.physics.arcade.collide(centipedes, allBoundariesX, hitWallX, null, this); //AEW
  game.physics.arcade.collide(bolts, mushrooms, boltHitsMushroom, null, this);
  game.physics.arcade.collide(bolts, centipedes, boltHitsCentipede, null, this); //added by AEW
  game.physics.arcade.collide(bolts, spider, boltHitsSpider, null, this); //added by AEW //revert to collide if spider fails
  game.physics.arcade.collide(centipedes, mushrooms, centipedeHitsMushroom, null, this);
  game.physics.arcade.overlap(scorpion, mushrooms, scorpionHitsMushroom, null, this);
  // game.physics.arcade.collide(centipedes, player, playerDies, null, this);
  game.physics.arcade.overlap(flea, player, fleaHitsPlayer, null, this);
  game.physics.arcade.overlap(bolts, flea, boltHitsFlea, null, this);
  game.physics.arcade.overlap(bolts, scorpion, boltHitsScorpion, null, this);
  //game.physics.arcade.overlap(bolts, monsters.getGroup(), monsters.damage, null, this); //disabled by AEW
  player.body.velocity.setTo(0, 0);


  // if ((game.input.x < 512) && (game.input.x > 0) && (game.input.y < 672) && (game.input.y > 0)){
  //   player.body.x = game.input.x;
  //   if (game.input.y <= BOUND_PLAYER_HIGH){ // && game.input.y <= BOUND_PLAYER_LOW){
  //     player.body.y = BOUND_PLAYER_HIGH;
  //   }
  //   else if (game.input.y >= BOUND_PLAYER_LOW){ // && game.input.y <= BOUND_PLAYER_LOW){
  //     player.body.y = BOUND_PLAYER_LOW;
  //   }
  //   else{
  //     player.body.y = game.input.y;
  //   }
  // }
  // if (game.input.activePointer.isDown){
  //   fireBolt();
  // }


  if (cursors.left.isDown)
  {
    player.body.velocity.x = -PLAYER_SPEED;
  }
  if (cursors.right.isDown)
  {
    player.body.velocity.x = PLAYER_SPEED;
  }

  if (player.y >= BOUND_PLAYER_HIGH){
    if (cursors.up.isDown)
    {
      player.body.velocity.y = -PLAYER_SPEED;
    }
  }
  if (player.y <= BOUND_PLAYER_LOW){
    if (cursors.down.isDown)
    {
      player.body.velocity.y = PLAYER_SPEED;
    }
  }

  if (fire_button.isDown)
  {
    fireBolt();
  }

  //check if we need to alter movement for each centipede segment
  centipedes.forEachAlive(moveCentipede);

  if (scorpion){
    moveScorpion();
  }

  monsters.move();

  if (flea){
    moveFlea();
  }
}

function touchButton(){
  touch_button.kill();
  GameController.init( {
    forcePerformanceFriendly: true,
    left: {
      type: 'joystick',
      position: {left: '15px', bottom: '10px'},
      joystick: {
        touchMove: function(details) {
          player.body.velocity.x = (details.normalizedX * PLAYER_SPEED);
          player.body.velocity.y = -(details.normalizedY * PLAYER_SPEED);
        }
      }
    },
    right: {
      position: {right: '5px', bottom: '17px'},
      type: 'buttons',
      buttons: [
      {
        label: 'fire', fontSize: 13, touchStart: function() {
          fireBolt();
        }
      },
      false, false, false
      ]
    }
  });
}

//Refresh the display of the score
//optionally increment the score by a given amount then refresh display
function refreshScore(addToScore){
  if(addToScore){
    score+=addToScore
  }
  score_disp.setText(score.toString());
}

/////////////////////////
// Mechanics functions //
/////////////////////////

function playerDies(){
  player.alive = false;
  player.animations.play('die', 30, false, true);
  lives -= 1;
  // if (lives < 0){
  //   gameOver();
  // }
}

function fleaDies(){
  flea.alive = false;
  flea.animations.play('die', 30, false, true);
}

function scorpionDies(){
  scorpion.alive = false;
  scorpion.animations.play('die', 30, false, true);
}

function spiderDies(critterSpider){ // by AEW
  critterSpider.alive = false;
  critterSpider.animations.play('die', 30, false, true);
}

function fireBolt() {
  if (player.alive){ // Roberto found this bug.
    var bolt = bolts.getFirstExists(false);
    if (bolt){
      bolt.reset(player.x, player.y + 8);
      bolt.body.velocity.y = -800;
    }
  }
}

// function gameOver(){}

/////////////////////////////////////
// Spawning functions. Get a room! //
/////////////////////////////////////

function spawnMushrooms(){
  var chance = 0;
  for (var i = 0; i < 512; i += 16) {
    mushrows.push(i);
    for (var j = 16; j < 512; j += 16){
      chance = Math.floor(Math.random() * 25) + 1;
      if (chance == 1) {
        var mushroom = mushrooms.create(i, j, 'atlas', 'mushroom00');
        mushroom.body.immovable = true;
        mushroom.hits = 0;
        mushroom.poisoned = false;
      }
    }
  }
}

function spawnSingleMushroom(x, y){
  console.log("Spawn single mushroom!");
  var mushroom = mushrooms.create(x, y, 'atlas', 'mushroom00');
  mushroom.body.immovable = true;
  mushroom.hits = 0;
  mushroom.poisoned = false;
}

// Should be responsible for placement/spawning of all monsters truly
function MonsterManager(game){
    var monsters = [];
    var monsterGroup = game.add.group(undefined, 'monsters', false, false, Phaser.Physics.ARCADE);
    // Add a guy
    this.addMonster = function(monster){
        monsterGroup.add(monster);
        monsters.push(monster);
    }

    this.getGroup = function(){
      return monsterGroup;
    }

    // Make them groove
    this.move = function(){
        for(var i = 0, j = monsters.length;i < j;i++){
            monsters[i].move();
        }
    }

    this.damage = function(object, creature){
      creature.death();
      //creature.damage(1); //commment by AEW: what will this do???
      refreshScore(75); //AEW
      // as is, it causes a critical error "damage isn't a function"
    }
}

// Define a new monster type
// var monsterGenerator = new MonsterGenerator(game, 'atlas');
// var scorpion = new Monster('scorpion00', 10);
// var scorp1 = scorpion.create(0, 0);
// scorp1.addAnimation('move')
function MonsterGenerator(game, atlas, manager){
    return function Monster(name, health){
        var self = this;
        var animations = [];
        var creation, death;
        self.attrs = {};
        self.create = function(x, y, moveFn, deathFn){
            var creature = game.add.sprite(x, y, atlas, name);
            game.physics.enable(creature, Phaser.Physics.ARCADE);
            creature.health = health;
            for(var i = 0, j = animations.length; i < j;i++){
                creature.animations.add(animations[i].animation, animations[i].frameData, 10, true);
            }
            for(var i = 0, j = Object.keys(this['attrs']);i < j.length;i++){
                creature[j[i]] = this['attrs'][j[i]];
            }
            creature.move = moveFn ? function(){
                moveFn(creature);
            } : self.movement(creature);

            creature.death = deathFn ? function(){ //AEW
                deathFn(creature);
            } : self.death(creature);

            creation(creature);
            creature.events.onKilled.add(death, creature);
            manager.addMonster(creature);
            return creature;
        }

        self.addMovement = function(fn){
            self.movement = function(creature){
                return function(){
                    fn(creature);
                }
            }
        }

        self.addDeath = function(fn){ //AEW
            self.death = function(creature){
                return function(){
                    fn(this);
                }
            }
        }

        // Add animations
        self.addAnimation = function(animation, frameData){
            animations.push({'animation': animation, 'frameData': frameData});
        }

        self.onCreation = function(fn){
            creation = function(creature){
                fn(creature);
            }
        }

        self.onDeath = function(fn){
            death = function(){
              fn(this);
            }
        }

        // Try not to use too often
        self.set = function(key, value){
            this['attrs'][key] = value;
        }
    }
}

function spawnSpider(monster){
  var spider = new monster('spider00', 1);
  spider.addAnimation('move', Phaser.Animation.generateFrameNames('spider', 0, 7, '', 2));
  spider.addAnimation('die', Phaser.Animation.generateFrameNames('bigexplosion', 0, 7, '', 2));
  spider.onCreation(function(creature){
    creature.animations.play('move');
  });

  spider.onDeath(function(creature){
    creature.animations.play('die', 30, false, true);
    refreshScore(900);
  });
  spider.set('state', true);
  spider.set('time', 0);
  spider.set('dir', Math.random() < 0.5 ? -1 : 1);
  function zigZag(creature){
    creature.x += 1;
    if(Math.ceil(Math.abs(creature.x)) % 100 === 0){
      creature.dir = creature.dir * -1;
    }
    creature.y += 1 * creature.dir;
  }
  function upAndDown(creature){
    if(Math.ceil(Math.abs(creature.time)) % 75 === 0){
      creature.dir = creature.dir * -1;
    }
    creature.y += 2 * creature.dir;
  }
  spider.addMovement(function(creature){
    creature.time += 1;
    if(Math.ceil(Math.abs(creature.time)) % 100 === 0){
      creature.state = !creature.state;
    }
    if(creature.state){
      zigZag(creature);
    } else {
      upAndDown(creature);
    }
  });
  spider.addDeath(function(creature){
    spiderDies(creature);
  });


  // Create initial spider.
  for(var i = 0;i < 1;i++){
      function rand(){
          return Math.random() * 400;
      }
      spider.create(rand(), rand()); //comment by AEW: since there's only one
      // spider required, we'll revamp this in the future to allow creation
      // of a new spider each time an old spider dies.
  }

}

//make something with 12 body parts (including head) in total (to start)
//successive levels turn into one fewer body part, but one more fast head
//gives sprites some custom props; as suggested on a website, in the future,
// "use sprite.hasOwnProperty('propname') to throw an error
//    if sprite.propname is already defined"
function spawnCentipede(x, y){
  var previousCent = null;
  var maxSegs = 12;
  var spriteSize = 16;
  for (seg = 0; seg < maxSegs; seg++){
    centipede = game.add.sprite(x + (seg*(spriteSize+8)), y, 'atlas', 'head00');
    game.physics.enable(centipede, Phaser.Physics.ARCADE);
    centipede.animations.add('move', Phaser.Animation.generateFrameNames('head', 0, 7, '', 2), 10, true);
    centipede.animations.add('moveVert', Phaser.Animation.generateFrameNames('headdown', 0, 3, '', 2), 10, true);
    centipede.animations.play('move');
    centipede.alive = true;
    centipede.anchor.setTo(0, 0);
    centipede["direction"] = 1;
    centipede["directionY"] = 1;
    centipede.moveVertically = false;
    centipede.centSpeed = 16 * speed;
    centipede.segAhead = previousCent;
    if(previousCent != null){
      previousCent.segBehind = centipede;
    }
    centipede.segBehind = null;
    centipede.lastX = x;
    centipede.lastY = y;
    centipede.oldVelX = 0;
    centipede.oldVelY = 0;
    centipede.yTraveled = 0;
    centipede.layer = y;
    centipede.body.velocity.x = centipede.centSpeed;
    centipede.body.velocity.y = 0;
    centipede.idName = seg;


    //add it to the "centipedes" group, with custom props intact
    centipedes.add(centipede);
    previousCent = centipede;
  }
}

function spawnScorpion(){
  var dir = Math.floor(Math.random() * 2);
  if (dir == 0){dir = -1}
  var row = Math.floor((Math.random() * 5)  + 5) * 16;
  var x = 512;
  if (dir == 1){
    x = 0;
  }
  scorpion = game.add.sprite(x, row, 'atlas', 'scorpion00');
  scorpion.alive = true;
  scorpion.outOfBoundsKill = true;
  game.physics.enable(scorpion, Phaser.Physics.ARCADE);
  scorpion.anchor.setTo(.5, 1);
  if (dir == 1){scorpion.scale.x = -1};
  scorpion.animations.add('move', Phaser.Animation.generateFrameNames('scorpion', 0, 3, '', 2), 10, true);
  scorpion.animations.add('die', Phaser.Animation.generateFrameNames('bigexplosion', 0, 7, '', 2), 30, true);
  scorpion.animations.play('move');
  scorpion.direction = dir;
}

function spawnFlea(){
  var col = (Math.floor(Math.random() * 32) * 16);
  flea = game.add.sprite(col, 0, 'atlas', 'flea00');
  flea.alive = true;
  flea.outOfBoundsKill = true;
  game.physics.enable(flea, Phaser.Physics.ARCADE);
  flea.animations.add('move', Phaser.Animation.generateFrameNames('flea', 0, 3, '', 2), 10, true);
  flea.animations.add('die', Phaser.Animation.generateFrameNames('explosion', 0, 5, '', 2), 30, true);
  flea.animations.play('move');
  // drop mushrooms
}

function spawnSpiderOLD(){
  spider = game.add.sprite(0, 480, 'atlas', 'spider00');
  spider.alive = true;
  spider.outOfBoundsKill = true;
  game.physics.enable(spider, Phaser.Physics.ARCADE);
  spider.animations.add('move', Phaser.Animation.generateFrameNames('spider', 0, 7, '', 2), 30, true);
  spider.animations.add('die', Phaser.Animation.generateFrameNames('bigexplosion', 0, 7, '', 2), 30, true);
  spider.animations.play('move');
}

function spawnFastCentipedeHeads(){
  //do 1 fewer head than the level number
}

function spawnHeadsFromBrokenCentipede(){
  //for every few seconds, spawn a new head
}

/////////////////////////////
// AI functions. SKYNET!!! //
/////////////////////////////

function hitWallX(cent, wall){
  /*if(wall){
    console.log("hitX :: WALL ID " + wall.idType); //AEW test
  }
  console.log("Hit a wall X; " + cent.x + " ...switch to y?");*/
  cent.moveVertically = true;
  cent.animations.play('moveVert');
  cent.lastY = cent.y;
  /*console.log("old x dir:: " + cent.direction);
  console.log("new x dir:: " + cent.direction);
  console.log(" SWITCH try move y");*/
  cent.direction *= -1; //always change direction if we encounter an X boundary
  cent.body.velocity.x = 0;
  cent.body.velocity.y = cent.centSpeed * cent.directionY;
  //cent.body.velocity.y = rowHeight; //alternative if centipede seems to go...
  //...too fast & overshoots the "single row change"
  /*console.log("centDirectionY :: " + cent.directionY + "spd" + speed);
  console.log("y" + cent.body.velocity.y);*/
}

function hitWallY(cent, wall){
  if(wall){
    //console.log("hitY :: WALL ID " + wall.idType); //AEW test
    cent.directionY *= -1; //unlike when we encounter X boundaries, we change...
    //the vertical direction (up or down) only if we encounter the world's edge
  }
  //console.log("Hit a wall Y; " + cent.y + " ...change to X?");
  cent.moveVertically = false;
  cent.animations.play('move');
  //console.log("old y dir:: " + cent.directionY);
  //console.log("new y dir:: " + cent.directionY);
  //console.log(" SWTCH attempt move x");
  cent.body.velocity.x = cent.centSpeed * cent.direction;
  cent.body.velocity.y = 0;
  //console.log("centDirectionX :: " + cent.direction + "spd" + speed);
  //console.log("x" + cent.body.velocity.x);
}

function moveCentipede(cent){
  // This function will be the heart and soul of the centipede movement
  //    algorithm. Cool things to come!

  //thanks to the velocity attribute of sprites, this method may be redundant
  //although it can be used to do advanced collision detection
  //ie if a centipede gets stuck in a place, we can get it unstuck
  //or modify the speed
  //or whatever we want!

  //for now, is only responsible for checking if we've moved veritcally one row
  //and changes direction if so.
  if(cent.moveVertically){
    if (Math.abs(cent.y - cent.lastY) > rowHeight){
      hitWallY(cent, null);
    }
  }
}


function moveScorpion(){
  if (scorpion.alive){
    scorpion.x += (speed / 2) * scorpion.direction;
  }
}

function moveFlea(){
  if (flea.alive){
    flea.y += (speed);
  }
}

function moveSpider(){
  spider.time += 1;
  if(Math.ceil(Math.abs(spider.time)) % 100 === 0){
    spider.state = !spider.state;
  }
  if(spider.state){
    zigZag(spider);
  } else {
    upAndDown(spider);
  }
}

/////////////////////////////////////////////////////////
// Collision functions. Let's exchange insurance info. //
/////////////////////////////////////////////////////////

function boltHitsMushroom (bolt, mushroom) {
  bolt.kill();
  mushroom.hits += 1;
  if (mushroom.hits >= 4){
    mushroom.kill();
    refreshScore(1); //added by AEW
  }
  else {
    mushroom.loadTexture('atlas', 'mushroom0' + mushroom.hits);
  }
}

function boltHitsFlea(){
  refreshScore(500);
  fleaDies();
}

function shootBugger(player, creature){
  refreshScore(1000);
  creature.kill();
}

function boltHitsScorpion(){
  refreshScore(1000);
  scorpionDies();
}

function boltHitsSpider(){
  refreshScore(900);
  spiderDies();
}

//treat all centipede parts as unique
//if centipede part is trailing another part (immediately), move based on that
// immediate forward part. if centipede part is NOT trailing another part, treat
// it as a "head"
// but everything gets its own unique direction, determined by whether it
// is trailing or not

function pauseCent(){
  centipedes.forEachAlive(pushCentVelocityAndZero);
}

function resumeCent(){
  centipedes.forEachAlive(popCentVelocity);
}

//push velocity values onto centipede segment internal stack
//and zero velocity values of segment to stop movement
function pushCentVelocityAndZero(centSeg){
  centSeg.oldVelX = centSeg.body.velocity.x;
  centSeg.oldVelY = centSeg.body.velocity.y;
  centSeg.body.velocity.x = 0;
  centSeg.body.velocity.y = 0;
}

//pop velocity values from centipede segment internal stage
function popCentVelocity(centSeg){
  centSeg.body.velocity.x = centSeg.oldVelX;
  centSeg.body.velocity.y = centSeg.oldVelY;
}

function boltHitsCentipede(bolt, centSeg){
  //get rid of the body segment at that location
  //spawn a mushroom at the location
  //head to that body segment continues on
  //tail end of centipede drops down
  //tail end of centipede reverses direction
  //start of tail end changes to head graphics
  //so we will probably need a quick n dirty split() function
  pauseCent();

  console.log(centSeg.idName);

  if(centSeg.segAhead != null){
    console.log(centSeg.segAhead.idName + "segAheadID");
    if(centSeg.segBehind != null){
      //this segment is between two other segments
      console.log(centSeg.segBehind.idName + "segBehindID DOING INNER SEG");
      hitCentInnerSegment(centSeg);
    }
    else{
      //this segment is the tail...
      hitCentOuterSegment(centSeg, false);
    }
  }
  else if(centSeg.segBehind != null){
    //then there is no segment ahead, and there is a segment behind
    //so this acts as the head
    hitCentOuterSegment(centSeg, true);
  }
  else{
    //this is a lone body part that can disappear
    killCentipedeSegment(centSeg);
  }
  bolt.kill();
  resumeCent();

}

function hitCentInnerSegment(centSeg){
  console.log("Inner segment detected!");
  spawnSingleMushroom(centSeg.x, centSeg.y);
  centSeg.segAhead.segBehind = null;
  centSeg.segBehind.segAhead = null;
  killCentipedeSegment(centSeg);
}

function hitCentOuterSegment(centSeg, isHead){
  //delete the old head or old tail and make nearest neighbor new head/tail
  if(isHead){
    centSeg.segBehind.segAhead = null;
  }
  else {
    centSeg.segAhead.segBehind = null;
  }
  killCentipedeSegment(centSeg);
}

function killCentipedeSegment(centSeg){
  centSeg.alive = false;
  centSeg.kill(); //update with explosion animation
}

function centipedeHitsPoisonedMushroom(cent, poisonedMushroom){
  //dive to bottom in zigzag of width 2
}

function centipedeHitsMushroom(cent, mushroom){
  /*console.log("Centipede encountered mushroom!");*/
  if (cent.moveVertically){
    hitWallY(cent, null);
  }
  else{
    hitWallX(cent, null);
  }
}

function scorpionHitsMushroom(scorpion, mushroom){
  mushroom.poisoned = true;
  mushroom.loadTexture('atlas', 'poison0' + mushroom.hits);
}

function fleaHitsPlayer(flea, player){
  playerDies();
}

function spiderHitsPlayer(spider, player){
  playerDies();
}

function centipedeHitsPlayer(cent, player){
  playerDies();
}
