const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));

app.use(express.json());

// Data persistence
const DATA_FILE = path.join(__dirname, 'demo-data.json');

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      return data;
    }
  } catch (error) {
    console.log('Error loading data, using defaults:', error.message);
  }
  return null;
}

function saveData() {
  try {
    const data = {
      equipment,
      rentals,
      expenses
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('Error saving data:', error.message);
  }
}

// Load existing data or use defaults
const savedData = loadData();

// Default mock data
const defaultEquipment = [
  { id: 1, name: 'GoPro 13', quantity: 6, description: 'Экшн-камера GoPro Hero 13', base_price: 1500 },
  { id: 2, name: 'DJI Osmo Pocket 3', quantity: 2, description: 'Карманная 4К камера с стабилизатором', base_price: 2000 },
  { id: 3, name: 'Karcher SC4', quantity: 5, description: 'Пароочиститель Karcher SC4', base_price: 800 },
  { id: 4, name: 'Karcher Puzzi 8/1', quantity: 8, description: 'Моющий пылесос Karcher Puzzi 8/1', base_price: 1000 },
  { id: 5, name: 'Karcher Puzzi 10/1', quantity: 1, description: 'Моющий пылесос Karcher Puzzi 10/1', base_price: 1200 },
  { id: 6, name: 'Karcher WD5', quantity: 1, description: 'Хозяйственный пылесос Karcher WD5', base_price: 600 },
  { id: 7, name: 'Okami Q75', quantity: 1, description: 'Профессиональный пылесос Okami Q75', base_price: 1800 },
  { id: 8, name: 'DJI Mic 2', quantity: 1, description: 'Беспроводная микрофонная система DJI Mic 2', base_price: 1200 }
];

const defaultRentals = [
  {
    id: 1,
    equipment_id: 1,
    equipment_instance: 1,
    equipment_name: 'GoPro 13',
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    customer_name: 'Иван Петров',
    customer_phone: '+7 123 456-78-90',
    needs_delivery: true,
    delivery_address: 'ул. Ленина, 1',
    rental_price: 1500,
    delivery_price: 300,
    delivery_costs: 100,
    source: 'avito',
    comment: 'Тестовая аренда',
    status: 'active'
  },
  {
    id: 2,
    equipment_id: 1,
    equipment_instance: 2,
    equipment_name: 'GoPro 13',
    start_date: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // через 6 часов
    end_date: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // +6 часов
    customer_name: 'Мария Сидорова',
    customer_phone: '+7 987 654-32-10',
    needs_delivery: false,
    rental_price: 1500,
    delivery_price: 0,
    delivery_costs: 0,
    source: 'website',
    comment: 'Самовывоз',
    status: 'pending'
  },
  {
    id: 3,
    equipment_id: 2,
    equipment_instance: 1,
    equipment_name: 'DJI Osmo Pocket 3',
    start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // завтра
    end_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // +24 часа
    customer_name: 'Алексей Смирнов',
    customer_phone: '+7 555 123-45-67',
    needs_delivery: true,
    delivery_address: 'ул. Мира, 10',
    rental_price: 2000,
    delivery_price: 400,
    delivery_costs: 150,
    source: 'referral',
    comment: 'Важное мероприятие',
    status: 'pending'
  }
];

const defaultExpenses = [
  {
    id: 1,
    description: 'Бензин для доставки',
    amount: 2000,
    date: new Date().toISOString().split('T')[0],
    category: 'Топливо'
  }
];

// Initialize data
let equipment = savedData?.equipment || defaultEquipment;
let rentals = savedData?.rentals || defaultRentals;
let expenses = savedData?.expenses || defaultExpenses;

// Auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Токен доступа отсутствует' });
  }

  try {
    jwt.verify(token, 'demo-secret');
    next();
  } catch (error) {
    res.status(401).json({ error: 'Недействительный токен' });
  }
};

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { pinCode } = req.body;

  if (pinCode === '20031997') {
    const token = jwt.sign({ authenticated: true }, 'demo-secret', { expiresIn: '24h' });
    res.json({ token, message: 'Успешная авторизация' });
  } else {
    res.status(401).json({ error: 'Неверный пин-код' });
  }
});

app.get('/api/auth/verify', authMiddleware, (req, res) => {
  res.json({ authenticated: true });
});

// Equipment routes
app.get('/api/equipment', authMiddleware, (req, res) => {
  res.json(equipment);
});

app.post('/api/equipment', authMiddleware, (req, res) => {
  const newEquipment = {
    id: equipment.length + 1,
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  equipment.push(newEquipment);
  saveData();
  res.status(201).json(newEquipment);
});

app.put('/api/equipment/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const equipmentIndex = equipment.findIndex(e => e.id === id);

  if (equipmentIndex === -1) {
    return res.status(404).json({ error: 'Оборудование не найдено' });
  }

  equipment[equipmentIndex] = {
    ...equipment[equipmentIndex],
    ...req.body,
    updated_at: new Date().toISOString()
  };
  saveData();
  res.json(equipment[equipmentIndex]);
});

app.delete('/api/equipment/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const equipmentIndex = equipment.findIndex(e => e.id === id);

  if (equipmentIndex === -1) {
    return res.status(404).json({ error: 'Оборудование не найдено' });
  }

  equipment.splice(equipmentIndex, 1);
  saveData();
  res.status(204).send();
});

// Rentals routes
app.get('/api/rentals', authMiddleware, (req, res) => {
  res.json(rentals);
});

