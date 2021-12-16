
const { merge } = require("webpack-merge");
const common = require("./webpack.config.js");
const path = require("path");

module.exports = merge(common(), {
    mode: "development",
    // webpack-dev-serverの設定
    devServer: {
        static: {
            directory: path.resolve(__dirname, "public"), // publicディレクトリのサーバーを開く
        },
        open: true, // ブラウザに表示するためtrueへ 
        port: "9000", // サーバーのポート番号
        historyApiFallback: true,// 存在しないパスをリクエストされた場合に、404を返さずにファイルを戻す
    },
    // devtool: "cheap-module-eval-source-map",　// ビルドの速度とデバックの品質を保つ
});