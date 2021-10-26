

var ctx = null;
var map = null;


function log(what) {
    document.getElementById("log").innerHTML += what+"<br>";
}

function getCurUserAgent() {
    const userAgentString = navigator.userAgent;
    let safari = userAgentString.indexOf("Safari") > -1;
    let chrome = userAgentString.indexOf("Chrome") > -1;
    if (safari && !chrome) return "Safari";
    else return ""
}

/*function setCanvas(floor) {
    if (!floor.img) {
            
        floor.img = new Image();
        
        floor.img.src = floor.imgLocation;
        floor.img.onload = function() {
            floor.imgLoaded = true;
            log(floor.img);
            document.getElementById("map").getContext("2d").drawImage(floor.img,0,0,5000,5000);
        };
    } else {
        try {
            ctx.drawImage(floor.img,0,0,5000,5000);
            
        } catch (e) {
            floor.img = null;
        }
    }
}*/

function setCanvas(floor) {
    if (!floor.img) {
            
        const img = new Image();
        
        img.src = floor.imgLocation;
        img.onload = function() {
            var imgLoaded = true;
            document.getElementById("map").getContext("2d").drawImage(img,0,0,1000,1000);
        };
        floor.img = img;
    } else {
        try {
            ctx.drawImage(floor.img,0,0,1000,1000);
            
        } catch (e) {
            floor.img = null;
        }
    }
}


class Floor {

    static floors = new Array(4);
    static curFloorIndex = 0;

    constructor(imgName) {
        this.imgName = imgName;
        this.imgLocation = "../assets/levels/"+imgName;
        this.imgLoaded = false;
        this.img = null;
        this.idx = null;
        this._lines = [];

        this.rooms = [];
        this.searchRoomNames = [];

        
    }

