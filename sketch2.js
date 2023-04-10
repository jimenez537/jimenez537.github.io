function setup() {
  createCanvas(600, 600);
  background("black");
  stroke("white");
}
let x;
let y;
let lastX = 0;
let lastY = 0;
let num;
function draw() {
  strokeWeight(0.1);
  for (i = 0; i < 100; i++) {
    //let mappedX = map(lastX, 0, 4.8738, 0, 600);
    let mapX = map(lastX, -2.182, 2.6558, 600, 0);
    let mapY = map(lastY, 0, 9.9983, 600, 0);
    point(mapX, mapY);
    num = random(0, 100);
    if (num <1) {// 1%
      x = 0;
      y = 0.16 * lastY;
    } else if (num <= 7) {// 7%
      x = -0.15 * lastX + 0.28 * lastY;
      y = 0.26 * lastX + 0.24 * lastY + 0.44;
    } else if (num <= 14) { // other 7%
      x = 0.2 * lastX - 0.26 * lastY;
      y = 0.23 * lastX + 0.22 * lastY + 1.6;
    } else { //rest of 85%
      x = 0.85 * lastX + 0.04 * lastY;
      y = -0.04 * lastX + 0.85 * lastY + 1.6;
    }
    //x = x + 2.182;
    lastX = x;
    lastY = y;
  }
}
