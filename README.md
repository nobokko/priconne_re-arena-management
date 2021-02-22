# priconne_re-arena-management

プリンセスコネクト！Re:Diveのアリーナ／プリーナ編成の記録管理

dockerの`node:12.18-alpine`イメージを使用しています。

dockerイメージへ当リポジトリをチェックアウトしたフォルダをマウントする方法は（略）

以下基本的に[vscode](https://code.visualstudio.com/)の[Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)エクステンション経由で作業を行っています。

`npm install`

を実行することで[package.json](package.json)のdependenciesを拾ってダウンロードしてくれます。
以下のコマンドが実行可能になります。

`npm run prepare`
or
`npm run watch`

dist配下に*トランスパイル*されたファイル等が生成されます。

*main.js*は*m_heroine.json*という名前のファイルを*main.js*と同じフォルダから読み込みます。
