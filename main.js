import Phaser from 'phaser'

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: 1200,
  height: 700,
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 400 },
      debug: false,
    }
  }
})

let cursors
let bullets
let enemies
let thrustForce
let shootTimer = 0
const bulletPower = 1500
const recoilStrength = 10000
let playerHealth = 250
let enemyHealth = 250
let GameOver = false
let direction = true
let playerHealthText
let enemyHealthText
let SHOOT_CHANCE = 2
let camera
let finishCameraEffect = false
let enemySpeed = 500
let playerSpeed = 700
let localPlayer
let powerups
let enemyClassArray = []

const powerupSlots = [
  [40, 80],
  [120, 80],
  [200, 80],
  [280, 80],
  [360, 80],
  [440, 80],
  [520, 80],
  [600, 80],
  [680, 80],
  [760, 80],
  [840, 80],
  [920, 80],
  [1000, 80],
  [1080, 80],
  [1160, 80],
  [40, 160],
  [120, 160],
  [200, 160],
  [280, 160],
  [360, 160],
  [440, 160],
  [520, 160],
  [600, 160],
  [680, 160],
  [760, 160],
  [840, 160],
  [920, 160],
  [1000,160],
  [1080,160],
  [1160,160],
  [40, 240],
  [120, 240],
  [200, 240],
  [280, 240],
  [360, 240],
  [440, 240],
  [520, 240],
  [600, 240],
  [680, 240],
  [760, 240],
  [840, 240],
  [920, 240],
  [1000,240],
  [1080,240],
  [1160,240],
  [40, 320],
  [120, 320],
  [200, 320],
  [280, 320],
  [360, 320],
  [440, 320],
  [520, 320],
  [600, 320],
  [680, 320],
  [760, 320],
  [840, 320],
  [920, 320],
  [1000,320],
  [1080,320],
  [1160,320],
  [40, 400],
  [120, 400],
  [200, 400],
  [280, 400],
  [360, 400],
  [440, 400],
  [520, 400],
  [600, 400],
  [680, 400],
  [760, 400],
  [840, 400],
  [920, 400],
  [1000,400],
  [1080,400],
  [1160,400],
  [40, 480],
  [120, 480],
  [200, 480],
  [280, 480],
  [360, 480],
  [440, 480],
  [520, 480],
  [600, 480],
  [680, 480],
  [760, 480],
  [840, 480],
  [920, 480],
  [1000,480],
  [1080,480],
  [1160,480],
  [40, 560],
  [120, 560],
  [200, 560],
  [280, 560],
  [360, 560],
  [440, 560],
  [520, 560],
  [600, 560],
  [680, 560],
  [760, 560],
  [840, 560],
  [920, 560],
  [1000,560],
  [1080,560],
  [1160,560],
  [40, 640],
  [120, 640],
  [200, 640],
  [280, 640],
  [360, 640],
  [440, 640],
  [520, 640],
  [600, 640],
  [680, 640],
  [760, 640],
  [840, 640],
  [920, 640],
  [1000,640],
  [1080,640],
  [1160,640],
]

const occupiedSlots = []

let selector = document.querySelector("#difficulty")

selector.addEventListener('change', () => {
  switch (selector.value) {
    case 'easy':
      SHOOT_CHANCE = 2
      break
    case 'medium':
      SHOOT_CHANCE = 3
      break
    case 'hard':
      SHOOT_CHANCE = 6
      break
    case 'insane':
      SHOOT_CHANCE = 9
      break
  }
})

function createNewPlayer(x, y) {
  let newPlayer = players.create(x, y, 'player')
  newPlayer.scale = 0.25
  newPlayer.setBounce(0.2)
  newPlayer.setMass(0.1)
  newPlayer.setCollideWorldBounds(true)
  newPlayer.body.useDamping = true
  newPlayer.setDrag(0.6)

  return newPlayer
}


function shotSelf(player, bullet) {
  bullet.destroy()
  playerHealth -= 10
  let explode = this.add.sprite(player.x, player.y, 'explosion').play('explodeAnimation');
  setTimeout(() => { explode.destroy() }, 500)
  camera.shake(300, 0.005)
}

