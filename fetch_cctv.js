// Description:
// 国土交通省川の防災情報サイトから、CCTVのインデックス情報を取得・csvで保存する
//
// Programmed by Satoru Takagi
// Node.js CLI / GitHub Actions adaptation
// 
// License: (MPL v2)
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

const fs = require('fs');

const bunchSize = 10;
let camData = { type: "FeatureCollection", features: [] };
let townJson, prefJson;
let damDict = {};
let hasError = false; // 🌟不完全データ検知用フラグ

// タイムアウト（10秒）付きのfetch
async function fetchJson(url) {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
}

async function init() {
    console.log("処理を開始します...");
    const townUrl = "https://www.river.go.jp/kawabou/file/files/map/twn/twnarea.json";
    const prefUrl = "https://www.river.go.jp/kawabou/file/files/map/pref/prefarea.json";
    
    townJson = await fetchJson(townUrl);
    prefJson = await fetchJson(prefUrl);
    
    await getScamData();
}

async function getScamData() {
    const scamUrl = "https://www.river.go.jp/kawabou/file/gjson/scam/";
    let tjp = [];
    
    for (let i = 0; i < townJson.towns.length; i++) {
        let town = townJson.towns[i];
        if (town.scamExistFlg == 1) {
            tjp.push(fetchJson(scamUrl + town.twnCd + ".json").catch((e) => {
                console.error(`[Error] ${town.twnCd} の取得に失敗: ${e.message}`);
                hasError = true; // 1件でも失敗したらフラグを立てる
                return null;
            }));
            
            if (tjp.length === bunchSize) {
                let camTowns = await Promise.all(tjp);
                for (let camTown of camTowns) {
                    if (camTown && camTown.features) {
                        camData.features = camData.features.concat(camTown.features);
                    }
                }
                tjp = [];
                console.log(`進捗: ${i + 1} / ${townJson.towns.length}`);
            }
        }
    }
    
    // 残りのバッチを処理
    if (tjp.length > 0) {
        let camTowns = await Promise.all(tjp);
        for (let camTown of camTowns) {
            if (camTown && camTown.features) {
                camData.features = camData.features.concat(camTown.features);
            }
        }
    }
    
    // 🌟 失敗があった場合はここで処理を中断し、CSVとJSONを作らない
    if (hasError) {
        throw new Error("一部データの取得に失敗したため、不完全なファイルの生成を中止します。");
    }
    
    console.log("全データの取得に成功しました。ファイルを出力します...");
    printCsv(camData);
    saveStatus(); // 成功した日時と件数を記録するファイル
}

function printCsv(camData) {
    let schema = [];
    let ansTxt = "";
    
    for (let cam of camData.features) {
        let prop = cam.properties;
        let name = prop.obs_nm;
        if (name) {
            if (!damDict[name]) damDict[name] = cam;
        }
        
        if (schema.length === 0) {
            for (let key in prop) {
                schema.push(key);
            }
            ansTxt += "longitude,latitude," + schema.join(",") + "\n";
        }
        
        let propArray = [];
        for (let key of schema) {
            propArray.push(prop[key]);
        }
        ansTxt += cam.geometry.coordinates.join(",") + "," + propArray.join(",") + "\n";
    }
    
    fs.writeFileSync('cctv_list.csv', ansTxt, 'utf-8');
    console.log("cctv_list.csv の生成が完了しました！");
}

function saveStatus() {
    // 日本時間 (JST) でフォーマット
    const now = new Date();
    const jstDate = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    
    const statusData = {
        last_success_update: jstDate.toISOString().replace('Z', '+09:00'),
        status: "success",
        total_cameras: camData.features.length
    };
    fs.writeFileSync('update_status.json', JSON.stringify(statusData, null, 2), 'utf-8');
    console.log("update_status.json を生成しました！");
}

// 実行とエラーハンドリング
init().catch(err => {
    console.error("処理が中断されました:", err.message);
    // エラーコード1で終了させることで、GitHub Actionsの以降のステップ（Gitコミット）を強制キャンセルする
    process.exit(1);
});
