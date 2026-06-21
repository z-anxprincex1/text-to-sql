"""
Sample SQLite database seeder.
Creates and populates 3 realistic tables for demo purposes.
Run directly: python sample_db.py
"""

import sqlite3
import os
import random
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "database.db")


def seed_database():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # ---------- employees ----------
    cur.executescript("""
        DROP TABLE IF EXISTS employees;
        CREATE TABLE employees (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT    NOT NULL,
            department  TEXT    NOT NULL,
            salary      REAL    NOT NULL,
            hire_date   TEXT    NOT NULL,
            is_active   INTEGER NOT NULL DEFAULT 1
        );

        DROP TABLE IF EXISTS products;
        CREATE TABLE products (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT    NOT NULL,
            category    TEXT    NOT NULL,
            price       REAL    NOT NULL,
            stock       INTEGER NOT NULL
        );

        DROP TABLE IF EXISTS orders;
        CREATE TABLE orders (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT    NOT NULL,
            product_id    INTEGER NOT NULL,
            quantity      INTEGER NOT NULL,
            order_date    TEXT    NOT NULL,
            total         REAL    NOT NULL,
            status        TEXT    NOT NULL DEFAULT 'completed',
            FOREIGN KEY (product_id) REFERENCES products(id)
        );
    """)

    # Employees
    departments = ["Engineering", "Marketing", "Sales", "HR", "Finance", "Design"]
    first_names = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace",
                   "Henry", "Iris", "Jack", "Kate", "Leo", "Mia", "Nate",
                   "Olivia", "Paul", "Quinn", "Rachel", "Sam", "Tina",
                   "Uma", "Victor", "Wendy", "Xavier", "Yara", "Zoe"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia",
                  "Miller", "Davis", "Martinez", "Wilson", "Anderson", "Thomas",
                  "Taylor", "Moore", "Jackson", "Martin", "Lee", "Thompson"]

    employees = []
    base_date = datetime(2018, 1, 1)
    for i in range(50):
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        dept = random.choice(departments)
        salary = round(random.uniform(45000, 180000), 2)
        days_offset = random.randint(0, 365 * 6)
        hire_date = (base_date + timedelta(days=days_offset)).strftime("%Y-%m-%d")
        is_active = 1 if random.random() > 0.1 else 0
        employees.append((name, dept, salary, hire_date, is_active))

    cur.executemany(
        "INSERT INTO employees (name, department, salary, hire_date, is_active) VALUES (?, ?, ?, ?, ?)",
        employees
    )

    # Products
    categories = ["Electronics", "Clothing", "Food", "Books", "Tools", "Sports"]
    product_names = {
        "Electronics": ["Laptop Pro", "Wireless Mouse", "USB-C Hub", "Monitor 4K", "Mechanical Keyboard",
                        "Webcam HD", "SSD 1TB", "RAM 32GB", "GPU RTX 4090", "Headphones"],
        "Clothing":    ["T-Shirt", "Jeans", "Hoodie", "Sneakers", "Jacket", "Socks", "Hat", "Gloves"],
        "Food":        ["Coffee Beans", "Granola Bar", "Protein Powder", "Green Tea", "Dark Chocolate"],
        "Books":       ["Clean Code", "DDIA", "Python Cookbook", "The Pragmatic Programmer", "SICP"],
        "Tools":       ["Drill Bit Set", "Screwdriver Kit", "Measuring Tape", "Level", "Hammer"],
        "Sports":      ["Yoga Mat", "Dumbbell 10kg", "Jump Rope", "Running Shoes", "Water Bottle"]
    }

    products = []
    for cat, names in product_names.items():
        for pname in names:
            price = round(random.uniform(5, 1500), 2)
            stock = random.randint(0, 500)
            products.append((pname, cat, price, stock))

    cur.executemany(
        "INSERT INTO products (name, category, price, stock) VALUES (?, ?, ?, ?)",
        products
    )

    num_products = len(products)

    # Orders
    customer_names = [f"{fn} {ln}" for fn in first_names[:15] for ln in last_names[:3]]
    statuses = ["completed", "pending", "shipped", "cancelled"]
    orders = []
    for _ in range(100):
        customer = random.choice(customer_names)
        pid = random.randint(1, num_products)
        qty = random.randint(1, 10)
        # Get price
        price = products[pid - 1][2]
        total = round(price * qty, 2)
        days_offset = random.randint(0, 730)
        order_date = (base_date + timedelta(days=days_offset + 365)).strftime("%Y-%m-%d")
        status = random.choice(statuses)
        orders.append((customer, pid, qty, order_date, total, status))

    cur.executemany(
        "INSERT INTO orders (customer_name, product_id, quantity, order_date, total, status) VALUES (?, ?, ?, ?, ?, ?)",
        orders
    )

    conn.commit()
    conn.close()
    print(f"[DB] Database seeded at: {DB_PATH}")
    print(f"[DB] Inserted: 50 employees, {len(products)} products, 100 orders")


if __name__ == "__main__":
    seed_database()
