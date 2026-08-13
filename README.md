# MLIT River CCTV Data (国土交通省 河川CCTV位置情報データ)

国土交通省の「[川の防災情報](https://www.river.go.jp/)」サイトから、全国の河川CCTV（ライブカメラ）のインデックス・位置情報を定期的に取得し、Webアプリケーションから使いやすい形式（CSV）で公開・配信するリポジトリです。

このデータは [svgmap](https://github.com/svgmap) などの地図Webアプリケーションのレイヤーとして直接読み込んで利用することを想定して構築されています。

## 🌟 特徴

- **完全自動更新**: GitHub Actionsを利用し、半月に1回（毎月1日・15日）自動的に最新データを取得・更新します。
- **CORSフリー**: GitHub Pagesを通じて配信されるため、別ドメインのWebアプリからでもブラウザのCORS制限に引っかかることなく直接 `fetch` して利用できます。
- **安全な運用**: データ取得時にエラーや不完全な応答があった場合はファイル生成を中断し、常に正常なデータのみを配信します（サーバーへの過度な負荷も防ぎます）。

## 📂 提供データ (エンドポイント)

以下のURLから、常に最新のデータを直接ダウンロード・参照できます。

- 📍 **[cctv_list.csv](https://svgmap.github.io/mlit-river-cctv-data/cctv_list.csv)**
  - 全国のCCTVカメラの位置情報（経度、緯度）と、関連する属性データ（観測所名称など）をまとめたCSVファイルです。
- ⏱️ **[update_status.json](https://svgmap.github.io/mlit-river-cctv-data/update_status.json)**
  - データの最終更新日時（JST）と、取得に成功したカメラの総数が記録されています。地図アプリ側での「データ鮮度」の表示等に利用できます。

> **Note:** 上記のリンクは、本リポジトリの `Settings` > `Pages` から、Sourceを `main` ブランチに設定して GitHub Pages が有効化されていることを前提としています。

## 💻 Webアプリからの利用方法 (JavaScript)

GitHub Pagesでホスティングされているため、プロキシサーバー等は不要です。フロントエンドのJavaScriptから通常の `fetch` APIで簡単にデータを取得できます。

```javascript
// 1. 最終更新日時とステータスの取得例
const statusUrl = 'https://svgmap.github.io/mlit-river-cctv-data/update_status.json';

fetch(statusUrl)
  .then(response => response.json())
  .then(data => {
      console.log(`最終更新: ${data.last_success_update}`);
      console.log(`カメラ総数: ${data.total_cameras}件`);
  })
  .catch(error => console.error('ステータス取得エラー:', error));

// 2. CCTV位置情報CSVの取得例
const csvUrl = 'https://svgmap.github.io/mlit-river-cctv-data/cctv_list.csv';

fetch(csvUrl)
  .then(response => response.text())
  .then(csvText => {
      // 取得したCSVテキストをパースして地図（svgmap等）へプロットする処理
      console.log(csvText.substring(0, 200) + '...');
  })
  .catch(error => console.error('CSV取得エラー:', error));
```

## 📜 ライセンス

本リポジトリのソースコードおよび生成されるデータは、**Mozilla Public License 2.0 (MPL-2.0)** のもとで提供されています。
詳細については [LICENSE](./LICENSE) ファイル、または [MPL 2.0 公式サイト](https://mozilla.org/MPL/2.0/) をご参照ください。
