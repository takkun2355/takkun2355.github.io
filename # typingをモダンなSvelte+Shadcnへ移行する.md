# typingをモダンなSvelte+Shadcnへ移行する

Goal:
既存の HTML / CSS / JavaScript で実装されたタイピングゲームを、SvelteKit + TypeScript + Shadcn へ移植する。

Requirements:

* 基本的にShadcnのUIコンポーネントを使用する

Migration Strategy:

1. HTMLをSvelteコンポーネントへ変換
2. CSSをShadcnのスタイルへ変換
3. DOM操作をSvelteのリアクティブ機能へ変換
4. EventListenerをSvelteイベントへ変換
5. 状態をローカルstateへ変換
6. リファクタリング
7. 動作確認可能な状態にする

Do NOT:

* ディレクトリ構造を大幅変更しない
* 独自アーキテクチャを導入しない
* 状態管理ライブラリを追加しない
* UIコンポーネントライブラリを導入しない
* 最適化を行わない

Output Format:

* 変更後のファイル一覧
* 変更理由
* 移植時の注意点

変更先は、my-app/以下とします。すでにSvelteKitプロジェクトがセットアップされている前提で進めます。ShadcnのUIコンポーネントもすでにインストールされています。使用するコンポーネントが不足している場合は、以下のコマンドで追加してください。

```bash
cd my-app
pnpm dlx shadcn-svelte@latest add button
```
