exports.seed = async function(knex) {
  await knex('equipment').del();

  await knex('equipment').insert([
    { name: 'GoPro 13', quantity: 6, description: 'Экшн-камера GoPro Hero 13', base_price: 1500 },
    { name: 'DJI Osmo Pocket 3', quantity: 2, description: 'Карманная 4К камера с стабилизатором', base_price: 2000 },
    { name: 'Karcher SC4', quantity: 5, description: 'Пароочиститель Karcher SC4', base_price: 800 },
    { name: 'Karcher Puzzi 8/1', quantity: 8, description: 'Моющий пылесос Karcher Puzzi 8/1', base_price: 1000 },
    { name: 'Karcher Puzzi 10/1', quantity: 1, description: 'Моющий пылесос Karcher Puzzi 10/1', base_price: 1200 },
    { name: 'Karcher WD5', quantity: 1, description: 'Хозяйственный пылесос Karcher WD5', base_price: 600 },
    { name: 'Okami Q75', quantity: 1, description: 'Профессиональный пылесос Okami Q75', base_price: 1800 },
    { name: 'DJI Mic 2', quantity: 1, description: 'Беспроводная микрофонная система DJI Mic 2', base_price: 1200 }
  ]);
};