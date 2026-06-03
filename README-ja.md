<p align="center">
  <img src="doc/bloch-stereo-logo.svg" alt="Bloch Stereo logo" width="96" height="96">
</p>

# Bloch Stereo Quantum Circuit Editor

[English](README.md) | [日本語](README-ja.md)

[![CI](https://img.shields.io/github/actions/workflow/status/todo-group/bloch-stereo/ci.yml?branch=main&label=CI)](https://github.com/todo-group/bloch-stereo/actions/workflows/ci.yml)
![Author](https://img.shields.io/badge/author-Synge%20Todo-0A7E8C)
[![npm >=10.9](https://img.shields.io/badge/npm-%3E%3D10.9-CB3837?logo=npm&logoColor=white)](https://www.npmjs.com/)
[![three.js](https://img.shields.io/npm/v/three?label=three.js&logo=threedotjs&logoColor=white)](https://www.npmjs.com/package/three)
[![React](https://img.shields.io/npm/v/react?label=react&logo=react)](https://www.npmjs.com/package/react)
[![Vite](https://img.shields.io/npm/v/vite?label=vite&logo=vite)](https://www.npmjs.com/package/vite)

Bloch Stereo は、教育・デモ・科学館展示向けのブラウザベース量子回路エディタ兼ステレオ Bloch 球ビジュアライザです。

小規模な回路を対象に、縮約密度行列、測定 collapse、接続相関、量子テレポーテーションを視覚的に理解しやすくすることを重視しています。

## 機能

- OpenQASM 2.0 の import/export
- ステップ実行、前後移動、リセット、オートプレイ、左右矢印キーによる移動
- Stream Deck で使いやすい control: `ArrowLeft`, `S`, `ArrowRight`, `R`/`Home`, `E`, `+`, `T`, `C`, `V`, `Z`, `B`
- density-matrix backend をデフォルトにしたシミュレーション
- density-matrix noise channel: `depolarize(p)`, `dephase(p)`, `ampdamp(p)`
- simulator API では statevector backend も利用可能
- 1量子ビット縮約密度行列から計算した Bloch ベクトルの滑らかなアニメーション
- 1から3個までの表示 Bloch 球を選択可能
- 量子ビット対を選択できる 2量子ビット接続相関行列
- measurement ステップへ進むときの乱数サンプリング
- 以前の measurement 結果は保持し、これから入る measurement だけを再サンプル
- 赤シアンアナグリフ stereo 表示
- eye separation、focus、red gain、cyan gain の調整
- `|0>` が上になる向きへ戻す Bloch view reset
- ボタンで開く QASM editor modal
- 左側の circuit editor panel の hide/show button

## プリセット

プリセットのプルダウンには以下があります。

- `|0>`
- `|00>`
- `|000>`
- Bell 状態生成
- 積混合状態 `I/2 x I/2`
- GHZ 状態生成
- H-CZ 測定回路
- ランダムな2量子ビット状態 + 3つの `cx` による SWAP
- Alice の初期状態がランダムな量子テレポーテーション

量子テレポーテーションと random swap は、同じ項目を再選択すると新しいランダム状態で生成されます。

## 回路エディタ

エディタは以下に対応しています。

- gate palette
- target qubit selector
- controlled/two-qubit gate の場合だけ表示される control qubit selector
- `rx`, `ry`, `rz` 用の degree 入力
- noise channel 用の probability 入力
- 選択 gate の末尾追加
- 既存 gate の削除
- timeline からの step 選択
- 現在 step が中央付近に来る自動横スクロール
- modal editor からの QASM import/export

表示される gate button は `H`, `X`, `Y`, `Z`, `S`, `S+`, `T`, `T+`, `RX`, `RY`, `RZ`, `CX`, `CZ`, `DEP`, `PHASE`, `DAMP`, measurement です。`S+` と `T+` は標準 OpenQASM の `sdg` と `tdg` として export されます。

parser と simulator は `id` と `swap` も対応しています。SWAP button は palette には表示せず、random-swap preset では 3つの `cx` に分解しています。

## Stream Deck

Stream Deck の各ボタンに通常の keyboard shortcut を送る設定をすれば、以下の操作を呼び出せます。

- previous step: `ArrowLeft`
- stereo mode の切り替え: `S`
- next step: `ArrowRight`
- reset execution: `R` または `Home`
- circuit editor panel の hide/show: `E`
- add selected gate: `+` または numpad `+`
- pointer 下の button / selector の実行: `Space`
- Bloch view の top view: `T`
- Bloch view の回転: `C` を押しながら mouse move
- Bloch view の restore: `V`
- Bloch view の zoom: `Z` を押しながら mouse を上下に移動
- Bloch view の bottom view: `B`

Stream Deck SDK との直接連携は今後の拡張です。

MK.2 用の key icon、keymap file、import 可能な Stream Deck profile は以下で生成できます。

```sh
npm run streamdeck:mk2
```

生成物は `streamdeck/mk2/` に出力されます。`Bloch Stereo MK2.streamDeckProfile` は Stream Deck app に直接 import できます。

## 可視化

それぞれの Bloch 球は、選択された量子ビットの縮約密度行列をプロットします。エンタングルした量子ビットは混合状態として表示され、Bloch ベクトルが短くなります。

選択した量子ビット対について、3x3 行列は接続相関を表示します。

```txt
C_ab = <sigma_a tensor sigma_b> - <sigma_a><sigma_b>
```

積状態では零行列になります。

## OpenQASM 対応範囲

対応している OpenQASM 範囲:

- 1つの quantum register
- 1つの classical register
- `id`, `x`, `y`, `z`, `h`, `s`, `sdg`, `t`, `tdg`
- `rx(theta)`, `ry(theta)`, `rz(theta)`
- アプリ独自の noise 拡張 `depolarize(p)`, `dephase(p)`, `ampdamp(p)`
- `cx`, `cz`, `swap`
- `measure q[i] -> c[j]`
- little-endian の classical register 全体の値に対する `if (c==n)`

シミュレータは教育・展示向けに、1から8量子ビット、200 gate 程度までの小規模回路を想定しています。

## 実行方法

必要環境:

- Node.js 20 以上
- npm
- WebGL 対応ブラウザ

依存関係をインストールします。

```sh
npm install
```

開発サーバを起動します。

```sh
npm run dev
```

Vite が表示する URL を開きます。通常は次の URL です。

```txt
http://localhost:5173/
```

テスト:

```sh
npm run test
```

ビルド:

```sh
npm run build
```

任意の canvas 検証:

```sh
npx playwright install chromium
node scripts/verify-canvas.mjs
```

## プロジェクト構成

```txt
src/
  circuit/
    editor/
    qasm2/
    simulator/
    types.ts
  presets/
  stereo/
  store/
  styles/
scripts/
  generate-streamdeck-mk2.mjs
  verify-canvas.mjs
streamdeck/
  mk2/
doc/
  spec.md
```

## 今後の拡張候補

- full density matrix UI
- OpenQASM 3
- Stream Deck hardware integration
- WebXR
- GPU acceleration
- tensor-network backend

## ライセンス

[MIT License](LICENSE)
