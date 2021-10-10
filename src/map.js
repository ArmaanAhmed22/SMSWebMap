
var ctx = null;
var map = null;


class Floor {

    static floors;
    static curFloorIndex = 0;

    static {
        Floor.floors = new Array(4)
    }

    constructor(imgName) {
        this.imgLocation = "../assets/levels/"+imgName;
        this.imgLoaded = false;
        this.img = null
    }

    setCanvas() {
        if (!this.imgLoaded) {
            this.img = new Image();
            
            this.img.src = this.imgLocation;
            const temp = this.img;
            this.img.onload = function() {
                this.imgLoaded = true;
                ctx.drawImage(temp,0,0,5000,5000);
            };
        } else {
            ctx.drawImage(this.img,0,0,5000,5000);
        }
    }

    static curFloorExists() {
        if (Floor.floors[Floor.curFloorIndex] == null) {
            return false;
        }
        return true;
    }

    static setCurrentFloor(floor) {
        Floor.floors[Floor.curFloorIndex] = floor;
    }

    static move(delta) {
        Floor.curFloorIndex = ((Floor.curFloorIndex+delta) % 4 + 4) % 4
    }

    static setCanvasToCurrentFloor() {
        Floor.floors[Floor.curFloorIndex].setCanvas();
    }
}


window.addEventListener("DOMContentLoaded", function() {
    map = document.getElementById("map");
    ctx = map.getContext("2d");
    Floor.setCurrentFloor(new Floor("SMS-1.png"));
    Floor.setCanvasToCurrentFloor();










    var setMove = function(delta) {
        Floor.move(delta);
        console.log(Floor.floors[Floor.curFloorInd]);
        if (!Floor.curFloorExists()) {
            Floor.setCurrentFloor(new Floor("SMS-"+(Floor.curFloorIndex+1)+".png"))
        }
        Floor.setCanvasToCurrentFloor();
    };
    document.getElementById("left-button").addEventListener("click",function() {
        setMove(-1);
    });
    document.getElementById("right-button").addEventListener("click",function() {
        setMove(1);
    });
});