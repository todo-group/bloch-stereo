<p align="center">
  <img src="doc/bloch-stereo-logo.svg" alt="Bloch Stereo logo" width="96" height="96">
</p>

# Bloch Stereo

[English](README.md) | [日本語](README-ja.md)

[![CI](https://img.shields.io/github/actions/workflow/status/todo-group/bloch-stereo/ci.yml?branch=main&label=CI)](https://github.com/todo-group/bloch-stereo/actions/workflows/ci.yml)
![Author](https://img.shields.io/badge/author-Synge%20Todo-0A7E8C)
[![npm >=10.9](https://img.shields.io/badge/npm-%3E%3D10.9-CB3837?logo=npm&logoColor=white)](https://www.npmjs.com/)
[![three.js](https://img.shields.io/npm/v/three?label=three.js&logo=threedotjs&logoColor=white)](https://www.npmjs.com/package/three)
[![React](https://img.shields.io/npm/v/react?label=react&logo=react)](https://www.npmjs.com/package/react)
[![Vite](https://img.shields.io/npm/v/vite?label=vite&logo=vite)](https://www.npmjs.com/package/vite)

Bloch Stereoは、教育・デモ・科学館展示向けの、ブラウザで動作する量子回路エディタ兼ステレオ・ブロッホ球ビジュアライザです。

小規模な量子回路について、量子状態の変化、1量子ビット縮約状態、純粋度、相関、測定による収縮、量子テレポーテーションを視覚的に追うことができます。

## 機能

- **Bloch View**と**Circuit Editor**を分離した2つの操作モード
- VRが利用可能な場合は没入型VR、それ以外では赤シアン・アナグリフ表示へ進むスタートアップスクリーン
- 通常の2D、赤シアン・アナグリフ立体視、WebXRによる没入型VR表示
- 回路の量子ビット数に応じて自動的に表示される1〜3個のブロッホ球
- 各量子ビットのpurityと、2・3量子ビット回路の接続相関行列
- Prev、Auto/Pause、Next、Reset、Loopによるステップ実行
- Top、View、Bottomによる視点変更、ポインタのドラッグによる回転、ズーム
- 正確な実行ステップ間をつなぐ滑らかなブロッホベクトル・アニメーション
- 現在のゲートをオレンジ色で示し、長い回路では自動スクロールする量子回路表示
- 1量子ビットゲート、制御ゲート、ノイズチャネル、測定を扱う2D Circuit Editor
- OpenQASMのimport/exportと、再利用可能なユーザー定義プリセット
- 状態の収縮と古典レジスタを反映するランダム測定
- Meta QuestのVR空間に表示される操作ボタン、量子回路、purity、相関行列と相関ペア選択
- 左右どちらのTouch Plusコントローラでも使える、トリガードラッグによる回転とスティックによるズーム

## 実行方法

ブラウザで [https://todo-group.github.io/bloch-stereo/](https://todo-group.github.io/bloch-stereo/) にアクセスします。インストールは不要です。

1. スタートアップスクリーンで**Enter**を選択します。
2. 対応するVRヘッドセットでは没入型VRに入り、それ以外では赤シアン・アナグリフ表示で起動します。
3. **VR/Stereo**と**2D**で表示方法を切り替え、回路を編集する場合は**Circuit Editor**を選択します。

アナグリフの立体視には赤シアンメガネが必要です。メガネを使用しない場合は**2D**を選択してください。

### 実機確認済み環境

| 環境 | 確認した機能 |
| --- | --- |
| macOS上のGoogle Chrome | スタートアップ、2D表示、赤シアン・アナグリフ表示、Circuit Editor |
| Meta Quest 3S上のMeta Quest Browser | スタートアップ、WebXR没入表示、Touch Plusコントローラ操作 |

### 動作が期待される未検証環境

以下は動作が期待されますが、本プロジェクトでは実機確認していません。

| 用途 | 動作が期待される環境 |
| --- | --- |
| 2D・アナグリフ表示 | macOS上の最新版Chrome、Firefox、Safari、Windows上の最新版Chrome、Edge、Firefox、Linux上の最新版ChromeまたはFirefox、Android上の最新版Chrome |
| スタンドアロンVR | Meta Quest Browserを使用するMeta Quest 2、Meta Quest 3、Meta Quest Pro、WebXR `immersive-vr`対応ブラウザを使用するPICO 4シリーズ |
| PC接続VR | Meta Quest Link、HTC Vive、Valve IndexなどのOpenXRヘッドセットをWebXRへ公開できる環境上のChromeまたはEdge |

2D・アナグリフ表示にはWebGLが必要です。没入型VRでは、さらにHTTPS配信と、WebXRの`immersive-vr`を利用できるブラウザ・機器の組み合わせが必要です。ブラウザやヘッドセットの更新によって利用可否が変わる場合があります。

## プリセット

Circuit Editorには以下のプリセットがあります。

- 初期状態 `|0>`、`|00>`、`|000>`
- Bell状態
- 積混合状態 `I/2 x I/2`
- GHZ状態
- H-CZ測定回路
- ランダムな2量子ビット状態に続いてSWAPを行う回路
- ランダム入力状態を用いる量子テレポーテーション
- **SAVE**で保存したユーザー定義プリセット

Bell、`I/2 x I/2`、GHZでは、回路の最後に全量子ビットの測定を行います。Random SwapとQuantum Teleportationでは、プリセット選択時とLoopの各周回開始時に新しいランダム入力状態を生成します。

## Bloch View

Bloch Viewは量子回路の実行可視化に専念する画面です。

- 1量子ビット回路では`q0`、2量子ビット回路では`q0`と`q1`、3量子ビット回路では`q0`、`q1`、`q2`を表示します。
- 2・3量子ビット回路では接続相関行列を表示します。3量子ビットでは`q0/q1`、`q0/q2`、`q1/q2`を選択できます。
- 各ブロッホ球に量子ビット名とpurityを表示します。
- 短い回路は全体を表示し、長い回路は現在のゲートが見えるように自動スクロールします。
- 没入型VRでは、操作ボタンや回路情報を固定された空間パネルとして表示し、ブロッホ球の回転には追随させません。

## Circuit Editor

Circuit Editorは、次の機能を備えた平面的な2D編集画面です。

- 1量子ビットゲート：`H`、`X`、`Y`、`Z`、`S`、`S+`、`T`、`T+`、`RX`、`RY`、`RZ`
- 2量子ビットゲート：`CX`、`CZ`
- Depolarizing、Dephasing、Amplitude dampingの各ノイズチャネル
- 測定、target/control選択、ゲート追加、ゲート削除
- 回転角とノイズ確率の入力
- OpenQASMのimport/export
- Eye、Focus、および必要な場合のRed、Cyan設定
- 現在の回路をプリセットへ追加する**SAVE**

## ライセンス

[MIT License](LICENSE)