    setCanvas() {
        /*const canvas = document.getElementById("canv");
    const image = new Image();
    image.src = "../assets/levels/SMS-1-small.png";
    image.onload = () => {
        canvas.getContext("2d").drawImage(image,0,0,500,500);
    }*/
        
        if (!this.img) {
            
            this.img = new Image();
            
            this.img.src = this.imgLocation;
            const that = this;
            this.img.onload = function() {
                that.imgLoaded = true;
                document.getElementById("map").getContext("2d").drawImage(that.img,0,0,500,500);
            };
        } else {
            try {
                ctx.drawImage(this.img,0,0,5000,5000);
                
            } catch (e) {
                this.img = null;
            }
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

    static getCurrentFloor() {
        return Floor.floors[Floor.curFloorIndex];
    }

    static move(delta) {
        Floor.curFloorIndex = ((Floor.curFloorIndex+delta) % 4 + 4) % 4
    }

    static setCanvasToCurrentFloor() {
        setCanvas(Floor.floors[Floor.curFloorIndex]);
    }

    addLine(line) {
        this._lines.push(line);
    }

    get firstLine() {
        if (this._lines.length == 0)
            return null
        return this._lines[0];
    }

    _drawLinesFromLineArray(lines) {
        lines.forEach(line => {
            ctx.beginPath();
            ctx.moveTo(line.x1,line.y1);
            ctx.lineTo(line.x2,line.y2);
            var prevStroke = ctx.strokeStyle;
            ctx.strokeStyle = "#000000";
            ctx.stroke();
            ctx.strokeStyle = prevStroke
        })
    }

    drawLines(indexToColor) {
        this._drawLinesFromLineArray(this._lines);
        var index = 0;
        this.rooms.forEach(room => {
            var color = undefined;
            if ((color=indexToColor[index])!=undefined) {
                
                room.draw(color);
            }
            else {
                room.draw("#ffff00");
            }
            index++;
        });

    }

    withinToleranceOfPoint(tolerance, curLine) {
        var allLines = this._lines;
        for (var i = 0; i < this.rooms.length; i++) {
            allLines = allLines.concat(this.rooms[i].lines);
        }
        for (var i = 0; i < allLines.length; i++) {
            var curLineTest = allLines[i];
            if (Math.pow(curLineTest.x1/10 - curLine.x2/10,2) + Math.pow(curLineTest.y1/10 - curLine.y2/10,2) < tolerance) {
                return {
                    x1: curLineTest.x1,
                    y1: curLineTest.y1
                };
            }
        }
        return null;
    }

    generateRegion(name,roomNumber) {
        this.rooms.push(new Region(name,roomNumber,...this._lines));
        this._lines = [];
    }

    whichRegion(x,y) {
        for (var i = 0; i < this.rooms.length; i++) {
            if (this.rooms[i].isIn(x,y)) {
                return i;
            }
        }
        return null;
    }

    loadSearchRoomNames() {
        for (var i = 0; i < this.rooms.length; i++) {
            const room = this.rooms[i];
            const data = {
                "name" : room.name,
                "number" : room.roomNumber,
                "aliases" : room.aliases,
                "index" : i
            }
            
            this.searchRoomNames.push(data);

        }

        const tempRooms = this.searchRoomNames;

        this.idx = lunr(function() {
            this.ref("index");
            this.field("name");
            this.field("number");
            this.field("aliases");
            tempRooms.forEach(function(region) {
                this.add(region);
            }, this)
        });

        

    }

    load(JSONObject) {
        this.imgName = JSONObject["imgName"];
        this.imgLocation = JSONObject["imgLocation"];
        this.imgLoaded = JSONObject["imgLoaded"];
        
        for (var i = 0; i < JSONObject["rooms"].length; i++) {
            this.rooms[i] = Region.load(JSONObject["rooms"][i]);
        }
    }
}

class Line {
    constructor(x1,y1,x2,y2) {
        this.x1 = x1;
        this.x2 = x2;
        this.y1 = y1;
        this.y2 = y2;
    }

    get slope() {
        return (this.y1 - this.y2) / (this.x1 - this.x2);
    }

    static load(JSONObject) {
        return new Line(JSONObject["x1"]/5, JSONObject["y1"]/5, JSONObject["x2"]/5, JSONObject["y2"]/5);
        
    }
}

class Polygon {
    constructor(...lines) {
        this.lines = lines;
        
        this.minX = Number.MAX_VALUE;
        this.minY = Number.MAX_VALUE;
        this.maxX = Number.MIN_VALUE;
        this.maxY = Number.MIN_VALUE;
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            
            this.minX = Math.min(this.minX, line.x1, line.x2);
            this.minY = Math.min(this.minY, line.y1, line.y2);
            this.maxX = Math.max(this.maxX, line.x1, line.x2);
            this.maxY = Math.max(this.maxY, line.y1, line.y2);
        }
        
    }

    isIn(x,y) {
        x /=5;
        y /=5;
        var intersections = 0;
        if (x < this.minX || x > this.maxX || y < this.minY || y > this.maxY) {
            return false;
        }
        for (var i = 0; i < this.lines.length; i++) {
            var curLine = this.lines[i];
            var intX;
            var curSlope = curLine.slope;
            
            intX = (y-curLine.y1)/curSlope + curLine.x1;
            
            if (curSlope == 0) {
                continue;
            }
            
            if (intX > x) {
                continue
            }
            if ((curLine.y2-y) * (curLine.y1 - y) < 0) {
                intersections++;
            }
            

        }
        if (intersections % 2 == 0) {
            return false;
        } else {
            return true;
        }
    }

    draw(fillColor) {
        ctx.strokeStyle = "#000000";
        ctx.fillStyle = fillColor;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        for (var i = 0; i < this.lines.length; i++) {
            if (i == 0)
                ctx.moveTo(this.lines[i].x1,this.lines[i].y1);
            else
                ctx.lineTo(this.lines[i].x1,this.lines[i].y1);
        }
        ctx.closePath();
        
        //ctx.stroke();
        ctx.fill();
        
        ctx.globalAlpha = 1;
    }
}


class Region extends Polygon {

    /*static regionAliases = {
        "mathematics": "math",
        "math":  "mathematics",
        "history": "social studies, world history",
        "social studies" : "history, world history",
        "world history" : "history, social studies",
        "gymnasium" : "gym",
        "gym" : "gymnasium",
        "technology" : "tech",
        "tech" : "technology",
        "restroom" : "bathroom, toilet",
        "bathroom" : "toilet, restroom",
        "toilet" : "restroom, bathroom",
        "men" : "man, boy"
    }*/
    


    static createRegionAliases(aliasOneWay) {
        var finalDict = {}
        for (var key of Object.keys(aliasOneWay)) {
            
            var totalList = aliasOneWay[key].split(", ").concat([key]);
            for (var i = 0; i < totalList.length; i++) {
                var resultList = []
                for (var j = 0; j < totalList.length; j++) {
                    if (j!=i) {
                        resultList.push(totalList[j]);
                    }
                }
                finalDict[totalList[i]] = resultList.join(", ");
            }
        }
        return finalDict;
    }

    static regionAliases = Region.createRegionAliases(
        {
            "mathematics" : "math",
            "history" : "social studies, world history",
            "gymnasium" : "gym",
            "technology" : "tech",
            "restroom" : "bathroom, toilet",
            "men" : "man, boy",
            "women" : "woman, girl"
        }
        );

