const { Op } = require("sequelize");
const db = require("../../models");
const Order = db.order;
const Service = db.service;
const User = db.user;
const Category = db.category;
const Application = db.application;
const Profile = db.profile;
const Role = db.role;
const Rating = db.rating;

async function getPlatformStats() {
  const totalUsers = await User.count();
  const totalOrders = await Order.count();
  const totalServices = await Service.count();
  const totalCategories = await Category.count();
  const totalApplications = await Application.count();

  const activeOrders = await Order.count({
    where: { status: "open" },
  });

  const completedOrders = await Order.count({
    where: { status: "completed" },
  });

  return {
    totalUsers,
    totalOrders,
    totalServices,
    totalCategories,
    totalApplications,
    activeOrders,
    completedOrders,
  };
}

async function categoryOrderAndServiceCounts(category) {
  const orderCount = await Order.count({
    where: { categoryId: category.id },
  });
  const serviceCount = await Service.count({
    where: { categoryId: category.id },
  });
  return { orderCount, serviceCount };
}

async function getPopularCategories(query) {
  const { limit = 6 } = query;
  const categories = await Category.findAll({
    attributes: ["id", "name", "description"],
  });

  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => {
      const { orderCount, serviceCount } = await categoryOrderAndServiceCounts(category);
      return {
        id: category.id,
        name: category.name,
        description: category.description,
        orderCount,
        serviceCount,
      };
    })
  );

  return categoriesWithCounts
    .sort((a, b) => b.orderCount + b.serviceCount - (a.orderCount + a.serviceCount))
    .slice(0, parseInt(limit, 10));
}

function weekAgoDate() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
}

async function freelancerRowStats(user, weekAgo) {
  const completedOrdersThisWeek = await Application.count({
    where: {
      userId: user.id,
      status: "approved",
      orderId: { [Op.ne]: null },
    },
    include: [
      {
        model: Order,
        as: "order",
        where: {
          status: "completed",
          updatedAt: { [Op.gte]: weekAgo },
        },
        required: true,
      },
    ],
  });

  const ratings = await Rating.findAll({
    where: { toUserId: user.id },
  });
  const avgRating =
    ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;

  const profile = user.profile || {};
  const fullName = [profile.name, profile.lastname].filter(Boolean).join(" ").trim();

  return {
    id: user.id,
    username: user.username,
    fullName: fullName || user.username,
    avatar: profile.avatar || null,
    rating: avgRating,
    completedOrdersThisWeek,
    totalCompleted: profile.completedProjects || 0,
    responseTime: profile.responseTimeHours || 0,
  };
}

async function getBestFreelancers(query) {
  const { limit = 6 } = query;
  const weekAgo = weekAgoDate();

  const executerRole = await Role.findOne({ where: { name: "executer" } });
  if (!executerRole) {
    return [];
  }

  const executers = await User.findAll({
    include: [
      {
        model: Role,
        as: "roles",
        where: { id: executerRole.id },
        through: { attributes: [] },
      },
      {
        model: Profile,
        as: "profile",
        required: false,
      },
    ],
    where: {
      isBlocked: false,
    },
  });

  const freelancersWithStats = await Promise.all(
    executers.map((user) => freelancerRowStats(user, weekAgo))
  );

  return freelancersWithStats
    .sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      return b.completedOrdersThisWeek - a.completedOrdersThisWeek;
    })
    .slice(0, parseInt(limit, 10));
}

async function customerRowStats(user, weekAgo) {
  const ordersThisWeek = await Order.count({
    where: {
      customerId: user.id,
      createdAt: { [Op.gte]: weekAgo },
    },
  });

  const ratings = await Rating.findAll({
    where: { toUserId: user.id },
  });
  const avgRating =
    ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;

  const profile = user.profile || {};
  const fullName = [profile.name, profile.lastname].filter(Boolean).join(" ").trim();

  return {
    id: user.id,
    username: user.username,
    fullName: fullName || user.username,
    avatar: profile.avatar || null,
    rating: avgRating,
    ordersThisWeek,
    totalOrders: await Order.count({ where: { customerId: user.id } }),
  };
}

async function getBestCustomers(query) {
  const { limit = 6 } = query;
  const weekAgo = weekAgoDate();

  const customerRole = await Role.findOne({ where: { name: "customer" } });
  if (!customerRole) {
    return [];
  }

  const customers = await User.findAll({
    include: [
      {
        model: Role,
        as: "roles",
        where: { id: customerRole.id },
        through: { attributes: [] },
      },
      {
        model: Profile,
        as: "profile",
        required: false,
      },
    ],
    where: {
      isBlocked: false,
    },
  });

  const customersWithStats = await Promise.all(
    customers.map((user) => customerRowStats(user, weekAgo))
  );

  return customersWithStats
    .sort((a, b) => {
      if (b.ordersThisWeek !== a.ordersThisWeek) {
        return b.ordersThisWeek - a.ordersThisWeek;
      }
      return b.rating - a.rating;
    })
    .slice(0, parseInt(limit, 10));
}

