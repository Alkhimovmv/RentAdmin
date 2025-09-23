exports.up = function(knex) {
  return knex.schema.createTable('expenses', (table) => {
    table.increments('id').primary();
    table.string('description').notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.date('date').notNullable();
    table.string('category');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('expenses');
};