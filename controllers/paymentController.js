// eslint-disable-next-line import/no-extraneous-dependencies
const paypal = require("paypal-rest-sdk");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.createPaymentIntent = catchAsync(async (req, res) => {
  const { cart } = req.body;

  const items = cart.map((item) => ({
    name: item.name,
    sku: item._id,
    price: item.price,
    currency: "USD",
    quantity: 1,
  }));

  const total = items.reduce((acc, item) => acc + item.price, 0);

  const createPaymentJson = {
    intent: "sale",
    payer: {
      payment_method: "paypal",
    },
    redirect_urls: {
      return_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
    },
    transactions: [
      {
        item_list: {
          items: items,
        },
        amount: {
          currency: "USD",
          total: total,
        },
        description: "This is the payment description.",
      },
    ],
  };

  paypal.payment.create(createPaymentJson, (error, payment) => {
    if (error) {
      AppError(error.response);
    } else {
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < payment.links.length; i++) {
        if (payment.links[i].rel === "approval_url") {
          res.redirect(payment.links[i].href);
        }
      }
    }
  });
});

exports.executePayment = (req, res) => {
  const { paymentId } = req.query;
  const payerId = { payer_id: req.query.PayerID };

  paypal.payment.execute(paymentId, payerId, (error, payment) => {
    if (error) {
      AppError(error.response);
    } else {
      console.log(JSON.stringify(payment));
      res.send("Success");
    }
  });
};

exports.cancelPayment = catchAsync(async (req, res) => res.send("Cancelled"));