async function getNewCategories(query) {
  const { limit = 6 } = query;
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  return Category.findAll({
    where: {
      createdAt: { [Op.gte]: monthAgo },
    },
    order: [["createdAt", "DESC"]],
    limit: parseInt(limit, 10),
    attributes: ["id", "name", "description", "createdAt"],
  });
}

function executerDisplayName(executer) {
  const executerProfile = executer.profile;
  return executerProfile
    ? [executerProfile.name, executerProfile.lastname].filter(Boolean).join(" ").trim() ||
        executer.username
    : executer.username;
}

function mapOrderToActivity(order, type, messageTemplate) {
  const executer = order.applications[0]?.user;
  if (!executer) return null;
  const executerProfile = executer.profile;
  const executerName = executerDisplayName(executer);

  return {
    type,
    message: messageTemplate(executerName, order.title),
    userId: executer.id,
    username: executer.username,
    userAvatar: executerProfile?.avatar || null,
    orderId: order.id,
    orderTitle: order.title,
    timestamp: order.updatedAt,
  };
}

const orderIncludeForActivity = [
  {
    model: User,
    as: "customer",
    attributes: ["id", "username"],
    include: [
      {
        model: Profile,
        as: "profile",
        attributes: ["name", "lastname", "avatar"],
        required: false,
      },
    ],
  },
  {
    model: Application,
    as: "applications",
    where: { status: "approved" },
    required: true,
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "username"],
        include: [
          {
            model: Profile,
            as: "profile",
            attributes: ["name", "lastname", "avatar"],
            required: false,
          },
        ],
      },
    ],
  },
];

async function fetchOrdersInProgressForFeed(limit) {
  return Order.findAll({
    where: {
      status: "in_progress",
      updatedAt: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    include: orderIncludeForActivity,
    order: [["updatedAt", "DESC"]],
    limit: parseInt(limit, 10),
  });
}

async function fetchCompletedOrdersForFeed(limit) {
  return Order.findAll({
    where: {
      status: "completed",
      updatedAt: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    include: orderIncludeForActivity,
    order: [["updatedAt", "DESC"]],
    limit: parseInt(limit, 10),
  });
}

async function getActivityFeed(query) {
  const { limit = 20 } = query;
  const activities = [];

  const ordersInProgress = await fetchOrdersInProgressForFeed(limit);
  ordersInProgress.forEach((order) => {
    const item = mapOrderToActivity(
      order,
      "order_taken",
      (name, title) => `${name} взял заказ "${title}"`
    );
    if (item) activities.push(item);
  });

  const completedOrders = await fetchCompletedOrdersForFeed(limit);
  completedOrders.forEach((order) => {
    const item = mapOrderToActivity(
      order,
      "order_completed",
      (name, title) => `${name} завершил заказ "${title}"`
    );
    if (item) activities.push(item);
  });

  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return activities.slice(0, parseInt(limit, 10));
}

async function countForDay(type, dayStart, dayEnd) {
  switch (type) {
    case "orders":
      return Order.count({
        where: {
          createdAt: { [Op.between]: [dayStart, dayEnd] },
        },
      });
    case "services":
      return Service.count({
        where: {
          createdAt: { [Op.between]: [dayStart, dayEnd] },
        },
      });
    case "completed":
      return Order.count({
        where: {
          status: "completed",
          updatedAt: { [Op.between]: [dayStart, dayEnd] },
        },
      });
    case "registrations":
      return User.count({
        where: {
          createdAt: { [Op.between]: [dayStart, dayEnd] },
        },
      });
    default:
      return 0;
  }
}

async function getMonthlyStats(query) {
  const { year, month, type } = query;

  const daysInMonth = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
  const stats = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStart = new Date(parseInt(year, 10), parseInt(month, 10) - 1, day, 0, 0, 0);
    const dayEnd = new Date(parseInt(year, 10), parseInt(month, 10) - 1, day, 23, 59, 59);

    const count = await countForDay(type, dayStart, dayEnd);

    stats.push({
      date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      day,
      count,
    });
  }

  return stats;
}

module.exports = {
  getPlatformStats,
  getPopularCategories,
  getBestFreelancers,
  getBestCustomers,
  getNewCategories,
  getActivityFeed,
  getMonthlyStats,
};
