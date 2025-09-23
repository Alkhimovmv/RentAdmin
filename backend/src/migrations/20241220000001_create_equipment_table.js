exports.up = function(knex) {
  return knex.schema.createTable('equipment', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.integer('quantity').notNullable().defaultTo(1);
    table.text('description');
    table.decimal('base_price', 10, 2).defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('equipment');
};