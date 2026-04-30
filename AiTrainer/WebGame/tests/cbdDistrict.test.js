const assert = require('assert');
const { CBDDistrict } = require('../cbd-district.js');

const district = CBDDistrict.createDistrictState();

assert.strictEqual(CBDDistrict.isTileWalkable(district, 1, 5), true, 'sidewalk tiles should be walkable');
assert.strictEqual(CBDDistrict.isTileWalkable(district, 8, 4), false, 'road tiles should be blocked away from crosswalks');
assert.strictEqual(CBDDistrict.isTileWalkable(district, 8, 6), true, 'crosswalk tiles should be walkable');
assert.strictEqual(CBDDistrict.isTileWalkable(district, 3, 3), false, 'building tiles should be blocked');

const blockedMove = CBDDistrict.tryMovePlayer(
    { ...district, player: { x: 8 * 64 + 32, y: 4 * 64 + 32, radius: 14 } },
    0,
    12
);
assert.strictEqual(blockedMove.player.y, 4 * 64 + 32, 'player should not move deeper into road');

const crosswalkMove = CBDDistrict.tryMovePlayer(
    { ...district, player: { x: 8 * 64 + 32, y: 6 * 64 + 32, radius: 14 } },
    0,
    12
);
assert.strictEqual(crosswalkMove.player.y, 6 * 64 + 44, 'player should move on crosswalk');

console.log('CBD district tests passed');
