# ADBを使ってMacからMeta Quest 3Sのスナップショットを撮る方法

Meta Quest 3SをUSB-CでMacに接続し、ADB（Android Debug Bridge）を使って、Questに表示されている画面のスクリーンショットをMac上にPNGファイルとして保存できる。

## 1. ADBのインストール

Homebrewを使ってAndroid Platform Toolsをインストールする。

```bash
brew install android-platform-tools
```

インストールを確認する。

```bash
adb version
```

## 2. Quest 3Sの開発者モードを有効にする

Quest 3SでADBを利用するには、開発者モードを有効にしておく必要がある。

1. Meta Questの開発者登録を行う
2. Quest 3Sの「開発者モード」を有効にする
3. Quest 3SとMacをUSB-Cケーブルで接続する

## 3. USBデバッグを許可する

Macのターミナルで次を実行する。

```bash
adb devices
```

Quest 3S内に「USBデバッグを許可しますか？」という確認画面が表示されたら、許可する。

頻繁に利用する場合は「このコンピューターから常に許可」も有効にしておくと便利である。

もう一度、

```bash
adb devices
```

を実行して、

```text
List of devices attached
XXXXXXXXXXXX    device
```

のように表示されれば接続完了である。

`unauthorized` と表示される場合は、Quest 3S内のUSBデバッグ許可画面を確認する。

## 4. スナップショットを撮影する

Macの現在のディレクトリに `quest.png` として保存するには、

```bash
adb exec-out screencap -p > quest.png
```

を実行する。

Quest 3Sに現在表示されている画面がPNGファイルとして保存される。

## 5. Macのデスクトップに保存する

```bash
adb exec-out screencap -p > ~/Desktop/quest.png
```

これで `quest.png` がMacのデスクトップに作成される。

## 6. ファイル名に日時を付ける

複数のスナップショットを撮る場合は、日時をファイル名に付けておくと便利である。

```bash
adb exec-out screencap -p > "quest-$(date +%Y%m%d-%H%M%S).png"
```

例えば、

```text
quest-20260823-114530.png
```

のようなファイルが作成される。

デスクトップに日時付きで保存する場合は、

```bash
adb exec-out screencap -p > ~/Desktop/"quest-$(date +%Y%m%d-%H%M%S).png"
```

とする。

## 7. Quest内部に保存してからMacに転送する方法

まずQuest 3S内に保存する。

```bash
adb shell screencap -p /sdcard/quest.png
```

その後、Macに転送する。

```bash
adb pull /sdcard/quest.png
```

通常は、Macへ直接保存できる

```bash
adb exec-out screencap -p > quest.png
```

の方が簡単である。

## トラブルシューティング

### Quest 3Sが認識されない

```bash
adb devices
```

で何も表示されない場合は、以下を確認する。

* Quest 3Sの開発者モードが有効になっているか
* USB-Cケーブルがデータ通信に対応しているか
* Quest 3S内でUSBデバッグを許可したか

ADBサーバーを再起動する方法もある。

```bash
adb kill-server
adb start-server
adb devices
```

### `unauthorized` と表示される

```text
XXXXXXXXXXXX    unauthorized
```

と表示される場合は、Quest 3Sを装着してUSBデバッグの許可画面を確認する。

## 最小手順

一度ADBの設定が完了していれば、通常はQuest 3SをMacに接続して、

```bash
adb devices
adb exec-out screencap -p > ~/Desktop/quest.png
```

だけでスナップショットを取得できる。

## 注意

ADBの `screencap` で取得される画像は、Quest 3SのAndroidシステムが出力する画面キャプチャである。そのため、VRヘッドセットを装着したユーザーが両眼で見ている映像と、解像度・画角・レイアウトなどが完全に一致するとは限らない。

WebXRコンテンツの記録や展示資料用の画像を作成する場合には、ADBによる `screencap` のほか、Questのキャスト機能や `scrcpy` などを利用する方法もある。
