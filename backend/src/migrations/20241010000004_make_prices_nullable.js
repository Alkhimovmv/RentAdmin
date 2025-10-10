exports.up = function(knex) {
  return knex.schema.alterTable('rentals', (table) => {
    // Делаем поля nullable
    table.decimal('rental_price', 10, 2).nullable().alter();
    table.decimal('delivery_price', 10, 2).nullable().alter();
    table.decimal('delivery_costs', 10, 2).nullable().alter();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('rentals', (table) => {
    // Возвращаем обратно с дефолтными значениями
    table.decimal('rental_price', 10, 2).notNullable().alter();
    table.decimal('delivery_price', 10, 2).defaultTo(0).alter();
    table.decimal('delivery_costs', 10, 2).defaultTo(0).alter();
  });
};
