var LEVEL_WIDTH=20;
var INIT_LEVELS=5;
var NEW_LEVELS=2;
var WORKER_PRICE=10;
var HERO_PRICE=1000;
var WIZARD_PRICE=10000;
var CELL_DEF = 1;
var CELL_DUG = 2;
var CELL_PORTAL = 4;
var CELL_ROCK = 8;

var state = {
    workers: 5,
    heroes: 0,
    wizards: 0,
    gold: 0,
    portals: 0,
    levels: [],
    log: []
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function newLevels(c) {
    for (var i = 0; i < c; i++) {
        var l = [];
        for (var j = 0; j < LEVEL_WIDTH; j++) {
            if (getRandomInt(0,100) < state.levels.length) {
                l.push(CELL_ROCK);
            } else {
                l.push(CELL_DEF);
            }
        };
        state.levels.push(l);
    };
}

function logMessage(m){
    state.log.push(m);
}

newLevels(INIT_LEVELS);

var dirty = true;

function checkDig(depth,cell) {
    if (depth == 0) {
        return true;
    } else {
        if (cell-1 >= 0 && state.levels[depth][cell-1] & CELL_DUG) {
            return true;
        } else if (cell+1 < LEVEL_WIDTH && state.levels[depth][cell+1] & CELL_DUG) {
            return true;
        } else if (depth-1 >= 0 && state.levels[depth-1][cell] & CELL_DUG) {
            return true;
        } else if (depth+1 < state.levels.length && state.levels[depth+1][cell] & CELL_DUG) {
            return true;
        } 
    }    
    return false;
}

function dig(depth, cell) {
    if (state.levels[depth][cell] & CELL_PORTAL) {
        if ((state.heroes + state.workers) == 0) {
            logMessage("Must have workers or heroes to attempt to close a portal.")
        } else if (state.heroes > 0) {
            var portalCloseChance = Math.max(100-(depth/2),10)
            var portal = getRandomInt(0,100);
            console.log("close",depth,cell,portalCloseChance,portal)
            if (portal < portalCloseChance) {
                state.portals -= 1;
                state.levels[depth][cell] = CELL_DUG;
            } else {
                logMessage("A hero died attempting to close a portal.")
                state.heroes -= 1;
            }
        } else {
            var portalCloseChance = Math.max(100-(depth*2),1)
            var portal = getRandomInt(0,100);
            console.log("close",depth,cell,portalCloseChance,portal)
            if (portal < portalCloseChance) {
                if (portal == 0) {
                    logMessage("A worker has closed a portal and returned a hero!");
                    state.workers -= 1;
                    state.heroes += 1;
                }
                state.portals -= 1;
                state.levels[depth][cell] = CELL_DUG;
            } else {
                logMessage("A worker died attempting to close a portal.")
                state.workers -= 1;
            }
        }
    } else if (state.levels[depth][cell] & CELL_ROCK) {
        if (state.wizards == 0) {
            logMessage("Can't melt rock without a wizard.")
        } else if (checkDig(depth,cell)) {
            if (state.portals > 0) {
                logMessage("A portal leeched " + (10*state.portals) + " gold.")
            }            
            var reward = getRandomInt(Math.max(0,depth-3)*10,(depth+2)*10) + 100 - (10 * state.portals);
            var portal = getRandomInt(0,100);
            console.log("melt",depth,cell,reward,portal);
            state.gold += reward;
            if (portal > 95) {
                logMessage("Your wizard melted the rock... and himself.");
                state.wizards -= 1;
            }
            state.levels[depth][cell] = CELL_DUG;
            if (depth+1 == state.levels.length) {
                newLevels(NEW_LEVELS);
            }
        }        
    } else if (state.levels[depth][cell] & CELL_DEF) {
        if (state.workers == 0) {
            logMessage("Can't dig without a worker.")
        } else if (checkDig(depth,cell)) {
            if (state.portals > 0) {
                logMessage("A portal leeched " + (10*state.portals) + " gold.")
            }
            var reward = getRandomInt(Math.max(0,depth-3)*10,depth+2) + 10 - (10 * state.portals);
            var portalChance = Math.min(Math.max(0,depth-2)*2,30)
            var portal = getRandomInt(0,100);
            console.log("dig",depth,cell,reward,portalChance,portal);
            state.gold += reward;
            if (portal < portalChance) {
                state.portals += 1;
                state.levels[depth][cell] = CELL_PORTAL;
            } else {
                state.levels[depth][cell] = CELL_DUG;
            }
            if (depth+1 == state.levels.length) {
                newLevels(NEW_LEVELS);
            }
        } else {
            logMessage("Can't dig here.")
        }
    } else {
        console.log("error", depth,cell,state.levels[depth][cell])
    }
    dirty = true;
}

var LevelCell = React.createClass({
    dig: function() {
        dig(this.props.depth,this.props.idx);
    },
    render: function () {
        var self = this;
        var cell_text;
        if (this.props.cell & CELL_PORTAL) {
            cell_text = "@";
        } else if (this.props.cell & CELL_DUG) {
            cell_text = " ";
        } else if (this.props.cell & CELL_ROCK) {
            cell_text = "%";
        } else {
            cell_text = "#"
        }
        return (
            <td className="lvlcell" onClick={self.dig}>
                {cell_text}
            </td>
        )
    }
})

var LevelRow = React.createClass({
    render: function() {
        var self = this;
        var lvl_cells = self.props.row.map(function(lc, i){
            return (
                <LevelCell key={"cell-" + self.props.depth + "-" + i} idx={i} depth={self.props.depth} cell={lc} />
            )
        });
        return (
            <tr className="lvlrow">
                <td className="cell depth-header">{self.props.depth+1}</td>
                {lvl_cells}
            </tr>
        );
    }
})

var Levels = React.createClass({
    render: function() {
        var self = this;
        var lvl_rows = state.levels.map(function(lr, i){
            return (
                <LevelRow key={"row-"+i} depth={i} row={lr} />
            )
        });
        return (
            <table>
                <tbody id="lvlrowcontainer">
                    {lvl_rows}
                </tbody>
            </table>
        );
    }
})

var MainUI = React.createClass({
    buyWorker: function() {
        if (state.gold >= WORKER_PRICE) {
            state.gold -= WORKER_PRICE;
            state.workers += 1;
        } else {
            alert("Workers cost " + WORKER_PRICE + " gold.")
        }
        dirty = true;
    },
    buyHero: function() {
        if (state.gold >= HERO_PRICE) {
            state.gold -= HERO_PRICE;
            state.heroes += 1;
        } else {
            alert("Heroes cost " + HERO_PRICE + " gold.")
        }
        dirty = true;
    },
    buyWizard: function() {
        if (state.gold >= WIZARD_PRICE) {
            state.gold -= WIZARD_PRICE;
            state.wizards += 1;
        } else {
            alert("Wizards cost " + WIZARD_PRICE + " gold.")
        }
        dirty = true;
    },        
    componentDidMount: function() {
        document.getElementById("lvlrowcontainer").lastChild.scrollIntoView();
    },
    componentDidUpdate: function() {
        document.getElementById("lvlrowcontainer").lastChild.scrollIntoView();
    },
    render: function() {
        var last_start = Math.max(0,state.log.length-10);
        var last_lines = state.log.slice(last_start,state.log.length)
        last_lines.reverse()
        var logLines = last_lines.map(function(m, i){
            return (
                <li key={"log-line-" + last_start+i} >{m}</li>
            )
        })
        return (
            <div className="container-fluid uibox">
                <div className="row">
                    <div className="col-md-2">
                        <ul>
                            <li>Workers: {state.workers} <a href="#" alt="Buy a Worker" onClick={this.buyWorker}><span className="glyphicon glyphicon-plus" aria-hidden="true"></span></a></li>
                            <li>Heroes: {state.heroes} <a href="#" alt="Buy a Hero" onClick={this.buyHero}><span className="glyphicon glyphicon-plus" aria-hidden="true"></span></a></li>
                            <li>Wizards: {state.wizards} <a href="#" alt="Buy a Wizard" onClick={this.buyWizard}><span className="glyphicon glyphicon-plus" aria-hidden="true"></span></a></li>
                            <li>Gold: {state.gold}</li>
                        </ul>

                        <ul>
                            {logLines}
                        </ul>
                    </div>
                    <div className="col-md-10 levels-box">
                        <Levels />
                    </div>
                </div>
            </div>
        )
    }
})

function render(){
    if (dirty) {
        ReactDOM.render(
            <MainUI />,
            document.getElementById('example')
        );
        dirty = false;
    }
    requestAnimationFrame(render);
}

requestAnimationFrame(render);