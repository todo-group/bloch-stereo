# GitHub Pages 本番配信手順

## 概要

Bloch Stereo の本番環境は GitHub Pages を使用する。

- リポジトリ: `todo-group/bloch-stereo`
- 公開方式: GitHub Actions
- デプロイワークフロー: `.github/workflows/cd.yml`
- 通常の公開 URL: `https://todo-group.github.io/bloch-stereo/`
- ビルド成果物: `dist/`

実際の公開 URL は、GitHub Actions の `deploy-github-pages` ジョブに表示される
Deployment URL を正とする。カスタムドメインを設定した場合は、その URL が使用される。

`main` ブランチへの push では CI のみが実行され、本番環境には自動反映されない。
本番デプロイは次のいずれかで開始する。

- `v` で始まるタグを push する（通常のリリース）
- GitHub Actions の画面から `CD` ワークフローを手動実行する

## 初回のみ必要な設定

設定には、リポジトリの管理権限が必要である。

### 1. GitHub Pages の公開元を設定する

1. GitHub で `todo-group/bloch-stereo` リポジトリを開く。
2. **Settings** → **Pages** を開く。
3. **Build and deployment** の **Source** で **GitHub Actions** を選択する。

**Deploy from a branch** は選択しない。`dist/` をブランチへコミットする必要はない。

### 2. `github-pages` Environment を確認する

1. **Settings** → **Environments** → **github-pages** を開く。
2. Deployment branches and tags に制限を設定している場合は、少なくとも次を許可する。
   - 通常リリース: タグ `v*`
   - 手動デプロイ: 実行元として使用するブランチ（通常は `main`）
3. 承認者を設定している場合は、デプロイ時に承認操作が必要になることを運用担当者へ共有する。

タグとブランチの保護ルールは別々に判定される。`main` のみを許可すると、`v*` タグからの
デプロイが待機または拒否される場合がある。

### 3. Actions の実行を許可する

**Settings** → **Actions** → **General** で GitHub Actions が有効であることを確認する。
組織ポリシーで Actions や Pages が制限されている場合は、組織管理者へ許可を依頼する。

## 通常の本番リリース

リリース対象の変更を `main` にマージし、ローカルで確認してからリリースタグを作成する。
以下の `v1.0.2` は例なので、実際には未使用のバージョン番号へ置き換える。

```bash
git switch main
git pull --ff-only
npm ci
npm run typecheck
npm test
npm run build
git tag -a v1.0.2 -m "Release v1.0.2"
git push origin v1.0.2
```

`package.json` の `version` も公開バージョンとして画面に表示されるため、タグを作成する前に
同じバージョンへ更新してコミットしておく。

タグを push すると `.github/workflows/cd.yml` が次の処理を行う。

1. ソースコードを checkout する。
2. GitHub Pages の公開パスを取得する。
3. Node.js 24 で `npm ci` を実行する。
4. 取得した公開パスを `BASE_PATH` に設定して `npm run build` を実行する。
5. `dist/` を Pages artifact としてアップロードする。
6. `github-pages` Environment へデプロイする。

プロジェクトサイトでは通常 `/bloch-stereo/` が `BASE_PATH` になる。ワークフローが
GitHub Pages の設定から値を取得するため、CD 用にパスをハードコードする必要はない。

## 手動デプロイ

タグを追加せず、指定ブランチの内容をデプロイする場合に使用する。

1. GitHub で **Actions** を開く。
2. 左側の一覧から **CD** を選ぶ。
3. **Run workflow** を押す。
4. デプロイ対象のブランチ（通常は `main`）を選ぶ。
5. **Run workflow** を押して実行する。

GitHub CLI を利用する場合は、次のコマンドでも実行できる。

```bash
gh workflow run cd.yml --ref main
```

手動実行には書き込み権限が必要であり、`workflow_dispatch` を含むワークフローファイルが
デフォルトブランチに存在している必要がある。

## デプロイ結果の確認

1. **Actions** → **CD** で対象の実行を開く。
2. `build` と `deploy-github-pages` の両方が成功していることを確認する。
3. `deploy-github-pages` に表示される Deployment URL を開く。
4. 次を確認する。
   - スタートアップスクリーンが表示される。
   - JavaScript、CSS、画像に 404 エラーがない。
   - **Enter** 後に Bloch View が表示される。
   - Circuit Editor との切り替えができる。
   - 2D／立体視の切り替えと、主要な実行ボタンが動作する。

GitHub Pages への反映には数分かかる場合がある。成功直後に古い画面が表示される場合は、
少し待ってからキャッシュを無視して再読み込みする。

WebXR はセキュアコンテキストを必要とするため、GitHub Pages の HTTPS URL で実機確認する。

## ロールバック

問題のあるリリースタグを移動・上書きせず、修正または revert を `main` にコミットし、
新しいバージョンタグを作成して再デプロイする。この方法なら、公開履歴とソースコードの
対応関係を維持できる。

緊急時に過去の Actions 実行を再実行する場合も、復旧後に新しいタグで正式な状態を公開する。

## トラブルシューティング

### `main` に push しても本番が更新されない

現在の `CD` ワークフローは `v*` タグの push または手動実行でのみ開始する。通常リリースの
手順に従ってタグを作成するか、手動デプロイを実行する。

### CSS、JavaScript、画像が 404 になる

Actions の `Configure Pages` ステップと `Build` ステップを確認する。`Build` では
`steps.pages.outputs.base_path` が `BASE_PATH` に渡されている必要がある。

ローカルでサブパス用ビルドを確認する方法は `doc/spec.md` の
「Deployment Base Path」を参照する。

### デプロイが待機または拒否される

`github-pages` Environment の承認待ちと Deployment branches and tags を確認する。
タグリリースでは `v*` タグが許可されている必要がある。

### 手動実行のボタンが表示されない

`.github/workflows/cd.yml` がデフォルトブランチに存在し、`workflow_dispatch` が定義されている
ことを確認する。また、操作ユーザーにリポジトリへの書き込み権限があることを確認する。

### デプロイジョブで権限エラーになる

`deploy-github-pages` ジョブに次の権限が設定されていることを確認する。

```yaml
permissions:
  pages: write
  id-token: write
```

## カスタムドメインを使用する場合

必要に応じて **Settings** → **Pages** の **Custom domain** から設定し、案内された DNS
レコードを登録する。DNS の確認後は **Enforce HTTPS** を有効にする。

カスタムドメインを設定した場合も、現在のワークフローは `Configure Pages` が返す公開パスを
使用するため、原則として `vite.config.ts` や `BASE_PATH` の固定値を変更する必要はない。

## セキュリティ上の注意

GitHub Pages で配信するファイルはクライアントから参照できる。API キー、トークン、秘密鍵などを
ソースコード、`public/`、Vite の環境変数へ含めない。Vite のクライアント向け環境変数も
ビルド成果物へ埋め込まれるため、秘密情報には使用しない。

## 参考資料

- [GitHub Pages の公開元を設定する](https://docs.github.com/ja/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [GitHub Pages でカスタムワークフローを使用する](https://docs.github.com/ja/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [ワークフローを手動で実行する](https://docs.github.com/ja/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)
- [デプロイ用 Environment](https://docs.github.com/ja/actions/reference/workflows-and-actions/deployments-and-environments)
- [GitHub Pages のカスタムドメインを管理する](https://docs.github.com/ja/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
