// debug helpers for the WorldCreator
define(['ash', 'game/constants/WorldConstants', 'worldcreator/WorldCreatorHelper'], function (Ash, WorldConstants, WorldCreatorHelper) {

    var WorldCreatorDebug = {
        
        printWorldTemplate: function (worldVO) {
            console.groupCollapsed("World seed " + worldVO.seed);
            var s = "";
			for (var l = worldVO.topLevel; l >= worldVO.bottomLevel; l--) {
                var campOrdinal = WorldCreatorHelper.getCampOrdinal(worldVO.seed, l);
                var r = 40;
                var pieces = [];
                for (var i = 0; i <= r * 2; i++) {
                    var x = i - r;
                    var piece = "-";
                    pieces[i] = piece;
                }
                for (var i = 0; i < worldVO.districts[l].length; i++) {
                    var district = worldVO.districts[l][i];
                    for (var x = district.getMinX(); x <= district.getMaxX(); x++) {
                        pieces[x + r] = district.type.substring(0,1);
                    }
                }
                for (var i = 0; i < worldVO.features.length; i++) {
                    var feature = worldVO.features[i];
                    if (!feature.spansLevel(l)) continue;
                    for (var x = feature.getMinX(); x <= feature.getMaxX(); x++) {
                        pieces[x + r] = feature.type.substring(0,1);
                    }
                }
                var posUp = worldVO.passagePositions[l].up;
                var posDown = worldVO.passagePositions[l].down;
                if (posUp) pieces[posUp.sectorX + r] = "U";
                if (posDown) pieces[posDown.sectorX + r] = "D";
                for (var i = 0; i < worldVO.campPositions[l].length; i++) {
                    var campPos = worldVO.campPositions[l][i];
                    pieces[campPos.sectorX + r] = "{C|red}";
                }
                
                var ls = this.addPadding(l, 2);
                var cs = this.addPadding(campOrdinal, 2);
                s += "lvl " + ls + " camp " + cs + "  " + pieces.join("") +  "\n";
            }
            this.printWithHighlights(s);
            console.groupEnd();
        },
        
        printLevelTemplates: function (worldVO) {
            console.groupCollapsed("Level templates");
            for (var l = worldVO.topLevel; l >= worldVO.bottomLevel; l--) {
                var levelVO = worldVO.levels[l];
                var stages = worldVO.getStages(l);
                var stagess = stages.map(stage => stage.stage).join(",");
                log.i("Level " + levelVO.level + ", camp ordinal: " + levelVO.campOrdinal + ", stages: " + stagess + ", sectors: " + levelVO.numSectors + ", zones: " + levelVO.zones.length);
                log.i("- passage positions: up: " + levelVO.passageUpPosition + ", down: " + levelVO.passageDownPosition);
                log.i("- camp positions: " + levelVO.campPositions.join(","));
                log.i("- excursion start position: " + levelVO.excursionStartPosition);
            }
            console.groupEnd();
        },
        
        printLevelStructure: function (worldVO) {
            for (var l = worldVO.topLevel; l >= worldVO.bottomLevel; l--) {
                var levelVO = worldVO.levels[l];
                this.printLevel(worldVO, levelVO, function (sectorVO) {});
            }
        },
        
        printSectorTemplates: function (worldVO) {
			for (var l = worldVO.topLevel; l >= worldVO.bottomLevel; l--) {
                var levelVO = worldVO.getLevel(l);
                this.printLevel(worldVO, levelVO, function (sectorVO) {
                    var criticalPath = sectorVO.getCriticalPathC();
                    var zone = sectorVO.getZoneC();
                    return { char: zone, color: null }
                });
            }
        },
		
		printWorld: function (worldVO, keys, color) {
            log.i("print world " + keys.join(","));
            var prepareValue = function (value) {
                var char = value.toString()[0];
                var c = value ? color : null;
                return { char: char, color: c };
            };
			for (var l = worldVO.topLevel; l >= worldVO.bottomLevel; l--) {
                var levelVO = worldVO.getLevel(l);
                this.printLevel(worldVO, levelVO, function (sectorVO) {
                    if (!sectorVO) return null;
                    for (var k = 0; k < keys.length; k++) {
                        var key = keys[k];
                        var keySplit = key.split(".");
                        if (keySplit.length === 1) {
                            if (sectorVO[key] || sectorVO[key] === 0) {
                                return prepareValue(sectorVO[key]);
                            }
                        } else {
                            if (sectorVO[keySplit[0]][keySplit[1]] || sectorVO[keySplit[0]][keySplit[1]] == 0) {
                                return prepareValue(sectorVO[keySplit[0]][keySplit[1]]);
                            }
                        }
                    }
                    return null;
                });
            }
		},
		
		printLevel: function (worldVO, levelVO, sectordef) {
            console.groupCollapsed("Level " + levelVO.level + ", camp " + (levelVO.isCampable ? levelVO.campOrdinal :  "-")
                + ", sectors: " + levelVO.sectors.length + "/" + levelVO.numSectors
                + ", early: " + levelVO.getNumSectorsByStage(WorldConstants.CAMP_STAGE_EARLY) + "/" + levelVO.numSectorsByStage[WorldConstants.CAMP_STAGE_EARLY]
                + ", late: " + levelVO.getNumSectorsByStage(WorldConstants.CAMP_STAGE_LATE) + "/" + levelVO.numSectorsByStage[WorldConstants.CAMP_STAGE_LATE]
            );
            log.i("seed: " + worldVO.seed + ", " + ", center: " + levelVO.levelCenterPosition +  ", bounds: " + levelVO.minX + "." + levelVO.minY + "-" + levelVO.maxX + "." + levelVO.maxY);
			var print = "\t";
            var rx = 20;
            var ry = 10;
            var minX = Math.min(levelVO.minX-1, -rx);
            var maxX = Math.max(levelVO.maxX+1, rx);
            var minY = Math.min(levelVO.minY-1, -ry);
            var maxY = Math.max(levelVO.maxY+2, ry);
		
			for (var x = minX; x <= maxX; x++) {
				print += String(x).length > 1 ? String(x).substring(0, 2) : x + " ";
			}
		
			for (var y = minY; y <= maxY; y++) {
				print += "\n";
				print += y + "\t";
				for (var x = minX; x <= maxX; x++) {
					if (levelVO.hasSector(x, y)) {
                        var sectorVO = levelVO.getSector(x, y);
                        var defaultColor = sectorVO.stage == WorldConstants.CAMP_STAGE_EARLY ? "#111" : "#abc";
                        if (sectorVO.isCamp)
                            defaultColor = "red";
                        if (sectorVO.isPassageUp || sectorVO.isPassageDown)
                            defaultColor = "blue";
                        var def = sectordef(sectorVO);
                        if (def)
                            print += "{" + def.char + "|" + (def.color || defaultColor) + "} ";
                        else if (sectorVO.isPassageUp && sectorVO.isPassageDown)
                            print += "{O|" + defaultColor + "} ";
                        else if (sectorVO.isPassageUp)
                            print += "{U|" + defaultColor + "} ";
                        else if (sectorVO.isPassageDown)
                            print += "{D|" + defaultColor + "} ";
                        else if (sectorVO.isCamp)
                            print += "{C|" + defaultColor + "} ";
                        else if (sectorVO.isConnectionPoint)
                            print += "{c|" + defaultColor + "} ";
                        else if (sectorVO.isFill)
                            print += "{F|" + defaultColor + "} ";
                        else
                            print += "{+|" + defaultColor + "} ";
					} else {
                        var position = { level: levelVO.level, sectorX: x, sectorY: y};
                        var features = worldVO.getFeaturesByPos(position);
                        if (levelVO.levelCenterPosition.equals(position)) {
                            print += "{C|#eb2} ";
                        } else if (levelVO.isInvalidPosition(position)) {
                            print += "{·|#e11} ";
                        } else if (features.length > 0) {
                            var feature = features[0];
                            var char = feature.isBuilt() ? "T" : "H";
                            print += "{" + char + "|#eee} ";
                        } else {
                            print += "{·|#eee} ";
                        }
                    }
				}
			}
            this.printWithHighlights(print);
            console.groupEnd();
		},
        
        printWithHighlights: function (text) {
            var splitText = text.split(/\}|\{/);
            var cssRules = [];
            var styledText = '';
            for (var split of splitText)  {
                var content = split;
                var parts = split.split("|");
                if (parts.length > 1) {
                    content = parts[0];
                    var color = parts[1];
                    cssRules.push('color:' + color);
                } else {
                    cssRules.push('color:inherit')
                }
                styledText += `%c${content}`
            };
            console.log(styledText , ...cssRules)
        },
        
        addPadding: function (s, minChars) {
            var result = s + "";
            while (result.length < minChars) {
                result = " " + result;
            }
            return result;
        },
        
    };

    return WorldCreatorDebug;
});