import React from 'react';
import { themeSettings, text } from '../../lib/settings';
import * as helper from '../../lib/helper';

const FormattedCurrency = ({ number, settings }) =>
	helper.formatCurrency(number, settings);

const FormattedRangeCurrency = ({ min_price, max_price, settings }) =>
	`${helper.formatCurrency(min_price, settings)} - ${helper.formatCurrency(
		max_price,
		settings
	)}`;

const ItemPrice = ({ product, settings }) => {
	const priceStyle = {};
	if (themeSettings.list_price_size && themeSettings.list_price_size > 0) {
		priceStyle.fontSize = `${themeSettings.list_price_size}px`;
	}
	if (
		themeSettings.list_price_color &&
		themeSettings.list_price_color.length > 0
	) {
		priceStyle.color = themeSettings.list_price_color;
	}

	if (product.stock_status === 'discontinued') {
		return <div className="product-price">{text.discontinued}</div>;
	}
	if (product.stock_status === 'out_of_stock') {
		return <div className="product-price">{text.outOfStock}</div>;
	}

	if (product.price_range) {
		if (product.on_sale) {
			return (
				<div className="product-price">
					<span className="product-new-price">
						<FormattedRangeCurrency
							settings={settings}
							min_price={product.min_price}
							max_price={product.max_price}
						/>
					</span>
					<div class="row">
						<del className="product-old-price-range">
							<FormattedRangeCurrency
								settings={settings}
								min_price={product.regular_min_price}
								max_price={product.regular_max_price}
							/>
						</del>
					</div>
				</div>
			);
		}
		return (
			<div className="product-price" style={priceStyle}>
				<FormattedRangeCurrency
					settings={settings}
					min_price={product.min_price}
					max_price={product.max_price}
				/>
			</div>
		);
	}

	if (product.on_sale) {
		return (
			<div className="product-price">
				<span className="product-new-price">
					<FormattedCurrency settings={settings} number={product.price} />
				</span>
				<del className="product-old-price">
					<FormattedCurrency
						settings={settings}
						number={product.regular_price}
					/>
				</del>
			</div>
		);
	}
	return (
		<div className="product-price" style={priceStyle}>
			<FormattedCurrency settings={settings} number={product.price} />
		</div>
	);
};

export default ItemPrice;
