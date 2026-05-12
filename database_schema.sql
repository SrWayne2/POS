-- Script de Creación de Base de Datos para el Sistema POS
-- Optimizado para Azure SQL Database (SQL Server)

-- 1. Creación de Tablas

-- Tabla Client (Clientes)
CREATE TABLE Client (
    id INT IDENTITY(1,1) PRIMARY KEY,
    document NVARCHAR(50) NOT NULL UNIQUE,
    name NVARCHAR(100) NOT NULL,
    phone NVARCHAR(50),
    client_type NVARCHAR(20) DEFAULT 'Minorista'
);

-- Tabla Product (Productos)
CREATE TABLE Product (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    barcode NVARCHAR(50) NOT NULL UNIQUE,
    price FLOAT NOT NULL,
    wholesale_price FLOAT NOT NULL DEFAULT 0.0,
    cost FLOAT NOT NULL,
    stock INT DEFAULT 0,
    origin NVARCHAR(20) DEFAULT 'Nacional'
);

-- Tabla Sale (Ventas)
CREATE TABLE Sale (
    id INT IDENTITY(1,1) PRIMARY KEY,
    date DATETIME DEFAULT GETDATE(),
    total FLOAT NOT NULL,
    payment_method NVARCHAR(50) DEFAULT 'Efectivo',
    sale_type NVARCHAR(20) DEFAULT 'Detal',
    client_id INT NULL,
    CONSTRAINT FK_Sale_Client FOREIGN KEY (client_id) REFERENCES Client(id)
);

-- Tabla SaleItem (Detalle de Venta)
CREATE TABLE SaleItem (
    id INT IDENTITY(1,1) PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price FLOAT NOT NULL,
    CONSTRAINT FK_SaleItem_Sale FOREIGN KEY (sale_id) REFERENCES Sale(id),
    CONSTRAINT FK_SaleItem_Product FOREIGN KEY (product_id) REFERENCES Product(id)
);

-- Tabla InventoryMovement (Movimientos de Inventario)
CREATE TABLE InventoryMovement (
    id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NOT NULL,
    type NVARCHAR(10) NOT NULL, -- 'IN' or 'OUT'
    quantity INT NOT NULL,
    date DATETIME DEFAULT GETDATE(),
    reason NVARCHAR(200),
    CONSTRAINT FK_InventoryMovement_Product FOREIGN KEY (product_id) REFERENCES Product(id)
);

-- 2. Inserción de Datos de Prueba

-- Insertar Clientes
INSERT INTO Client (document, name, phone, client_type) 
VALUES 
('123456789', 'Consumidor Frecuente', '3000000000', 'Minorista'),
('987654321', 'Distribuidor Mayorista', '3111111111', 'Mayorista');

-- Insertar Productos
INSERT INTO Product (name, barcode, price, wholesale_price, cost, stock, origin)
VALUES 
('Camiseta Deportiva', '123456789', 45000, 35000, 20000, 50, 'Nacional'),
('Zapatillas Running', '987654321', 150000, 120000, 90000, 30, 'Importado');

-- Insertar Movimiento Inicial de Inventario para los productos insertados
INSERT INTO InventoryMovement (product_id, type, quantity, reason)
VALUES 
((SELECT id FROM Product WHERE barcode = '123456789'), 'IN', 50, 'Inventario inicial'),
((SELECT id FROM Product WHERE barcode = '987654321'), 'IN', 30, 'Inventario inicial');
