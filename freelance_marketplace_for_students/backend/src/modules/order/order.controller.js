const orderService = require("./order.service");
const attachmentService = require("../attachment/attachment.service");
const { asyncHandler } = require("../../common/middleware");

function orderToJsonWithAttachmentUrls(order) {
  const plain = order.get ? order.get({ plain: true }) : { ...order };
  plain.attachments = attachmentService.mapAttachmentsWithUrl(plain.attachments || []);
  return plain;
}

exports.createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.user.id, req.body);
  res.status(201).send(orderToJsonWithAttachmentUrls(order));
});

exports.getOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.listOrders(req.query);
  res.status(200).send(orders.map(orderToJsonWithAttachmentUrls));
});

exports.getMyOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.listMyOrders(req.user.id);
  res.status(200).send(orders.map(orderToJsonWithAttachmentUrls));
});

exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id);
  res.status(200).send(orderToJsonWithAttachmentUrls(order));
});

exports.updateOrder = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrder(req.user.id, req.params.id, req.body);
  res.status(200).send(orderToJsonWithAttachmentUrls(order));
});

exports.deleteOrder = asyncHandler(async (req, res) => {
  await orderService.deleteOrder(req.user.id, req.params.id);
  res.status(200).send({ message: "Заказ удален" });
});

exports.getOrderStats = asyncHandler(async (req, res) => {
  const stats = await orderService.getOrderStats(req.user.id, req.params.id);
  res.status(200).send(stats);
});
