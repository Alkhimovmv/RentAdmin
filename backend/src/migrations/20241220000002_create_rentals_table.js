exports.up = function(knex) {
  return knex.schema.createTable('rentals', (table) => {
    table.increments('id').primary();
    table.integer('equipment_id').unsigned().references('id').inTable('equipment').onDelete('CASCADE');
    table.timestamp('start_date').notNullable();
    table.timestamp('end_date').notNullable();
    table.string('customer_name').notNullable();
    table.string('customer_phone').notNullable();
    table.boolean('needs_delivery').defaultTo(false);
    table.text('delivery_address');
    table.decimal('rental_price', 10, 2).notNullable();
    table.decimal('delivery_price', 10, 2).defaultTo(0);
    table.decimal('delivery_costs', 10, 2).defaultTo(0);
    table.enum('source', ['авито', 'сайт', 'рекомендация', 'карты']).notNullable();
    table.text('comment');
    table.enum('status', ['pending', 'active', 'completed', 'overdue']).defaultTo('pending');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('rentals');
};