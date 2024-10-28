const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const autoprefixer = require('autoprefixer');

module.exports = merge(common, {
	mode: 'development',
	devtool: 'inline-source-map',
	devServer: {
		static: path.resolve(__dirname, 'dist'),
		port: 8080,
		hot: true,
	},
	module: {
		rules: [
			{
				test: /\.(css|scss)$/i,
				use: [
					'style-loader',
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
		// 使用 style-loader 代替 MiniCssExtractPlugin.loader
		new HtmlWebpackPlugin({
			// 指定Pug模板
			template: './src/index.pug',
			filename: 'index.html',
			minify: false, // 禁用压缩
		}),
	],
});
