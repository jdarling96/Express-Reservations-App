/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.fullName;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map((c) => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  static async search(name) {
    if (!name.includes(" ")) {
      const err = new Error(`Couldnt find: ${name}`);
      err.status = 404;
      throw err;
    }

    const fullName = name.split(" ");

    fullName[0] = fullName[0].charAt(0).toUpperCase() + fullName[0].slice(1);
    fullName[1] = fullName[1].charAt(0).toUpperCase() + fullName[1].slice(1);

    const result = await db.query(
      `SELECT id,
      first_name AS "firstName",  
      last_name AS "lastName" 
       FROM customers
       WHERE first_name LIKE $1 AND
       last_name LIKE $2`,
      [fullName[0], fullName[1]]
    );

    const customer = result.rows[0];
    if (customer === undefined) {
      const err = new Error(`Couldnt find: ${name}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  static async bestCustomers() {
    const results = await db.query(
      `SELECT c.id,c.first_name AS "firstName",c.last_name AS "lastName",c.phone,c.notes,COUNT(customer_id) 
      AS numberofres
      FROM reservations
      JOIN customers AS c ON customer_id=c.id
      GROUP BY c.id, c.first_name, c.last_name, customer_id
      ORDER BY COUNT(customer_id) DESC LIMIT 10
      
       `
    )
    console.log(results.rows) 
    return results.rows.map((c) => new Customer(c));
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }

  fullName() {
    this.fullName = this.firstName.concat(" ", this.lastName);
  }
}

module.exports = Customer;
