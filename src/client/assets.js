const ASSET_NAMES = ['smallfireball.png', 'mainmapio.png', 'hud3hp.png', 'hud2hp.png', 'hud1hp.png', 'CPArrow.png', 'magespritesheetfinal.png', 'WizardDeath.png', 'WizardExtract.png', 'OrbFire.png', 'OrbFire2.png', 'OrbSpawn.png', 'OrbTrail.png', 'PointCycle.png', 'PointCaptured.png', 'CapturepointCircle.png', 'Healpointsmall.png'];

const assets = {};
const downloadPromise = Promise.all(ASSET_NAMES.map(downloadAsset));

function downloadAsset(assetName){
    return new Promise(resolve => {
        const asset = new Image();
        asset.onload = () => {
            console.log(`Downloaded ${assetName}`);
            assets[assetName] = asset;
            resolve();
        };
        asset.src = `/assets/${assetName}`;
    });
}

export const downloadAssets = () => downloadPromise;
export const getAsset = assetName => assets[assetName];