app.get('/api/rentals/gantt', authMiddleware, (req, res) => {
  res.json(rentals);
});

app.post('/api/rentals', authMiddleware, (req, res) => {
  const equipmentItem = equipment.find(e => e.id === req.body.equipment_id);
  const newRental = {
    id: rentals.length + 1,
    ...req.body,
    equipment_name: equipmentItem?.name || 'Unknown',
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  rentals.push(newRental);
  saveData();
  res.status(201).json(newRental);
});

app.put('/api/rentals/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const rentalIndex = rentals.findIndex(r => r.id === id);

  if (rentalIndex === -1) {
    return res.status(404).json({ error: 'Аренда не найдена' });
  }

  rentals[rentalIndex] = { ...rentals[rentalIndex], ...req.body };
  saveData();
  res.json(rentals[rentalIndex]);
});

app.delete('/api/rentals/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const rentalIndex = rentals.findIndex(r => r.id === id);

  if (rentalIndex === -1) {
    return res.status(404).json({ error: 'Аренда не найдена' });
  }

  rentals.splice(rentalIndex, 1);
  saveData();
  res.status(204).send();
});

// Customers routes
app.get('/api/customers', authMiddleware, (req, res) => {
  const customers = {};

  rentals.forEach(rental => {
    const key = `${rental.customer_name}_${rental.customer_phone}`;
    if (!customers[key]) {
      customers[key] = {
        customer_name: rental.customer_name,
        customer_phone: rental.customer_phone,
        rental_count: 0
      };
    }
    customers[key].rental_count++;
  });

  res.json(Object.values(customers));
});

// Expenses routes
app.get('/api/expenses', authMiddleware, (req, res) => {
  res.json(expenses);
});

app.post('/api/expenses', authMiddleware, (req, res) => {
  const newExpense = {
    id: expenses.length + 1,
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  expenses.push(newExpense);
  saveData();
  res.status(201).json(newExpense);
});

app.put('/api/expenses/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const expenseIndex = expenses.findIndex(e => e.id === id);

  if (expenseIndex === -1) {
    return res.status(404).json({ error: 'Расход не найден' });
  }

  expenses[expenseIndex] = {
    ...expenses[expenseIndex],
    ...req.body,
    updated_at: new Date().toISOString()
  };
  saveData();
  res.json(expenses[expenseIndex]);
});

app.delete('/api/expenses/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const expenseIndex = expenses.findIndex(e => e.id === id);

  if (expenseIndex === -1) {
    return res.status(404).json({ error: 'Расход не найден' });
  }

  expenses.splice(expenseIndex, 1);
  saveData();
  res.status(204).send();
});

// Analytics routes
app.get('/api/analytics/monthly-revenue', authMiddleware, (req, res) => {
  // Группировка аренд по месяцам
  const monthlyStats = {};
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  rentals.forEach(rental => {
    const rentalDate = new Date(rental.start_date);
    const year = rentalDate.getFullYear();
    const month = rentalDate.getMonth() + 1;
    const key = `${year}-${month}`;

    if (!monthlyStats[key]) {
      monthlyStats[key] = {
        year,
        month,
        month_name: monthNames[month - 1],
        total_revenue: 0,
        rental_count: 0
      };
    }

    monthlyStats[key].total_revenue += rental.rental_price + rental.delivery_price;
    monthlyStats[key].rental_count++;
  });

  // Преобразование в массив и сортировка по дате
  const monthlyData = Object.values(monthlyStats).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  res.json(monthlyData);
});

app.get('/api/analytics/financial-summary', authMiddleware, (req, res) => {
  const { year, month } = req.query;

  // Фильтрация аренд по году и месяцу
  let filteredRentals = rentals;
  if (year && month) {
    filteredRentals = rentals.filter(rental => {
      const rentalDate = new Date(rental.start_date);
      return rentalDate.getFullYear() === parseInt(year) &&
             rentalDate.getMonth() + 1 === parseInt(month);
    });
  }

  // Расчет доходов от аренд
  const rental_revenue = filteredRentals.reduce((sum, rental) => sum + rental.rental_price, 0);
  const delivery_revenue = filteredRentals.reduce((sum, rental) => sum + rental.delivery_price, 0);
  const total_revenue = rental_revenue + delivery_revenue;

  // Расчет расходов на доставку
  const delivery_costs = filteredRentals.reduce((sum, rental) => sum + rental.delivery_costs, 0);

  // Фильтрация операционных расходов по году и месяцу
  let filteredExpenses = expenses;
  if (year && month) {
    filteredExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getFullYear() === parseInt(year) &&
             expenseDate.getMonth() + 1 === parseInt(month);
    });
  }

  const operational_expenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const total_costs = delivery_costs + operational_expenses;
  const net_profit = total_revenue - total_costs;

  const summary = {
    total_revenue,
    rental_revenue,
    delivery_revenue,
    total_costs,
    delivery_costs,
    operational_expenses,
    net_profit,
    total_rentals: filteredRentals.length
  };

  res.json(summary);
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Demo server running'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Demo server running at http://localhost:${PORT}`);
  console.log(`📋 Use pin code: 20031997`);

  if (savedData) {
    console.log(`💾 Data loaded from ${DATA_FILE}`);
    console.log(`📦 Equipment: ${equipment.length} items`);
    console.log(`🏠 Rentals: ${rentals.length} items`);
    console.log(`💰 Expenses: ${expenses.length} items`);
  } else {
    console.log(`🆕 Using default data (no saved data found)`);
    // Save initial data
    saveData();
  }
});