function shotEnemy(enemy, bullet) {
  bullet.destroy()
  enemyClassArray[0].health -= 10
  let explode = this.add.sprite(enemy.x, enemy.y, 'explosion').play('explodeAnimation');
  setTimeout(() => { explode.destroy() }, 500)
  camera.shake(300, 0.005)
}

function chaseAfterPlayer (enemy) {
  Phaser.Physics.Arcade.ArcadePhysics.prototype.accelerateToObject(enemy, localPlayer, enemySpeed)
  if (enemy.x < localPlayer.x) {
    enemy.rotation = 0.5
  } else if (enemy.rotation >= -0.5) {
    enemy.rotation = -0.5
  }
}

function playerShoot() {

  let bullet = bullets.create(localPlayer.x, localPlayer.y, 'bullet')
  bullet.scale = 0.1
  bullet.setMass(0.01)
  bullet.setCollideWorldBounds(false)
  bullet.flipX = direction ? true : false
  bullet.rotation = localPlayer.rotation
  if (direction) {
    bullet.setVelocityX(bulletPower*Math.cos(localPlayer.rotation))
    bullet.setVelocityY(bulletPower*Math.sin(localPlayer.rotation))
  } else {
    bullet.setVelocityX(-bulletPower*Math.cos(localPlayer.rotation))
    bullet.setVelocityY(-bulletPower*Math.sin(localPlayer.rotation))
  }

  localPlayer.setAccelerationX(-Math.cos(localPlayer.rotation)*recoilStrength)
  localPlayer.setAccelerationY(-Math.sin(localPlayer.rotation)*recoilStrength)

}

function enemyShoot(enemy) {
  let bullet = bullets.create(enemy.x, enemy.y, 'bullet')
  bullet.scale = 0.1
  bullet.setMass(0.01)
  bullet.setCollideWorldBounds(false)
  bullet.flipX = direction ? false : true
  if (localPlayer.x < enemy.x) {
    bullet.setVelocityX(-bulletPower)
  } else {
    bullet.setVelocityX(bulletPower)
  }

}

function enemySpeedPowerup (enemy, powerup) {
  enemySpeed = 800
  setTimeout(() => {enemySpeed = 500}, 5000)
  powerup.destroy()
}

function playerSpeedPowerup (player, powerup) {
  playerSpeed = 800
  setTimeout(() => {enemySpeed = 500}, 5000)
  powerup.destroy()
}

function createPowerup () {

  const randomSlots = []

  for (let i = 0; i < 7; i++) {
    randomSlots.push(powerupSlots[Math.floor(Math.random()*powerupSlots.length)])
  }

  randomSlots.forEach((slot, i) => {
    if (!occupiedSlots.includes(slot)){
      powerups.create(slot[0], slot[1], 'powerup').setScale(0.2).setBodySize(40,40).setOffset(150, 180)
      occupiedSlots.push(slot)
    }
  })
  console.log(occupiedSlots)
}

class Enemy {
  constructor(x,y) {
    this.enemy = enemies.create(x, y, 'player')
    this.enemy.scale = 0.25
    this.enemy.setBounce(0.2)
    this.enemy.setMass(0.1)
    this.enemy.setCollideWorldBounds(true)
    this.enemy.body.useDamping = true
    this.enemy.setDrag(0.6)

    this.health = enemyHealth
  }
}


function preload() {
  //Set up code and loading assets goes here
  this.load.image('background', './assets/background.jpg')
  this.load.image('i-block', './assets/i.png')
  this.load.image('player', './assets/drone.png')
  this.load.image('bullet', './assets/bullet.png')
  this.load.image('powerup', './assets/powerup.png')
  this.load.spritesheet('explosion', './assets/explosionSpritesheet.png', {
    frameWidth: 128,
    frameHeight: 128
  });
}

