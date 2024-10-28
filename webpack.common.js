const path = require('path');

module.exports = {
	entry: {
		index: {
			import: './src/index.ts',
		},
	},
	output: {
		filename: 'static/js/[name].[contenthash].js',
		path: path.resolve(__dirname, 'dist'),
		clean: true,
	},
	resolve: {
		modules: [path.resolve('node_modules')],
		extensions: ['.tsx', '.ts', '.js'],
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.pug$/,
				loader: 'pug-loader',
				exclude: /(node_modules|bower_components)/,
			},

		],
	},
};
