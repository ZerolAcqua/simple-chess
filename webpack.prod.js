const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const autoprefixer = require('autoprefixer');
const path = require('path');

module.exports = merge(common, {
	mode: 'production',
	output: {
		filename: 'static/js/[contenthash].js',
		path: path.resolve(__dirname, 'dist'),
		clean: true,
	},
	module: {
		rules: [
			{
				test: /\.(css|scss)$/i,
				use: [
					MiniCssExtractPlugin.loader,
					'css-loader',
					{
						// Loader for webpack to process CSS with PostCSS
						loader: 'postcss-loader',
						options: {
							postcssOptions: {
								plugins: [
									autoprefixer
								]
							}
						}
					},
					{
						// Loads a SASS/SCSS file and compiles it to CSS
						loader: 'sass-loader'
					},
				],
			},
		],
	},
	plugins: [
		new MiniCssExtractPlugin({
			filename: 'static/css/[contenthash].css',
		}),
		new CssMinimizerPlugin(),
		// 创建实例 (第二步)
		new HtmlWebpackPlugin({
			// 指定Pug模板
			template: './src/index.pug',
			filename: 'index.html',
			minify: true,	// 启用压缩
		}),
	],
	optimization: {
		runtimeChunk: 'single',
		splitChunks: {
			chunks: 'all',
		},
		minimizer: [
			new TerserPlugin({
				parallel: true,//使用多进程并发运行以提高构建速度 Boolean|Number 默认值： true
				terserOptions: {
					compress: {
						drop_console: true,//移除所有console相关代码；
						drop_debugger: true,//移除自动断点功能；
						pure_funcs: ["console.log", "console.error"],//配置移除指定的指令，如console.log,alert等
					},
					format: {
						comments: false,//删除注释
					},
				},
				extractComments: false,//是否将注释剥离到单独的文件中
			})
		]
	},
});