function create() {
  cursors = this.input.keyboard.createCursorKeys()
  let base = 55
  let background = this.add.image(600,350,'background')
  background.scale = 2

  var config = {
    key: 'explodeAnimation',
    frames: this.anims.generateFrameNumbers('explosion', { start: 1, end: 6, first: 0 }),
    frameRate: 8,
  };

  this.anims.create(config);

  let players = this.physics.add.group()

  localPlayer = players.create(0, 0, 'player')
  console.log(players.getChildren())

  for (let player of players.getChildren()) {
    player.scale = 0.25
    player.setBounce(0.2)
    player.setMass(0.1)
    player.setCollideWorldBounds(true)
    player.body.useDamping = true
    player.setDrag(0.6)
  }
  powerups = this.physics.add.staticGroup();
  createPowerup()
  bullets = this.physics.add.group();
  enemies = this.physics.add.group();



  enemies.defaults.setAllowGravity = false

  this.physics.add.collider(enemies, bullets, shotEnemy, null, this)

  this.physics.add.collider(players, bullets, shotSelf, null, this)

  this.physics.add.collider(enemies, players, null, null, this)

  this.physics.add.overlap(enemies, powerups, enemySpeedPowerup, null, this)

  this.physics.add.overlap(players, powerups, playerSpeedPowerup, null, this)

  let enemy = new Enemy(540, 40)

  enemyClassArray.push(enemy)

  this.data.set('PlayerHealth', 500)

  this.data.set('EnemyHealth', 500)

  playerHealthText = this.add.text(25, 25, '', { font: '32px Courier', fill: '#ffff'})

  playerHealthText.setText([
    'Player Health: ' + this.data.get('PlayerHealth')
  ])

  enemyHealthText = this.add.text(800, 25, '', { font: '32px Courier', fill: '#ffff'})
  enemyHealthText.setText([
    'Enemy Health: ' + this.data.get('EnemyHealth')
  ])

  camera = this.cameras.main
  console.log(camera)
}

function update() {
  // runs every time a new frame is drawn
  let collider
  let enemy = enemies.getChildren()[0]

  if (playerHealth <= 0 || enemyClassArray[0].health <= 0) {
    GameOver = true
    let endGameText = this.add.text(420, 300, '', { font: '64px Courier', fill: '#ffff'})
    if (playerHealth <= 0) {
      endGameText.setText([
        `GAME OVER
YOU LOSE!`
      ])

    } else {
      endGameText.setText([
        `GAME OVER
YOU WIN!`
      ])
    }
    if (!finishCameraEffect) {

      camera.zoomTo(2.5, 1000)
      camera.rotateTo(0.1, false, 1000)
      finishCameraEffect = true
    }
    enemy.setVelocityX(0)
    enemy.setVelocityY(0)
    localPlayer.setVelocityX(0)
    localPlayer.setVelocityY(0)
  }

  playerHealthText.setText([
    'Player Health: ' + playerHealth
  ])

  enemyHealthText.setText([
    'Enemy Health: ' + enemyClassArray[0].health
  ])


  if (localPlayer.x > enemy.x) {
    direction = false
    localPlayer.flipX = true
    enemy.flipX = false
  } else {
    direction = true
    localPlayer.flipX = false
    enemy.flipX = true
  }

  if (cursors.left.isDown) {
    localPlayer.rotation -= 0.04
  } else if (cursors.right.isDown) {
    localPlayer.rotation += 0.04
  }
  else if (cursors.up.isDown && cursors.space.isDown && this.time.now > shootTimer) {
    playerShoot()
    shootTimer = this.time.now + 250
    // collider = new Phaser.Physics.Arcade.Collider(game, true, bullet, )
  }

  else if (cursors.up.isDown && true) {

    thrustForce = [Math.cos((Math.PI/2)-localPlayer.rotation), Math.cos(localPlayer.rotation)]
    localPlayer.setAccelerationX(thrustForce[0]*playerSpeed)
    localPlayer.setAccelerationY(-thrustForce[1]*playerSpeed)

  }

  else if (cursors.space.isDown && this.time.now > shootTimer){
    playerShoot()
    shootTimer = this.time.now + 250
  }

  else {

    localPlayer.setAccelerationX(0)
    localPlayer.setAccelerationY(0)

  }
  for (let i = 0; i < enemies.getChildren().length; i++) {
    chaseAfterPlayer(enemies.getChildren()[i])
    if ((Math.floor(Math.random()*100) > (100-SHOOT_CHANCE)) && (!GameOver)) {
      enemyShoot(enemies.getChildren()[i])
    }

  }


}
