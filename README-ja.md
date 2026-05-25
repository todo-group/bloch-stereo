# Bloch Stereo Quantum Circuit Editor

[English](README.md) | [日本語](README-ja.md)

量子回路、Bloch 球、縮約密度行列、相関、エンタングルメントを、ブラウザ上で直感的に可視化するためのステレオ対応量子回路エディタです。

科学館・展示・教育デモ・対話的な量子情報の学習を主な用途として想定しています。

## 機能

- OpenQASM 2.0 の import/export
- 軽量な量子回路エディタ
- ステップ実行、前後移動、リセット、オートプレイ
- Bloch ベクトルの滑らかなアニメーション
- 単一量子ビットの縮約密度行列と純度の可視化
- 2量子ビット相関行列の可視化
- 量子テレポーテーションのプリセット
- 赤緑アナグリフ方式のステレオ表示
- トラックボール操作を意識した大きめの UI

## 画面イメージ

```txt
[ Circuit Editor ]     [ Stereo Bloch Visualization ]
q0 ──H────●────────
          │
q1 ───────X────M───
             ◉
         ↗
      Bloch Sphere
```

## 設計方針

このプロジェクトは、量子情報を数式だけでなく空間的・連続的に理解できるようにすることを目標にしています。

- 量子状態は滑らかに変化して見えること
- エンタングルメントが視覚的に追えること
- テレポーテーションをステップごとに理解できること
- 操作が展示環境でも壊れにくく、わかりやすいこと
- ステレオ表示が理解を助け、目に負担をかけすぎないこと

## 対応可視化

### 単一量子ビット表示

- ステレオ対応 Bloch 球
- アニメーションする Bloch ベクトル
- 純度表示
- 半透明グリッド、緯線、経線

### 2量子ビット表示

- 2つの Bloch 球
- 3x3 相関行列
- 縮約状態による混合状態の表示

### 量子テレポーテーション

内蔵プリセットには次の流れが含まれます。

- Bell ペア生成
- Bell 測定
- 測定による collapse
- 古典ビットによる条件付き補正
- 受信側量子ビットでの状態再構成

## 表示モード

### 通常 2D モード

- 明るい UI
- 色で区別しやすいゲート
- 見やすい Bloch ベクトル

### 赤緑ステレオモード

赤緑または赤シアンのアナグリフ眼鏡で立体視できます。

- 2D/ステレオをアプリ内で切り替え
- ステレオ時は彩度とコントラストを抑えめに調整
- Bloch 球の奥行きを強調

## 推奨ハードウェア

右手側のポインティングデバイスとして、Elecom HUGE PLUS などのトラックボールを想定しています。低いカーソル精度でも扱いやすいよう、大きめの操作対象を優先しています。

左手側のマクロデバイスとして、Elgato Stream Deck MK.2 を想定しています。初期版では UI 上のボタンとして、実行制御・リセット・ステレオ切り替え・テレポーテーション読み込みを操作できます。

## 技術スタック

- TypeScript
- React
- Vite
- Three.js / WebGL
- Zustand

## OpenQASM 対応範囲

現在は OpenQASM 2.0 の小規模な教育用回路を対象にしています。

対応している主な操作:

- `x`, `y`, `z`, `h`, `s`, `t`
- `rx`, `ry`, `rz`
- `cx`, `cz`, `swap`
- `measure`
- `if (c==n)` による条件付き実行

初期版の目安:

- 1-8 量子ビット
- 200 ゲート程度まで
- pure state の状態ベクトルシミュレーション

## インストールと実行

### 必要環境

- Node.js 20 以上
- npm
- WebGL が有効なブラウザ

環境確認:

```sh
node --version
npm --version
```

### macOS

Homebrew を使う場合:

```sh
brew install node
```

または Node.js 公式サイトから Node.js 20 以上をインストールしてください。

```txt
https://nodejs.org/
```

### Linux

Debian / Ubuntu で NodeSource を使う場合:

```sh
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Fedora の場合:

```sh
sudo dnf install nodejs npm
```

ディストリビューション標準の Node.js が古い場合は、`nvm` または Node.js 公式パッケージで Node.js 20 以上を入れてください。

### Windows

PowerShell で winget を使う場合:

```powershell
winget install OpenJS.NodeJS.LTS
```

または Node.js 公式サイトから Windows インストーラをダウンロードしてください。

```txt
https://nodejs.org/
```

インストール後、新しい PowerShell を開いて確認します。

```powershell
node --version
npm --version
```

## 使い方

リポジトリを取得します。

```sh
git clone https://github.com/yourname/bloch-stereo.git
cd bloch-stereo
```

依存関係をインストールします。

```sh
npm install
```

開発サーバを起動します。

```sh
npm run dev
```

Vite が表示する URL をブラウザで開きます。通常は次の URL です。

```txt
http://localhost:5173/
```

本番ビルド:

```sh
npm run build
```

本番ビルドのプレビュー:

```sh
npm run preview
```

テスト:

```sh
npm run test
```

任意の表示検証:

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
  stereo/
  presets/
  store/
  styles/
```

## OpenQASM 例

```qasm
OPENQASM 2.0;
include "qelib1.inc";
qreg q[3];
creg c[2];
h q[1];
cx q[1], q[2];
cx q[0], q[1];
h q[0];
measure q[0] -> c[0];
measure q[1] -> c[1];
if (c==1) z q[2];
if (c==2) x q[2];
if (c==3) z q[2];
if (c==3) x q[2];
```

## アニメーション

シミュレーション状態は離散的かつ正確に保持し、可視化側で Bloch ベクトルを滑らかに補間します。

- ステップ間の smoothstep 補間
- 前後ステップ移動
- オートプレイ
- 測定 collapse の滑らかな表示

## 性能目標

- 2D モードで 60 FPS
- ステレオモードで 45 FPS 以上
- 8 量子ビット、200 ゲート程度までの展示・教育用途

## 今後の拡張候補

- OpenQASM 3
- WebXR
- ノイズシミュレーション
- GPU アクセラレーション
- テンソルネットワーク backend
- 量子誤り訂正の可視化

## ライセンス

[MIT License](LICENSE)