    constructor(name,roomNumber,...lines) {
        super(...lines);
        this.name = name;
        this.roomNumber = roomNumber;
        this.aliases = [];
        for (var token of name.split(" ")) {
            token = token.split("'s")[0];
            var tempAlias = undefined;
            if ((tempAlias = Region.regionAliases[token.toLowerCase()])) {
                this.aliases.push(tempAlias);
            }
        }
        this.aliases = this.aliases.join(", ");
    }

    static load(JSONObject) {
        var lines = []
        for (var i = 0; i < JSONObject["lines"].length; i++) {
            lines.push(Line.load(JSONObject["lines"][i]));
        }
        return new Region(JSONObject["name"],JSONObject["roomNumber"],...lines)
    }
}

class FollowableRegionTooltipElement {
    constructor(name, description) {
        
        this.elem = document.createElement("div");
        document.body.appendChild(this.elem);
        this.elem.style.position = "fixed";
        this.elem.style.width = "500px";
        this.elem.style.height = "500px";
        this.elem.style.visibility = "hidden";
        this.elem.style.color = "#999999";
        this.elem.style.zIndex = "100";

        
    }
    move(x,y) {
        this.elem.style.left = x+"px";
        this.elem.style.right = y+"px";
    }

    activate() {
        this.elem.style.visibility = "visible";
    }
}

var setMove = function(delta) {
    
    Floor.move(delta);
    var curFloor = (Floor.curFloorIndex+1)
    if (!Floor.curFloorExists()) {
        Floor.setCurrentFloor(new Floor("SMS-"+curFloor+"-small.png"));
        var rawFile = new XMLHttpRequest();
        rawFile.overrideMimeType("application/json");
        rawFile.open("GET", "../assets/levels/SMS-"+curFloor+".json", true);
        rawFile.onreadystatechange = function() {
            if (rawFile.readyState === 4 && rawFile.status == 200) {
                Floor.getCurrentFloor().load(JSON.parse(rawFile.responseText));
                Floor.getCurrentFloor().loadSearchRoomNames();
            }
        }
        rawFile.send(null);

        
    }
    Floor.setCanvasToCurrentFloor();
    document.getElementById("floor-label").innerText = "Floor: " + curFloor;


};

function setFloorLabelPos() {
    var floorLabel = document.getElementById("floor-label");
    floorLabel.style.left = map.getBoundingClientRect().left+"px";
    floorLabel.style.top = map.getBoundingClientRect().top+map.style.marginTop+"px";

    const borderWidth = (map.offsetWidth - map.clientWidth) / 2
    floorLabel.style.left = map.getBoundingClientRect().left+borderWidth+"px";
    floorLabel.style.top = map.getBoundingClientRect().top+borderWidth+"px";
}

window.addEventListener("resize", function() {
    setFloorLabelPos();
})

window.addEventListener("DOMContentLoaded", function() {
    map = document.getElementById("map");
    ctx = map.getContext("2d");

    

    setFloorLabelPos();

    setMove(0);
    var borderWidth = 0;
    if (getCurUserAgent() == "Safari")
        borderWidth = (map.offsetWidth - map.clientWidth) / 2

    function layerToRelativeX(layerX) {
        return 10*(layerX-borderWidth);
    }

    function layerToRelativeY(layerY) {
        return 10*(layerY-borderWidth);
    }
    const tooltip = document.getElementById("tooltip");
    const tooltipBuffer = 10;
    prevDraw = -1;
    var moveTooltip = true;
    var clickedIndex = -1;
    map.addEventListener("click", function(ev) {
        setMove(0);
        var colors = {}
        if ((index=Floor.getCurrentFloor().whichRegion(layerToRelativeX(ev.offsetX),layerToRelativeY(ev.offsetY))) != null) {
            clickedIndex = index;
            if (clickedIndex == -1)
                moveTooltip = false
            colors[index] = "#00ff00";
            
        } else {
            moveTooltip = true;
        }
        Floor.getCurrentFloor().drawLines(colors);
    });

    map.addEventListener("mousemove", function(ev) {

        if ((index=Floor.getCurrentFloor().whichRegion(layerToRelativeX(ev.offsetX),layerToRelativeY(ev.offsetY))) != null) {
            if (moveTooltip) {
                tooltip.style.visibility="visible";
                tooltip.style.left = ev.pageX+tooltipBuffer+"px";
                tooltip.style.top = ev.pageY+tooltipBuffer+"px";
                var curRoom = Floor.getCurrentFloor().rooms[index];
                tooltip.innerHTML = curRoom.name;
                if (curRoom.roomNumber) {
                    tooltip.innerHTML+="<br /><b>"+curRoom.roomNumber+"</b>";
                }

                if (clickedIndex != index) {
                    moveTooltip = true;
                    clickedIndex = -1;
                }

            }
        }
        else {
            tooltip.style.visibility="hidden";
            moveTooltip = true;
        }
        
    });





    
    document.getElementById("left-button").addEventListener("click",function() {
        setMove(-1);
    });
    document.getElementById("right-button").addEventListener("click",function() {
        setMove(1);
    });

    var curX = -1;
    var curY = -1;

    var curLine = new Line(-1,-1,-1,-1);

    var shapeClosed = false;
    /*
    map.addEventListener("click", function(ev) {
        if ((index = Floor.getCurrentFloor().whichRegion(10*(ev.layerX - borderWidth),10*(ev.layerY - borderWidth))) != null) {
            if (ev.shiftKey) {
                Floor.getCurrentFloor().rooms.pop(index);
                return;
            }
        }
        
        if (!(curLine.x1 == -1 || curLine.y1 == -1)) {
            Floor.getCurrentFloor().addLine(curLine);
            if (shapeClosed) {
                curLine = new Line(-1,-1,-1,-1);
                shapeClosed = false;
                var shapeName = prompt("Name of region");
                var roomNumber = prompt("Room number");
                Floor.getCurrentFloor().generateRegion(shapeName,roomNumber);
            }
            else
                curLine = new Line(curLine.x2,curLine.y2,curLine.x2,curLine.y2);
            
        }
        else {
            if (result = Floor.getCurrentFloor().withinToleranceOfPoint(10,curLine)) {
                curLine.x1 = result.x1;
                curLine.y1 = result.y1;
            }
            else {
                curLine.x1 = 10*(ev.layerX - borderWidth);
                curLine.y1 = 10*(ev.layerY - borderWidth);
            }
        }

        

    });*/

    var toolTip = new FollowableRegionTooltipElement("test","test");
    toolTip.activate();
    /*
    map.addEventListener("mousemove", function(ev) {

        
        toolTip.move(ev.pageX,ev.pageY);

        setMove(0);

        curLine.x2 = 10*(ev.layerX - borderWidth);
        curLine.y2 = 10*(ev.layerY - borderWidth)

        ctx.lineWidth = 10;
        Floor.getCurrentFloor().drawLines();

        if (curLine.x1 != -1) {
            
            ctx.beginPath();
            ctx.moveTo(curLine.x1,curLine.y1);
            
            if (result = Floor.getCurrentFloor().withinToleranceOfPoint(10,curLine)) {
                ctx.lineTo(result.x1,result.y1);
                curLine.x2 = result.x1;
                curLine.y2 = result.y1;
                if (Floor.getCurrentFloor().firstLine !=null && (curLine.x2 == Floor.getCurrentFloor().firstLine.x1 && curLine.y2 == Floor.getCurrentFloor().firstLine.y1)) {
                    shapeClosed = true;
                } else {
                    shapeClosed = false;
                }
                
            } else {
                ctx.lineTo(curLine.x2,curLine.y2);
                shapeClosed = false;
            }
            ctx.strokeStyle = "#ff0000"
            ctx.stroke();
        }

    });*/

    /*
    window.addEventListener("keypress", function(key) {
        if (key.key == "Enter") {
            var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(Floor.getCurrentFloor(),null,2));
            var dlAnchorElem = document.createElement("a");
            dlAnchorElem.setAttribute("href",     dataStr     );
            dlAnchorElem.setAttribute("download", Floor.getCurrentFloor().imgName.split(".")[0]+".json");
            dlAnchorElem.click();
        } if (key.key == "w") {
            curLine.y1-=1;
        }
        if (key.key == "s") {
            curLine.y1+=1;
        }
        if (key.key == "a") {
            curLine.x1-=1;
        }
        if (key.key == "d") {
            curLine.x1-=1;
        }

    });*/
});

function generateQuery(curString) {
    var curQuery = "";
    for (var token of curString.split(" ")) {
        curQuery+="+"+token;
        if (token.length >= 4) {
            curQuery+="~1";
        }
        curQuery+=" ";
    }
    return curQuery;
}

function search(event) {
    if (event.key == "Enter") {
        setMove(0);
        var results = Floor.getCurrentFloor().idx.search(generateQuery(event.srcElement.value));
        var colors = {}
        for (const res of results) {
            const index = parseInt(res.ref);
            colors[index] = "#ff0000";
        }
        Floor.getCurrentFloor().drawLines(colors);
        
        
    }
}